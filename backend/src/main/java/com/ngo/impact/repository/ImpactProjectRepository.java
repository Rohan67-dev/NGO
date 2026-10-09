package com.ngo.impact.repository;

import com.ngo.impact.entity.ImpactProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImpactProjectRepository extends JpaRepository<ImpactProject, Long> {
    List<ImpactProject> findByStatus(ImpactProject.Status status);
}
