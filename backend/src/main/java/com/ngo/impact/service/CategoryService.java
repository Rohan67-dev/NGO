package com.ngo.impact.service;

import com.ngo.impact.dto.CategoryDTO;
import com.ngo.impact.entity.Category;
import com.ngo.impact.entity.Product;
import com.ngo.impact.exception.BadRequestException;
import com.ngo.impact.exception.ConflictException;
import com.ngo.impact.exception.ResourceNotFoundException;
import com.ngo.impact.repository.CategoryRepository;
import com.ngo.impact.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    /** Storefront: active categories with the number of visible products. */
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findByActiveTrue().stream()
                .map(c -> mapToDTO(c, productRepository.countByCategoryIdAndStatus(c.getId(), Product.Status.ACTIVE)
                        + productRepository.countByCategoryIdAndStatus(c.getId(), Product.Status.OUT_OF_STOCK)))
                .collect(Collectors.toList());
    }

    /** Admin: every category including hidden ones, with total product counts. */
    public List<CategoryDTO> getAllCategoriesAdmin() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(c -> mapToDTO(c, productRepository.countByCategoryId(c.getId())))
                .collect(Collectors.toList());
    }

    public CategoryDTO getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .filter(Category::getActive)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with slug: " + slug));
        return mapToDTO(category);
    }

    @Transactional
    public CategoryDTO createCategory(CategoryDTO request) {
        String name = request.getName().trim();
        String slug = SlugUtil.slugify(name);
        if (slug.isEmpty()) {
            throw new BadRequestException("Category name must contain letters or numbers");
        }
        if (categoryRepository.existsBySlug(slug) || categoryRepository.findByNameIgnoreCase(name).isPresent()) {
            throw new BadRequestException("Category with similar name already exists");
        }

        Category category = Category.builder()
                .name(name)
                .slug(slug)
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .active(request.getActive() == null || request.getActive())
                .build();

        return mapToDTO(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDTO updateCategory(Long id, CategoryDTO request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        String name = request.getName().trim();
        categoryRepository.findByNameIgnoreCase(name)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new BadRequestException("Another category is already called " + name);
                });
        // The slug is kept stable on rename so existing links keep working.
        category.setName(name);
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());
        if (request.getActive() != null) {
            category.setActive(request.getActive());
        }

        return mapToDTO(categoryRepository.save(category));
    }

    /** Deletes an empty category. Categories that still hold products must be emptied or hidden instead. */
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        long products = productRepository.countByCategoryId(id);
        if (products > 0) {
            throw new ConflictException("This category still contains " + products
                    + " product(s). Move them to another category or hide the category instead of deleting it.");
        }
        categoryRepository.delete(category);
    }

    public CategoryDTO mapToDTO(Category category) {
        return mapToDTO(category, null);
    }

    private CategoryDTO mapToDTO(Category category, Long productCount) {
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .imageUrl(category.getImageUrl())
                .active(category.getActive())
                .productCount(productCount)
                .build();
    }
}
