package com.ngo.impact.service;

import com.ngo.impact.dto.AddToCartRequest;
import com.ngo.impact.dto.CartDTO;
import com.ngo.impact.dto.CartItemDTO;
import com.ngo.impact.entity.Cart;
import com.ngo.impact.entity.CartItem;
import com.ngo.impact.entity.Product;
import com.ngo.impact.entity.User;
import com.ngo.impact.exception.BadRequestException;
import com.ngo.impact.exception.ResourceNotFoundException;
import com.ngo.impact.repository.CartRepository;
import com.ngo.impact.repository.ProductRepository;
import com.ngo.impact.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private static final int MAX_QUANTITY_PER_ITEM = 99;

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Value("${app.order.free-shipping-threshold:999}")
    private BigDecimal freeShippingThreshold;

    @Value("${app.order.shipping-fee:99}")
    private BigDecimal shippingFee;

    @Value("${app.order.tax-rate:0.05}")
    private BigDecimal taxRate;

    @Transactional
    public CartDTO getCartByUserId(Long userId) {
        Cart cart = getOrCreateCartForUser(userId);
        return mapToCartDTO(cart);
    }

    @Transactional
    public CartDTO addToCart(Long userId, AddToCartRequest request) {
        Cart cart = getOrCreateCartForUser(userId);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (product.getStatus() != Product.Status.ACTIVE || product.getStockQuantity() <= 0) {
            throw new BadRequestException(product.getName() + " is currently unavailable");
        }

        CartItem existing = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(product.getId()))
                .findFirst().orElse(null);
        int newQuantity = request.getQuantity() + (existing != null ? existing.getQuantity() : 0);

        if (newQuantity > product.getStockQuantity()) {
            throw new BadRequestException("Only " + product.getStockQuantity() + " of " + product.getName()
                    + " available" + (existing != null ? " (you already have " + existing.getQuantity() + " in your cart)" : ""));
        }
        if (newQuantity > MAX_QUANTITY_PER_ITEM) {
            throw new BadRequestException("Maximum " + MAX_QUANTITY_PER_ITEM + " units per product");
        }

        BigDecimal activePrice = OrderService.effectivePrice(product);
        if (existing != null) {
            existing.setQuantity(newQuantity);
            existing.setPriceAtAddition(activePrice);
        } else {
            cart.getItems().add(CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .priceAtAddition(activePrice)
                    .build());
        }
        return mapToCartDTO(cartRepository.saveAndFlush(cart));
    }

    @Transactional
    public CartDTO updateCartItemQuantity(Long userId, Long cartItemId, Integer quantity) {
        if (quantity == null) {
            throw new BadRequestException("Quantity is required");
        }
        Cart cart = getOrCreateCartForUser(userId);
        CartItem cartItem = findOwnItem(cart, cartItemId);

        if (quantity <= 0) {
            cart.getItems().remove(cartItem);
        } else {
            Product product = cartItem.getProduct();
            boolean increasing = quantity > cartItem.getQuantity();
            if (increasing && product.getStatus() != Product.Status.ACTIVE) {
                throw new BadRequestException(product.getName() + " is currently unavailable");
            }
            if (increasing && quantity > product.getStockQuantity()) {
                throw new BadRequestException("Only " + product.getStockQuantity() + " of " + product.getName() + " available");
            }
            if (quantity > MAX_QUANTITY_PER_ITEM) {
                throw new BadRequestException("Maximum " + MAX_QUANTITY_PER_ITEM + " units per product");
            }
            cartItem.setQuantity(quantity);
        }
        return mapToCartDTO(cartRepository.saveAndFlush(cart));
    }

    @Transactional
    public CartDTO removeCartItem(Long userId, Long cartItemId) {
        Cart cart = getOrCreateCartForUser(userId);
        cart.getItems().remove(findOwnItem(cart, cartItemId));
        return mapToCartDTO(cartRepository.saveAndFlush(cart));
    }

    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getOrCreateCartForUser(userId);
        cart.getItems().clear(); // orphanRemoval deletes the rows
        cartRepository.save(cart);
    }

    /** Removes the given products from the user's cart (used after a successful payment). */
    @Transactional
    public void removeProducts(Long userId, Collection<Long> productIds) {
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            Set<Long> ids = new HashSet<>(productIds);
            cart.getItems().removeIf(i -> ids.contains(i.getProduct().getId()));
            cartRepository.save(cart);
        });
    }

    /** Looks the item up inside the caller's own cart, so other users' item ids are indistinguishable from missing ones. */
    private CartItem findOwnItem(Cart cart, Long cartItemId) {
        return cart.getItems().stream()
                .filter(i -> i.getId().equals(cartItemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
    }

    private Cart getOrCreateCartForUser(Long userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                    Cart newCart = Cart.builder().user(user).items(new ArrayList<>()).build();
                    return cartRepository.save(newCart);
                });
    }

    private CartDTO mapToCartDTO(Cart cart) {
        List<CartItemDTO> itemDTOs = cart.getItems() != null ?
                cart.getItems().stream().map(this::mapToItemDTO).collect(Collectors.toList()) : new ArrayList<>();

        BigDecimal subtotal = itemDTOs.stream()
                .map(CartItemDTO::getItemTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        int totalItems = itemDTOs.stream().mapToInt(CartItemDTO::getQuantity).sum();

        // Same formula as OrderService.createOrder, so the cart and checkout summary match the final order.
        BigDecimal shipping = itemDTOs.isEmpty() || subtotal.compareTo(freeShippingThreshold) >= 0
                ? BigDecimal.ZERO.setScale(2) : shippingFee.setScale(2, RoundingMode.HALF_UP);
        BigDecimal tax = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);

        return CartDTO.builder()
                .id(cart.getId())
                .userId(cart.getUser().getId())
                .items(itemDTOs)
                .subtotal(subtotal)
                .totalItems(totalItems)
                .shippingAmount(shipping)
                .taxAmount(tax)
                .taxRatePercent(taxRate.movePointRight(2).stripTrailingZeros())
                .totalAmount(subtotal.add(shipping).add(tax))
                .freeShippingThreshold(freeShippingThreshold)
                .hasUnavailableItems(itemDTOs.stream().anyMatch(i -> !Boolean.TRUE.equals(i.getAvailable())))
                .build();
    }

    private CartItemDTO mapToItemDTO(CartItem item) {
        Product p = item.getProduct();
        BigDecimal effectivePrice = OrderService.effectivePrice(p);
        BigDecimal itemTotal = effectivePrice.multiply(BigDecimal.valueOf(item.getQuantity())).setScale(2, RoundingMode.HALF_UP);
        String image = p.getImages() != null && !p.getImages().isEmpty() ? p.getImages().get(0).getImageUrl() : null;
        boolean available = p.getStatus() == Product.Status.ACTIVE && p.getStockQuantity() >= item.getQuantity();

        return CartItemDTO.builder()
                .id(item.getId())
                .productId(p.getId())
                .productName(p.getName())
                .productSlug(p.getSlug())
                .imageUrl(image)
                .price(p.getPrice())
                .discountPrice(p.getDiscountPrice())
                .unitPrice(effectivePrice)
                .impactDescription(p.getImpactDescription())
                .quantity(item.getQuantity())
                .stockQuantity(p.getStockQuantity())
                .available(available)
                .itemTotal(itemTotal)
                .build();
    }
}
