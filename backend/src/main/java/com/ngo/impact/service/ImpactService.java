package com.ngo.impact.service;

import com.ngo.impact.dto.CampaignDTO;
import com.ngo.impact.dto.ImpactMetricDTO;
import com.ngo.impact.dto.ImpactProjectDTO;
import com.ngo.impact.dto.ImpactStoryDTO;
import com.ngo.impact.entity.*;
import com.ngo.impact.exception.ResourceNotFoundException;
import com.ngo.impact.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImpactService {

    private final ImpactMetricRepository impactMetricRepository;
    private final ImpactProjectRepository impactProjectRepository;
    private final CampaignRepository campaignRepository;
    private final ImpactStoryRepository impactStoryRepository;
    private final ContactMessageRepository contactMessageRepository;
    private final AnnouncementRepository announcementRepository;

    // Metrics
    public List<ImpactMetricDTO> getActiveMetrics() {
        return impactMetricRepository.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::mapMetricToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ImpactMetricDTO saveMetric(ImpactMetricDTO dto) {
        ImpactMetric metric = ImpactMetric.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .value(dto.getValue())
                .unit(dto.getUnit())
                .icon(dto.getIcon())
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();
        return mapMetricToDTO(impactMetricRepository.save(metric));
    }

    // Projects
    public List<ImpactProjectDTO> getActiveProjects() {
        return impactProjectRepository.findByStatus(ImpactProject.Status.ACTIVE).stream()
                .map(this::mapProjectToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ImpactProjectDTO saveProject(ImpactProjectDTO dto) {
        ImpactProject project = ImpactProject.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .location(dto.getLocation())
                .beneficiariesCount(dto.getBeneficiariesCount())
                .imageUrl(dto.getImageUrl())
                .status(dto.getStatus() != null ? ImpactProject.Status.valueOf(dto.getStatus()) : ImpactProject.Status.ACTIVE)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .build();
        return mapProjectToDTO(impactProjectRepository.save(project));
    }

    // Campaigns
    public List<CampaignDTO> getActiveCampaigns() {
        return campaignRepository.findByStatus(Campaign.Status.ACTIVE).stream()
                .map(this::mapCampaignToDTO)
                .collect(Collectors.toList());
    }

    public CampaignDTO getCampaignBySlug(String slug) {
        Campaign campaign = campaignRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        return mapCampaignToDTO(campaign);
    }

    @Transactional
    public CampaignDTO saveCampaign(CampaignDTO dto) {
        String slug = dto.getSlug() != null ? dto.getSlug() : generateSlug(dto.getTitle());
        Campaign campaign = Campaign.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .slug(slug)
                .description(dto.getDescription())
                .targetAmount(dto.getTargetAmount())
                .currentAmount(dto.getCurrentAmount() != null ? dto.getCurrentAmount() : BigDecimal.ZERO)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .imageUrl(dto.getImageUrl())
                .status(dto.getStatus() != null ? Campaign.Status.valueOf(dto.getStatus()) : Campaign.Status.ACTIVE)
                .featured(dto.getFeatured() != null ? dto.getFeatured() : false)
                .build();
        return mapCampaignToDTO(campaignRepository.save(campaign));
    }

    // Stories
    public Page<ImpactStoryDTO> getPublishedStories(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return impactStoryRepository.findByPublishedTrueOrderByPublishedAtDesc(pageable).map(this::mapStoryToDTO);
    }

    public ImpactStoryDTO getStoryBySlug(String slug) {
        ImpactStory story = impactStoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        return mapStoryToDTO(story);
    }

    @Transactional
    public ImpactStoryDTO saveStory(ImpactStoryDTO dto) {
        String slug = dto.getSlug() != null ? dto.getSlug() : generateSlug(dto.getTitle());
        ImpactStory story = ImpactStory.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .slug(slug)
                .excerpt(dto.getExcerpt())
                .content(dto.getContent())
                .imageUrl(dto.getImageUrl())
                .author(dto.getAuthor())
                .published(dto.getPublished() != null ? dto.getPublished() : true)
                .publishedAt(dto.getPublishedAt())
                .build();
        return mapStoryToDTO(impactStoryRepository.save(story));
    }

    // Contact form submission
    @Transactional
    public void submitContactMessage(String name, String email, String phone, String subject, String message) {
        ContactMessage contact = ContactMessage.builder()
                .name(name)
                .email(email)
                .phone(phone)
                .subject(subject)
                .message(message)
                .status(ContactMessage.Status.NEW)
                .build();
        contactMessageRepository.save(contact);
    }

    // Active Announcements
    public List<Announcement> getActiveAnnouncements() {
        return announcementRepository.findByActiveTrue();
    }

    // DTO Mappers
    private ImpactMetricDTO mapMetricToDTO(ImpactMetric m) {
        return ImpactMetricDTO.builder()
                .id(m.getId())
                .title(m.getTitle())
                .description(m.getDescription())
                .value(m.getValue())
                .unit(m.getUnit())
                .icon(m.getIcon())
                .displayOrder(m.getDisplayOrder())
                .active(m.getActive())
                .build();
    }

    private ImpactProjectDTO mapProjectToDTO(ImpactProject p) {
        return ImpactProjectDTO.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .location(p.getLocation())
                .beneficiariesCount(p.getBeneficiariesCount())
                .imageUrl(p.getImageUrl())
                .status(p.getStatus().name())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .build();
    }

    private CampaignDTO mapCampaignToDTO(Campaign c) {
        double progress = 0.0;
        if (c.getTargetAmount() != null && c.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            progress = c.getCurrentAmount().divide(c.getTargetAmount(), 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
        }
        return CampaignDTO.builder()
                .id(c.getId())
                .title(c.getTitle())
                .slug(c.getSlug())
                .description(c.getDescription())
                .targetAmount(c.getTargetAmount())
                .currentAmount(c.getCurrentAmount())
                .progressPercentage(Math.min(100.0, progress))
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .imageUrl(c.getImageUrl())
                .status(c.getStatus().name())
                .featured(c.getFeatured())
                .build();
    }

    private ImpactStoryDTO mapStoryToDTO(ImpactStory s) {
        return ImpactStoryDTO.builder()
                .id(s.getId())
                .title(s.getTitle())
                .slug(s.getSlug())
                .excerpt(s.getExcerpt())
                .content(s.getContent())
                .imageUrl(s.getImageUrl())
                .author(s.getAuthor())
                .published(s.getPublished())
                .publishedAt(s.getPublishedAt() != null ? s.getPublishedAt() : s.getCreatedAt())
                .build();
    }

    private String generateSlug(String input) {
        return input.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-");
    }
}
