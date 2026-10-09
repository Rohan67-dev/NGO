package com.ngo.impact.service;

import com.ngo.impact.dto.AddressDTO;
import com.ngo.impact.dto.CreateOrderRequest;
import com.ngo.impact.dto.OrderDTO;
import com.ngo.impact.dto.OrderItemDTO;
import com.ngo.impact.entity.*;
import com.ngo.impact.exception.BadRequestException;
import com.ngo.impact.exception.ResourceNotFoundException;
import com.ngo.impact.repository.CartRepository;
import com.ngo.impact.repository.OrderRepository;
import com.ngo.impact.repository.PaymentRepository;
import com.ngo.impact.repository.ProductRepository;
import com.ngo.impact.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    /**
     * Allowed administrative order-status transitions. CONFIRMED is reached only through verified payment,
     * never by hand, so an unpaid order cannot be shipped.
     */
    private static final Map<Order.OrderStatus, Set<Order.OrderStatus>> ADMIN_TRANSITIONS = new EnumMap<>(Order.OrderStatus.class);

    static {
        ADMIN_TRANSITIONS.put(Order.OrderStatus.PENDING, EnumSet.of(Order.OrderStatus.CANCELLED));
        ADMIN_TRANSITIONS.put(Order.OrderStatus.CONFIRMED, EnumSet.of(Order.OrderStatus.PROCESSING, Order.OrderStatus.PACKED,
                Order.OrderStatus.SHIPPED, Order.OrderStatus.CANCELLED));
        ADMIN_TRANSITIONS.put(Order.OrderStatus.PROCESSING, EnumSet.of(Order.OrderStatus.PACKED, Order.OrderStatus.SHIPPED,
                Order.OrderStatus.CANCELLED));
        ADMIN_TRANSITIONS.put(Order.OrderStatus.PACKED, EnumSet.of(Order.OrderStatus.SHIPPED, Order.OrderStatus.CANCELLED));
        ADMIN_TRANSITIONS.put(Order.OrderStatus.SHIPPED, EnumSet.of(Order.OrderStatus.OUT_FOR_DELIVERY, Order.OrderStatus.DELIVERED));
        ADMIN_TRANSITIONS.put(Order.OrderStatus.OUT_FOR_DELIVERY, EnumSet.of(Order.OrderStatus.DELIVERED));
        ADMIN_TRANSITIONS.put(Order.OrderStatus.DELIVERED, EnumSet.of(Order.OrderStatus.REFUNDED));
        ADMIN_TRANSITIONS.put(Order.OrderStatus.CANCELLED, EnumSet.of(Order.OrderStatus.REFUNDED));
        ADMIN_TRANSITIONS.put(Order.OrderStatus.REFUNDED, EnumSet.noneOf(Order.OrderStatus.class));
    }

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final AddressService addressService;

    @Value("${app.order.free-shipping-threshold:999}")
    private BigDecimal freeShippingThreshold;

    @Value("${app.order.shipping-fee:99}")
    private BigDecimal shippingFee;

    @Value("${app.order.tax-rate:0.05}")
    private BigDecimal taxRate;

    @Transactional
    public OrderDTO createOrder(Long userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Shopping cart is empty"));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BadRequestException("Cannot checkout with an empty cart");
        }

        // Validate stock & calculate immutable totals server-side. Client prices are never used.
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            if (cartItem.getQuantity() == null || cartItem.getQuantity() <= 0) {
                throw new BadRequestException("Invalid quantity for " + product.getName());
            }
            if (product.getStatus() != Product.Status.ACTIVE) {
                throw new BadRequestException(product.getName() + " is no longer available. Please remove it from your cart.");
            }
            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new BadRequestException("Only " + product.getStockQuantity() + " left of " + product.getName()
                        + ". Please reduce the quantity in your cart.");
            }

            BigDecimal unitPrice = effectivePrice(product);
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity())).setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(lineTotal);

            orderItems.add(OrderItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .productSku(product.getSku())
                    .impactDescriptionSnapshot(product.getImpactDescription())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(lineTotal)
                    .build());
        }

        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);
        BigDecimal discountAmount = BigDecimal.ZERO.setScale(2);
        BigDecimal shippingAmount = (subtotal.compareTo(freeShippingThreshold) >= 0 ? BigDecimal.ZERO : shippingFee)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxAmount = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(shippingAmount).add(taxAmount).subtract(discountAmount);

        String addressSnapshot = formatAddress(request.getShippingAddress());

        // Idempotency: a retried/double-submitted checkout for the same cart reuses the existing unpaid order
        // instead of creating a duplicate.
        Optional<Order> duplicate = orderRepository
                .findByUserIdAndPaymentStatusInAndOrderStatusOrderByCreatedAtDesc(userId,
                        List.of(Order.PaymentStatus.PENDING, Order.PaymentStatus.FAILED), Order.OrderStatus.PENDING)
                .stream()
                .filter(o -> sameLines(o.getItems(), orderItems) && o.getTotalAmount().compareTo(totalAmount) == 0)
                .findFirst();
        if (duplicate.isPresent()) {
            Order existing = duplicate.get();
            existing.setShippingAddressSnapshot(addressSnapshot);
            log.info("Reusing pending order {} for repeated checkout by user {}", existing.getOrderNumber(), userId);
            return mapToDTO(orderRepository.save(existing));
        }

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .user(user)
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .shippingAmount(shippingAmount)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .paymentStatus(Order.PaymentStatus.PENDING)
                .orderStatus(Order.OrderStatus.PENDING)
                .shippingAddressSnapshot(addressSnapshot)
                .items(new ArrayList<>())
                .build();

        for (OrderItem item : orderItems) {
            item.setOrder(order);
            order.getItems().add(item);
        }

        Order savedOrder = orderRepository.save(order);

        if (Boolean.TRUE.equals(request.getSaveAddress())) {
            addressService.saveIfNew(userId, request.getShippingAddress());
        }

        // Stock is decremented and the cart cleared only after verified payment (see PaymentService).
        return mapToDTO(savedOrder);
    }

    public List<OrderDTO> getCustomerOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /** Customer access: only the owner may read an order (staff use the admin endpoints). */
    public OrderDTO getOrderForCustomer(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            // 404 rather than 403 so order ids cannot be probed
            throw new ResourceNotFoundException("Order not found");
        }
        return mapToDTO(order);
    }

    public OrderDTO getOrderAdmin(Long orderId) {
        return mapToDTO(orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found")));
    }

    public Page<OrderDTO> getAllOrdersAdmin(int page, int size) {
        return searchOrdersAdmin(null, null, null, page, size);
    }

    public Page<OrderDTO> searchOrdersAdmin(String orderStatus, String paymentStatus, String query, int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by("createdAt").descending());
        return orderRepository.searchAdmin(
                        StringUtils.hasText(orderStatus) ? parseOrderStatus(orderStatus) : null,
                        StringUtils.hasText(paymentStatus) ? parsePaymentStatus(paymentStatus) : null,
                        StringUtils.hasText(query) ? query.trim() : null,
                        pageable)
                .map(this::mapToDTO);
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, String newStatusStr, String trackingNumber, String carrier) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Order.OrderStatus current = order.getOrderStatus();
        Order.OrderStatus target = parseOrderStatus(newStatusStr);

        if (target != current) {
            Set<Order.OrderStatus> allowed = ADMIN_TRANSITIONS.getOrDefault(current, Set.of());
            if (!allowed.contains(target)) {
                throw new BadRequestException("Cannot change order status from " + current + " to " + target
                        + (allowed.isEmpty() ? " (no further changes allowed)" : ". Allowed: " + allowed));
            }
            if (target == Order.OrderStatus.REFUNDED && order.getPaymentStatus() != Order.PaymentStatus.PAID) {
                throw new BadRequestException("Only paid orders can be marked as refunded");
            }
            if (target == Order.OrderStatus.SHIPPED && !StringUtils.hasText(trackingNumber) && !StringUtils.hasText(order.getTrackingNumber())) {
                throw new BadRequestException("A tracking number is required to mark an order as shipped");
            }

            if (target == Order.OrderStatus.CANCELLED) {
                cancel(order);
            } else if (target == Order.OrderStatus.REFUNDED) {
                // Records a refund issued in the payment provider's dashboard. Returned goods are not restocked
                // automatically because their condition is unknown - adjust stock in Products if they are resellable.
                order.setOrderStatus(Order.OrderStatus.REFUNDED);
                order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
                paymentRepository.findByOrderId(order.getId()).ifPresent(p -> {
                    p.setStatus(Payment.Status.REFUNDED);
                    paymentRepository.save(p);
                });
            } else {
                order.setOrderStatus(target);
            }
        }

        if (StringUtils.hasText(trackingNumber)) {
            order.setTrackingNumber(trackingNumber.trim());
        }
        if (StringUtils.hasText(carrier)) {
            order.setShippingCarrier(carrier.trim());
        }

        return mapToDTO(orderRepository.save(order));
    }

    /** Customers may cancel their own orders until payment is completed. */
    @Transactional
    public OrderDTO cancelOrderByCustomer(Long orderId, Long userId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .filter(o -> o.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (order.getOrderStatus() != Order.OrderStatus.PENDING || order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            throw new BadRequestException("This order can no longer be cancelled online. Please contact us for help.");
        }
        cancel(order);
        return mapToDTO(orderRepository.save(order));
    }

    private void cancel(Order order) {
        // Stock was only taken when payment was confirmed, so give it back only for paid orders.
        if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
            restoreStock(order);
            log.warn("Paid order {} cancelled - a refund of {} must be issued through the payment provider",
                    order.getOrderNumber(), order.getTotalAmount());
        }
        order.setOrderStatus(Order.OrderStatus.CANCELLED);
    }

    private void restoreStock(Order order) {
        order.getItems().stream()
                .sorted(Comparator.comparing(i -> i.getProduct().getId()))
                .forEach(item -> {
                    Product p = productRepository.findByIdForUpdate(item.getProduct().getId()).orElse(null);
                    if (p == null) return;
                    p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
                    ProductService.syncStockStatus(p);
                    productRepository.save(p);
                });
    }

    public OrderDTO mapToDTO(Order order) {
        List<OrderItemDTO> itemDTOs = order.getItems() != null ?
                order.getItems().stream().map(this::mapToItemDTO).collect(Collectors.toList()) : new ArrayList<>();

        String razorpayOrdId = order.getPayment() != null ? order.getPayment().getRazorpayOrderId() : null;

        return OrderDTO.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser().getId())
                .customerName(order.getUser().getFirstName() + " " + order.getUser().getLastName())
                .customerEmail(order.getUser().getEmail())
                .customerPhone(order.getUser().getPhone())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .shippingAmount(order.getShippingAmount())
                .taxAmount(order.getTaxAmount())
                .totalAmount(order.getTotalAmount())
                .paymentStatus(order.getPaymentStatus().name())
                .orderStatus(order.getOrderStatus().name())
                .shippingAddressSnapshot(order.getShippingAddressSnapshot())
                .trackingNumber(order.getTrackingNumber())
                .shippingCarrier(order.getShippingCarrier())
                .items(itemDTOs)
                .razorpayOrderId(razorpayOrdId)
                .allowedNextStatuses(ADMIN_TRANSITIONS.getOrDefault(order.getOrderStatus(), Set.of()).stream()
                        .filter(s -> s != Order.OrderStatus.REFUNDED || order.getPaymentStatus() == Order.PaymentStatus.PAID)
                        .map(Enum::name).sorted().collect(Collectors.toList()))
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private OrderItemDTO mapToItemDTO(OrderItem item) {
        String imgUrl = item.getProduct().getImages() != null && !item.getProduct().getImages().isEmpty() ?
                item.getProduct().getImages().get(0).getImageUrl() : null;

        return OrderItemDTO.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productSlug(item.getProduct().getSlug())
                .productName(item.getProductName())
                .productSku(item.getProductSku())
                .impactDescriptionSnapshot(item.getImpactDescriptionSnapshot())
                .imageUrl(imgUrl)
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .build();
    }

    public static BigDecimal effectivePrice(Product product) {
        return product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();
    }

    private static boolean sameLines(List<OrderItem> a, List<OrderItem> b) {
        if (a.size() != b.size()) return false;
        Map<Long, Integer> qa = a.stream().collect(Collectors.toMap(i -> i.getProduct().getId(), OrderItem::getQuantity, Integer::sum));
        Map<Long, Integer> qb = b.stream().collect(Collectors.toMap(i -> i.getProduct().getId(), OrderItem::getQuantity, Integer::sum));
        return qa.equals(qb);
    }

    private static String formatAddress(AddressDTO addr) {
        StringBuilder sb = new StringBuilder();
        sb.append(addr.getFullName().trim()).append(", ").append(addr.getAddressLine1().trim());
        if (StringUtils.hasText(addr.getAddressLine2())) {
            sb.append(", ").append(addr.getAddressLine2().trim());
        }
        sb.append(", ").append(addr.getCity().trim())
                .append(", ").append(addr.getState().trim())
                .append(" - ").append(addr.getPostalCode().trim())
                .append(", ").append(addr.getCountry().trim())
                .append(". Phone: ").append(addr.getPhone().trim());
        return sb.toString();
    }

    private static String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    private static Order.OrderStatus parseOrderStatus(String s) {
        try {
            return Order.OrderStatus.valueOf(s.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BadRequestException("Invalid order status: " + s);
        }
    }

    private static Order.PaymentStatus parsePaymentStatus(String s) {
        try {
            return Order.PaymentStatus.valueOf(s.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid payment status: " + s);
        }
    }
}
