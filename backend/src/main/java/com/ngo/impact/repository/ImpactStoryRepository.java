package com.ngo.impact.repository;

import com.ngo.impact.entity.ImpactStory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ImpactStoryRepository extends JpaRepository<ImpactStory, Long> {
    Optional<ImpactStory> findBySlug(String slug);
    Page<ImpactStory> findByPublishedTrueOrderByPublishedAtDesc(Pageable pageable);
}
