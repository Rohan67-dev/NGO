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
import com.ngo.impact.repository.CartItemRepository;
import com.ngo.impact.repository.CartRepository;
import com.ngo.impact.repository.ProductRepository;
import com.ngo.impact.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartDTO getCartByUserId(Long userId) {
        Cart cart = getOrCreateCartForUser(userId);
        return mapToCartDTO(cart);
    }

    @Transactional
    public CartDTO addToCart(Long userId, AddToCartRequest request) {
        Cart cart = getOrCreateCartForUser(userId);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (product.getStatus() != Product.Status.ACTIVE || product.getStockQuantity() < request.getQuantity()) {
            throw new BadRequestException("Insufficient stock available for " + product.getName());
        }

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());
        BigDecimal activePrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            if (newQuantity > product.getStockQuantity()) {
                throw new BadRequestException("Cannot add more than available stock (" + product.getStockQuantity() + ")");
            }
            existingItem.setQuantity(newQuantity);
            existingItem.setPriceAtAddition(activePrice);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .priceAtAddition(activePrice)
                    .build();
            cart.getItems().add(newItem);
            cartRepository.save(cart);
        }

        return getCartByUserId(userId);
    }

    @Transactional
    public CartDTO updateCartItemQuantity(Long userId, Long cartItemId, Integer quantity) {
        Cart cart = getOrCreateCartForUser(userId);
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to user");
        }

        if (quantity <= 0) {
            cartItemRepository.delete(cartItem);
        } else {
            if (quantity > cartItem.getProduct().getStockQuantity()) {
                throw new BadRequestException("Cannot exceed available stock");
            }
            cartItem.setQuantity(quantity);
            cartItemRepository.save(cartItem);
        }

        return getCartByUserId(userId);
    }

    @Transactional
    public CartDTO removeCartItem(Long userId, Long cartItemId) {
        Cart cart = getOrCreateCartForUser(userId);
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to user");
        }

        cartItemRepository.delete(cartItem);
        return getCartByUserId(userId);
    }

    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getOrCreateCartForUser(userId);
        cartItemRepository.deleteByCartId(cart.getId());
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
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = itemDTOs.stream().mapToInt(CartItemDTO::getQuantity).sum();

        return CartDTO.builder()
                .id(cart.getId())
                .userId(cart.getUser().getId())
                .items(itemDTOs)
                .subtotal(subtotal)
                .totalItems(totalItems)
                .build();
    }

    private CartItemDTO mapToItemDTO(CartItem item) {
        Product p = item.getProduct();
        BigDecimal effectivePrice = p.getDiscountPrice() != null ? p.getDiscountPrice() : p.getPrice();
        BigDecimal itemTotal = effectivePrice.multiply(BigDecimal.valueOf(item.getQuantity()));
        String image = p.getImages() != null && !p.getImages().isEmpty() ? p.getImages().get(0).getImageUrl() : null;

        return CartItemDTO.builder()
                .id(item.getId())
                .productId(p.getId())
                .productName(p.getName())
                .productSlug(p.getSlug())
                .imageUrl(image)
                .price(p.getPrice())
                .discountPrice(p.getDiscountPrice())
                .impactDescription(p.getImpactDescription())
                .quantity(item.getQuantity())
                .stockQuantity(p.getStockQuantity())
                .itemTotal(itemTotal)
                .build();
    }
}
