package com.ngo.impact.service;

import com.ngo.impact.dto.CreateProductRequest;
import com.ngo.impact.dto.ProductDTO;
import com.ngo.impact.entity.Category;
import com.ngo.impact.entity.Product;
import com.ngo.impact.entity.ProductImage;
import com.ngo.impact.exception.BadRequestException;
import com.ngo.impact.exception.ResourceNotFoundException;
import com.ngo.impact.repository.CategoryRepository;
import com.ngo.impact.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public Page<ProductDTO> searchProducts(Long categoryId, String query, String sortBy, String sortDir, int page, int size) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Product> productPage = productRepository.searchProducts(Product.Status.ACTIVE, categoryId, query, pageable);
        return productPage.map(this::mapToDTO);
    }

    public List<ProductDTO> getFeaturedProducts() {
        return productRepository.findByFeaturedTrueAndStatus(Product.Status.ACTIVE).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public ProductDTO getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with slug: " + slug));
        return mapToDTO(product);
    }

    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return mapToDTO(product);
    }

    @Transactional
    public ProductDTO createProduct(CreateProductRequest request) {
        if (productRepository.findBySku(request.getSku()).isPresent()) {
            throw new BadRequestException("Product SKU already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        String slug = generateSlug(request.getName());
        int counter = 1;
        String baseSlug = slug;
        while (productRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + counter++;
        }

        Product product = Product.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .shortDescription(request.getShortDescription())
                .price(request.getPrice())
                .discountPrice(request.getDiscountPrice())
                .sku(request.getSku())
                .stockQuantity(request.getStockQuantity())
                .category(category)
                .impactDescription(request.getImpactDescription())
                .impactAmount(request.getImpactAmount())
                .status(request.getStatus() != null ? Product.Status.valueOf(request.getStatus()) : Product.Status.ACTIVE)
                .featured(request.getFeatured() != null ? request.getFeatured() : false)
                .images(new ArrayList<>())
                .build();

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            int order = 0;
            for (String url : request.getImageUrls()) {
                ProductImage img = ProductImage.builder()
                        .product(product)
                        .imageUrl(url)
                        .altText(product.getName())
                        .sortOrder(order++)
                        .build();
                product.getImages().add(img);
            }
        }

        return mapToDTO(productRepository.save(product));
    }

    @Transactional
    public ProductDTO updateProduct(Long id, CreateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setShortDescription(request.getShortDescription());
        product.setPrice(request.getPrice());
        product.setDiscountPrice(request.getDiscountPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setCategory(category);
        product.setImpactDescription(request.getImpactDescription());
        product.setImpactAmount(request.getImpactAmount());
        
        if (request.getStatus() != null) {
            product.setStatus(Product.Status.valueOf(request.getStatus()));
        }
        if (request.getFeatured() != null) {
            product.setFeatured(request.getFeatured());
        }

        if (request.getImageUrls() != null) {
            product.getImages().clear();
            int order = 0;
            for (String url : request.getImageUrls()) {
                ProductImage img = ProductImage.builder()
                        .product(product)
                        .imageUrl(url)
                        .altText(product.getName())
                        .sortOrder(order++)
                        .build();
                product.getImages().add(img);
            }
        }

        return mapToDTO(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        productRepository.delete(product);
    }

    public ProductDTO mapToDTO(Product product) {
        List<String> imageUrls = product.getImages() != null ?
                product.getImages().stream().map(ProductImage::getImageUrl).collect(Collectors.toList()) : new ArrayList<>();

        return ProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .shortDescription(product.getShortDescription())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .sku(product.getSku())
                .stockQuantity(product.getStockQuantity())
                .categoryId(product.getCategory().getId())
                .categoryName(product.getCategory().getName())
                .categorySlug(product.getCategory().getSlug())
                .impactDescription(product.getImpactDescription())
                .impactAmount(product.getImpactAmount())
                .status(product.getStatus().name())
                .featured(product.getFeatured())
                .imageUrls(imageUrls)
                .createdAt(product.getCreatedAt())
                .build();
    }

    private String generateSlug(String input) {
        return input.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-");
    }
}
