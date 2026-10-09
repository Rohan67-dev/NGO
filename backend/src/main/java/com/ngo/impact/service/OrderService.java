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
import com.ngo.impact.repository.ProductRepository;
import com.ngo.impact.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartService cartService;

    @Transactional
    public OrderDTO createOrder(Long userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Shopping cart is empty"));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BadRequestException("Cannot checkout with an empty cart");
        }

        // Validate stock & calculate immutable totals server-side
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            if (product.getStatus() != Product.Status.ACTIVE || product.getStockQuantity() < cartItem.getQuantity()) {
                throw new BadRequestException("Product out of stock: " + product.getName());
            }

            BigDecimal unitPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .productSku(product.getSku())
                    .impactDescriptionSnapshot(product.getImpactDescription())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(lineTotal)
                    .build();

            orderItems.add(orderItem);
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal shippingAmount = subtotal.compareTo(new BigDecimal("999")) >= 0 ? BigDecimal.ZERO : new BigDecimal("99"); // Free shipping over 999
        BigDecimal taxAmount = subtotal.multiply(new BigDecimal("0.05")); // 5% GST
        BigDecimal totalAmount = subtotal.add(shippingAmount).add(taxAmount).subtract(discountAmount);

        AddressDTO addr = request.getShippingAddress();
        String addressSnapshot = String.format("%s, %s, %s, %s, %s - %s. Phone: %s",
                addr.getFullName(), addr.getAddressLine1(),
                addr.getAddressLine2() != null ? addr.getAddressLine2() : "",
                addr.getCity(), addr.getState(), addr.getPostalCode(), addr.getPhone());

        String orderNumber = "ORD-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Order order = Order.builder()
                .orderNumber(orderNumber)
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

        // Note: Cart will be cleared upon successful payment verification
        return mapToDTO(savedOrder);
    }

    public List<OrderDTO> getCustomerOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public OrderDTO getOrderById(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (userId != null && !order.getUser().getId().equals(userId)) {
            User current = userRepository.findById(userId).orElseThrow();
            if (current.getRole() == User.Role.CUSTOMER) {
                throw new BadRequestException("Unauthorized access to order");
            }
        }

        return mapToDTO(order);
    }

    public Page<OrderDTO> getAllOrdersAdmin(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return orderRepository.findAll(pageable).map(this::mapToDTO);
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, String newStatusStr, String trackingNumber, String carrier) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(newStatusStr);
        order.setOrderStatus(newStatus);
        if (trackingNumber != null && !trackingNumber.isBlank()) {
            order.setTrackingNumber(trackingNumber);
        }
        if (carrier != null && !carrier.isBlank()) {
            order.setShippingCarrier(carrier);
        }

        return mapToDTO(orderRepository.save(order));
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
                .createdAt(order.getCreatedAt())
                .build();
    }

    private OrderItemDTO mapToItemDTO(OrderItem item) {
        String imgUrl = item.getProduct().getImages() != null && !item.getProduct().getImages().isEmpty() ?
                item.getProduct().getImages().get(0).getImageUrl() : null;

        return OrderItemDTO.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProductName())
                .productSku(item.getProductSku())
                .impactDescriptionSnapshot(item.getImpactDescriptionSnapshot())
                .imageUrl(imgUrl)
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .build();
    }
}
