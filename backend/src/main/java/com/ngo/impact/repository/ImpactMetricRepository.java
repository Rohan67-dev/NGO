package com.ngo.impact.repository;

import com.ngo.impact.entity.ImpactMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImpactMetricRepository extends JpaRepository<ImpactMetric, Long> {
    List<ImpactMetric> findByActiveTrueOrderByDisplayOrderAsc();
}
