package com.ngo.impact.repository;

import com.ngo.impact.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    Optional<Category> findByNameIgnoreCase(String name);
    List<Category> findAllByOrderByNameAsc();
    List<Category> findByActiveTrue();
    Boolean existsByName(String name);
    Boolean existsBySlug(String slug);
}
