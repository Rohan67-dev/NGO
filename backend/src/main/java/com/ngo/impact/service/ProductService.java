package com.ngo.impact.service;

import com.ngo.impact.dto.CreateProductRequest;
import com.ngo.impact.dto.ProductDTO;
import com.ngo.impact.entity.Category;
import com.ngo.impact.entity.Product;
import com.ngo.impact.entity.ProductImage;
import com.ngo.impact.exception.BadRequestException;
import com.ngo.impact.exception.ResourceNotFoundException;
import com.ngo.impact.repository.CartItemRepository;
import com.ngo.impact.repository.CategoryRepository;
import com.ngo.impact.repository.OrderItemRepository;
import com.ngo.impact.repository.ProductRepository;
import com.ngo.impact.repository.WishlistRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    /** Client-facing sort keys mapped to entity attributes. Anything else is rejected. */
    private static final Map<String, String> SORT_FIELDS = Map.of(
            "createdAt", "createdAt",
            "price", "price",
            "name", "name",
            "stockQuantity", "stockQuantity"
    );
    private static final int MAX_PAGE_SIZE = 100;

    /** Products visible on the storefront. OUT_OF_STOCK products stay visible but cannot be bought. */
    private static final Set<Product.Status> STOREFRONT_STATUSES = EnumSet.of(Product.Status.ACTIVE, Product.Status.OUT_OF_STOCK);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final WishlistRepository wishlistRepository;
    private final ObjectMapper objectMapper;

    public Page<ProductDTO> searchProducts(Long categoryId, String query, String sortBy, String sortDir, int page, int size) {
        return searchProducts(categoryId, query, null, null, false, sortBy, sortDir, page, size);
    }

    public Page<ProductDTO> searchProducts(Long categoryId, String query, BigDecimal minPrice, BigDecimal maxPrice,
                                           boolean inStockOnly, String sortBy, String sortDir, int page, int size) {
        return productRepository.searchProducts(STOREFRONT_STATUSES, categoryId, normalizeQuery(query), minPrice, maxPrice,
                        inStockOnly, pageable(sortBy, sortDir, page, size))
                .map(this::mapToDTO);
    }

    /** Admin listing: every status, so archived / inactive products can be found and re-enabled. */
    public Page<ProductDTO> searchProductsAdmin(Long categoryId, String query, String status, String sortBy, String sortDir, int page, int size) {
        Set<Product.Status> statuses = StringUtils.hasText(status)
                ? EnumSet.of(parseStatus(status))
                : EnumSet.allOf(Product.Status.class);
        return productRepository.searchProducts(statuses, categoryId, normalizeQuery(query), null, null, false,
                        pageable(sortBy, sortDir, page, size))
                .map(this::mapToDTO);
    }

    public List<ProductDTO> getFeaturedProducts() {
        return productRepository.findByFeaturedTrueAndStatus(Product.Status.ACTIVE).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /** Public product page. Inactive (archived) products are hidden from customers. */
    public ProductDTO getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .filter(p -> p.getStatus() != Product.Status.INACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with slug: " + slug));
        return mapToDTO(product);
    }

    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .filter(p -> p.getStatus() != Product.Status.INACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return mapToDTO(product);
    }

    public ProductDTO getProductByIdAdmin(Long id) {
        return mapToDTO(productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id)));
    }

    public List<ProductDTO> getRelatedProducts(String slug, int limit) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with slug: " + slug));
        return productRepository.findByCategoryIdAndStatusAndIdNot(product.getCategory().getId(), Product.Status.ACTIVE,
                        product.getId(), PageRequest.of(0, Math.max(1, Math.min(limit, 12))))
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public ProductDTO createProduct(CreateProductRequest request) {
        if (productRepository.findBySku(request.getSku().trim()).isPresent()) {
            throw new BadRequestException("Product SKU already exists");
        }
        validatePricing(request.getPrice(), request.getDiscountPrice());

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Product product = Product.builder()
                .name(request.getName().trim())
                .slug(uniqueSlug(request.getName(), null))
                .sku(request.getSku().trim())
                .category(category)
                .status(Product.Status.ACTIVE)
                .featured(false)
                .images(new ArrayList<>())
                .build();
        applyRequest(product, request);
        return mapToDTO(productRepository.save(product));
    }

    @Transactional
    public ProductDTO updateProduct(Long id, CreateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        validatePricing(request.getPrice(), request.getDiscountPrice());

        String newSku = request.getSku().trim();
        if (!newSku.equals(product.getSku())) {
            productRepository.findBySku(newSku).ifPresent(other -> {
                throw new BadRequestException("Another product already uses SKU " + newSku);
            });
            product.setSku(newSku);
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        product.setName(request.getName().trim());
        product.setCategory(category);
        applyRequest(product, request);
        return mapToDTO(productRepository.save(product));
    }

    /**
     * Products that appear in historical orders are archived (status INACTIVE) rather than deleted,
     * so order history keeps its product reference. Never-ordered products are deleted outright.
     *
     * @return true when the product was archived instead of deleted
     */
    @Transactional
    public boolean deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        cartItemRepository.deleteByProductId(id);
        wishlistRepository.deleteByProductId(id);
        if (orderItemRepository.existsByProductId(id)) {
            product.setStatus(Product.Status.INACTIVE);
            product.setFeatured(false);
            productRepository.save(product);
            return true;
        }
        productRepository.delete(product);
        return false;
    }

    /** Copies request fields onto the entity and keeps OUT_OF_STOCK / ACTIVE consistent with the stock level. */
    private void applyRequest(Product product, CreateProductRequest request) {
        product.setDescription(request.getDescription());
        product.setShortDescription(request.getShortDescription());
        product.setPrice(request.getPrice());
        product.setDiscountPrice(request.getDiscountPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setImpactDescription(request.getImpactDescription());
        product.setImpactAmount(request.getImpactAmount());
        product.setSourceSerialNo(blankToNull(request.getSourceSerialNo()));
        product.setBrand(blankToNull(request.getBrand()));
        product.setManufacturer(blankToNull(request.getManufacturer()));
        product.setHsnCode(blankToNull(request.getHsnCode()));
        product.setGstRate(request.getGstRate());
        product.setMaterial(blankToNull(request.getMaterial()));
        product.setDimensions(blankToNull(request.getDimensions()));
        product.setColour(blankToNull(request.getColour()));
        product.setListingStatus(blankToNull(request.getListingStatus()));
        if (request.getFeatured() != null) {
            product.setFeatured(request.getFeatured());
        }
        if (request.getStatus() != null) {
            product.setStatus(parseStatus(request.getStatus()));
        }
        syncStockStatus(product);

        if (request.getImageUrls() != null) {
            product.getImages().clear();
            int order = 0;
            for (String url : request.getImageUrls()) {
                if (!StringUtils.hasText(url)) continue;
                product.getImages().add(ProductImage.builder()
                        .product(product)
                        .imageUrl(url.trim())
                        .altText(product.getName())
                        .sortOrder(order++)
                        .build());
            }
        }
    }

    /** ACTIVE with zero stock becomes OUT_OF_STOCK; OUT_OF_STOCK with stock becomes ACTIVE. INACTIVE is left alone. */
    public static void syncStockStatus(Product product) {
        if (product.getStatus() == Product.Status.ACTIVE && product.getStockQuantity() <= 0) {
            product.setStatus(Product.Status.OUT_OF_STOCK);
        } else if (product.getStatus() == Product.Status.OUT_OF_STOCK && product.getStockQuantity() > 0) {
            product.setStatus(Product.Status.ACTIVE);
        }
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
                .sourceSerialNo(product.getSourceSerialNo())
                .brand(product.getBrand())
                .manufacturer(product.getManufacturer())
                .hsnCode(product.getHsnCode())
                .gstRate(product.getGstRate())
                .material(product.getMaterial())
                .dimensions(product.getDimensions())
                .colour(product.getColour())
                .listingStatus(product.getListingStatus())
                .extraAttributes(readExtraAttributes(product.getExtraAttributes()))
                .createdAt(product.getCreatedAt())
                .build();
    }

    public String uniqueSlug(String name, Long excludeId) {
        String base = SlugUtil.slugify(name);
        if (base.isEmpty()) base = "product";
        String slug = base;
        int counter = 1;
        while (true) {
            var existing = productRepository.findBySlug(slug);
            if (existing.isEmpty() || existing.get().getId().equals(excludeId)) return slug;
            slug = base + "-" + counter++;
        }
    }

    private Pageable pageable(String sortBy, String sortDir, int page, int size) {
        String field = SORT_FIELDS.get(sortBy);
        if (field == null) {
            throw new BadRequestException("Unsupported sort field: " + sortBy + ". Use one of " + SORT_FIELDS.keySet());
        }
        Sort sort = "asc".equalsIgnoreCase(sortDir) ? Sort.by(field).ascending() : Sort.by(field).descending();
        return PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, MAX_PAGE_SIZE)), sort.and(Sort.by("id")));
    }

    private void validatePricing(BigDecimal price, BigDecimal discountPrice) {
        if (discountPrice != null && discountPrice.compareTo(price) > 0) {
            throw new BadRequestException("Discount price cannot be higher than the regular price");
        }
    }

    private Product.Status parseStatus(String status) {
        try {
            return Product.Status.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid product status: " + status);
        }
    }

    private static String normalizeQuery(String query) {
        return StringUtils.hasText(query) ? query.trim() : null;
    }

    private Map<String, String> readExtraAttributes(String json) {
        if (!StringUtils.hasText(json)) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<java.util.LinkedHashMap<String, String>>() {});
        } catch (Exception e) {
            return null;
        }
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
