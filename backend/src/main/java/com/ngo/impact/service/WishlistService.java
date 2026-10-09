package com.ngo.impact.service;

import com.ngo.impact.dto.ProductDTO;
import com.ngo.impact.entity.Product;
import com.ngo.impact.entity.User;
import com.ngo.impact.entity.Wishlist;
import com.ngo.impact.exception.ResourceNotFoundException;
import com.ngo.impact.repository.ProductRepository;
import com.ngo.impact.repository.UserRepository;
import com.ngo.impact.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    public List<ProductDTO> getUserWishlist(Long userId) {
        return wishlistRepository.findByUserId(userId).stream()
                .map(wish -> productService.mapToDTO(wish.getProduct()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void addToWishlist(Long userId, Long productId) {
        if (wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            return; // Idempotent add
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Wishlist wishlist = Wishlist.builder()
                .user(user)
                .product(product)
                .build();
        wishlistRepository.save(wishlist);
    }

    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }
}
