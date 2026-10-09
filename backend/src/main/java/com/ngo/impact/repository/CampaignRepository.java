package com.ngo.impact.repository;

import com.ngo.impact.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    Optional<Campaign> findBySlug(String slug);
    List<Campaign> findByStatus(Campaign.Status status);
    List<Campaign> findByFeaturedTrueAndStatus(Campaign.Status status);
}
