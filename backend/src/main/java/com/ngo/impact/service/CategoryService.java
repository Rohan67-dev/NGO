package com.ngo.impact.service;

import com.ngo.impact.dto.CategoryDTO;
import com.ngo.impact.entity.Category;
import com.ngo.impact.exception.BadRequestException;
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

    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findByActiveTrue().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public CategoryDTO getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with slug: " + slug));
        return mapToDTO(category);
    }

    @Transactional
    public CategoryDTO createCategory(CategoryDTO request) {
        String slug = generateSlug(request.getName());
        if (categoryRepository.existsBySlug(slug)) {
            throw new BadRequestException("Category with similar name already exists");
        }

        Category category = Category.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .active(true)
                .build();

        return mapToDTO(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDTO updateCategory(Long id, CategoryDTO request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());
        if (request.getActive() != null) {
            category.setActive(request.getActive());
        }

        return mapToDTO(categoryRepository.save(category));
    }

    public CategoryDTO mapToDTO(Category category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .imageUrl(category.getImageUrl())
                .active(category.getActive())
                .build();
    }

    private String generateSlug(String input) {
        return input.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-");
    }
}
