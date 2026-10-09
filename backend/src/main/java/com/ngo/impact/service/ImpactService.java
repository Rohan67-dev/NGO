package com.ngo.impact.service;

import com.ngo.impact.dto.AnnouncementDTO;
import com.ngo.impact.dto.CampaignDTO;
import com.ngo.impact.dto.ContactMessageDTO;
import com.ngo.impact.dto.ImpactMetricDTO;
import com.ngo.impact.dto.ImpactProjectDTO;
import com.ngo.impact.dto.ImpactStoryDTO;
import com.ngo.impact.entity.*;
import com.ngo.impact.exception.BadRequestException;
import com.ngo.impact.exception.ResourceNotFoundException;
import com.ngo.impact.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.function.Predicate;
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

    // ---------------------------------------------------------------- Metrics

    public List<ImpactMetricDTO> getActiveMetrics() {
        return impactMetricRepository.findByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::mapMetricToDTO)
                .collect(Collectors.toList());
    }

    public List<ImpactMetricDTO> getAllMetrics() {
        return impactMetricRepository.findAll(Sort.by("displayOrder", "id")).stream()
                .map(this::mapMetricToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ImpactMetricDTO saveMetric(ImpactMetricDTO dto) {
        ImpactMetric metric = dto.getId() != null
                ? impactMetricRepository.findById(dto.getId()).orElseThrow(() -> new ResourceNotFoundException("Metric not found"))
                : new ImpactMetric();
        metric.setTitle(dto.getTitle().trim());
        metric.setDescription(dto.getDescription());
        metric.setValue(dto.getValue());
        metric.setUnit(dto.getUnit());
        metric.setIcon(dto.getIcon());
        metric.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);
        metric.setActive(dto.getActive() != null ? dto.getActive() : Boolean.TRUE);
        return mapMetricToDTO(impactMetricRepository.save(metric));
    }

    @Transactional
    public void deleteMetric(Long id) {
        impactMetricRepository.delete(impactMetricRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Metric not found")));
    }

    // ---------------------------------------------------------------- Projects

    public List<ImpactProjectDTO> getActiveProjects() {
        return impactProjectRepository.findByStatus(ImpactProject.Status.ACTIVE).stream()
                .map(this::mapProjectToDTO)
                .collect(Collectors.toList());
    }

    public List<ImpactProjectDTO> getAllProjects() {
        return impactProjectRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .map(this::mapProjectToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ImpactProjectDTO saveProject(ImpactProjectDTO dto) {
        ImpactProject project = dto.getId() != null
                ? impactProjectRepository.findById(dto.getId()).orElseThrow(() -> new ResourceNotFoundException("Project not found"))
                : new ImpactProject();
        project.setTitle(dto.getTitle().trim());
        project.setDescription(dto.getDescription());
        project.setLocation(dto.getLocation());
        project.setBeneficiariesCount(dto.getBeneficiariesCount());
        project.setImageUrl(dto.getImageUrl());
        project.setStatus(dto.getStatus() != null ? parseEnum(ImpactProject.Status.class, dto.getStatus(), "project status") : ImpactProject.Status.ACTIVE);
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        validateDates(dto.getStartDate(), dto.getEndDate());
        return mapProjectToDTO(impactProjectRepository.save(project));
    }

    @Transactional
    public void deleteProject(Long id) {
        impactProjectRepository.delete(impactProjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found")));
    }

    // ---------------------------------------------------------------- Campaigns

    public List<CampaignDTO> getActiveCampaigns() {
        return campaignRepository.findByStatus(Campaign.Status.ACTIVE).stream()
                .map(this::mapCampaignToDTO)
                .collect(Collectors.toList());
    }

    public List<CampaignDTO> getAllCampaigns() {
        return campaignRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .map(this::mapCampaignToDTO)
                .collect(Collectors.toList());
    }

    public CampaignDTO getCampaignBySlug(String slug) {
        Campaign campaign = campaignRepository.findBySlug(slug)
                .filter(c -> c.getStatus() != Campaign.Status.CANCELLED)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        return mapCampaignToDTO(campaign);
    }

    @Transactional
    public CampaignDTO saveCampaign(CampaignDTO dto) {
        Campaign campaign = dto.getId() != null
                ? campaignRepository.findById(dto.getId()).orElseThrow(() -> new ResourceNotFoundException("Campaign not found"))
                : new Campaign();
        if (campaign.getSlug() == null) {
            String requested = StringUtils.hasText(dto.getSlug()) ? dto.getSlug() : dto.getTitle();
            campaign.setSlug(uniqueSlug(requested, s -> campaignRepository.findBySlug(s).isPresent()));
        }
        if (dto.getCurrentAmount() != null && dto.getCurrentAmount().signum() < 0) {
            throw new BadRequestException("Raised amount cannot be negative");
        }
        validateDates(dto.getStartDate(), dto.getEndDate());
        campaign.setTitle(dto.getTitle().trim());
        campaign.setDescription(dto.getDescription());
        campaign.setTargetAmount(dto.getTargetAmount());
        campaign.setCurrentAmount(dto.getCurrentAmount() != null ? dto.getCurrentAmount() : BigDecimal.ZERO);
        campaign.setStartDate(dto.getStartDate());
        campaign.setEndDate(dto.getEndDate());
        campaign.setImageUrl(dto.getImageUrl());
        campaign.setStatus(dto.getStatus() != null ? parseEnum(Campaign.Status.class, dto.getStatus(), "campaign status") : Campaign.Status.ACTIVE);
        campaign.setFeatured(dto.getFeatured() != null ? dto.getFeatured() : Boolean.FALSE);
        return mapCampaignToDTO(campaignRepository.save(campaign));
    }

    @Transactional
    public void deleteCampaign(Long id) {
        campaignRepository.delete(campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found")));
    }

    // ---------------------------------------------------------------- Stories

    public Page<ImpactStoryDTO> getPublishedStories(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)));
        return impactStoryRepository.findByPublishedTrueOrderByPublishedAtDesc(pageable).map(this::mapStoryToDTO);
    }

    public Page<ImpactStoryDTO> getAllStories(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by(Sort.Direction.DESC, "createdAt"));
        return impactStoryRepository.findAll(pageable).map(this::mapStoryToDTO);
    }

    public ImpactStoryDTO getStoryBySlug(String slug) {
        ImpactStory story = impactStoryRepository.findBySlug(slug)
                .filter(ImpactStory::getPublished)
                .orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        return mapStoryToDTO(story);
    }

    @Transactional
    public ImpactStoryDTO saveStory(ImpactStoryDTO dto) {
        ImpactStory story = dto.getId() != null
                ? impactStoryRepository.findById(dto.getId()).orElseThrow(() -> new ResourceNotFoundException("Story not found"))
                : new ImpactStory();
        if (story.getSlug() == null) {
            String requested = StringUtils.hasText(dto.getSlug()) ? dto.getSlug() : dto.getTitle();
            story.setSlug(uniqueSlug(requested, s -> impactStoryRepository.findBySlug(s).isPresent()));
        }
        boolean publish = dto.getPublished() != null ? dto.getPublished() : true;
        story.setTitle(dto.getTitle().trim());
        story.setExcerpt(dto.getExcerpt());
        story.setContent(dto.getContent());
        story.setImageUrl(dto.getImageUrl());
        story.setAuthor(dto.getAuthor());
        story.setPublished(publish);
        if (publish && story.getPublishedAt() == null) {
            story.setPublishedAt(dto.getPublishedAt() != null ? dto.getPublishedAt() : LocalDateTime.now());
        }
        return mapStoryToDTO(impactStoryRepository.save(story));
    }

    @Transactional
    public void deleteStory(Long id) {
        impactStoryRepository.delete(impactStoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Story not found")));
    }

    // ---------------------------------------------------------------- Contact messages

    @Transactional
    public void submitContactMessage(String name, String email, String phone, String subject, String message) {
        ContactMessage contact = ContactMessage.builder()
                .name(name.trim())
                .email(email.trim())
                .phone(phone)
                .subject(subject.trim())
                .message(message)
                .status(ContactMessage.Status.NEW)
                .build();
        contactMessageRepository.save(contact);
    }

    public Page<ContactMessageDTO> getContactMessages(String status, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 100)), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ContactMessage> result = StringUtils.hasText(status)
                ? contactMessageRepository.findByStatus(parseEnum(ContactMessage.Status.class, status, "message status"), pageable)
                : contactMessageRepository.findAll(pageable);
        return result.map(this::mapContactToDTO);
    }

    @Transactional
    public ContactMessageDTO updateContactStatus(Long id, String status) {
        ContactMessage msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        msg.setStatus(parseEnum(ContactMessage.Status.class, status, "message status"));
        return mapContactToDTO(contactMessageRepository.save(msg));
    }

    public long countNewContactMessages() {
        return contactMessageRepository.countByStatus(ContactMessage.Status.NEW);
    }

    // ---------------------------------------------------------------- Announcements

    public List<AnnouncementDTO> getActiveAnnouncements() {
        return announcementRepository.findByActiveTrue().stream().map(this::mapAnnouncementToDTO).collect(Collectors.toList());
    }

    public List<AnnouncementDTO> getAllAnnouncements() {
        return announcementRepository.findAll(Sort.by(Sort.Direction.DESC, "id")).stream()
                .map(this::mapAnnouncementToDTO).collect(Collectors.toList());
    }

    @Transactional
    public AnnouncementDTO saveAnnouncement(AnnouncementDTO dto) {
        Announcement a = dto.getId() != null
                ? announcementRepository.findById(dto.getId()).orElseThrow(() -> new ResourceNotFoundException("Announcement not found"))
                : new Announcement();
        if (StringUtils.hasText(dto.getLinkUrl()) && !dto.getLinkUrl().startsWith("/") && !dto.getLinkUrl().startsWith("https://")) {
            throw new BadRequestException("Link must be a site path (e.g. /shop) or an https:// URL");
        }
        a.setTitle(dto.getTitle().trim());
        a.setContent(dto.getContent());
        a.setLinkUrl(StringUtils.hasText(dto.getLinkUrl()) ? dto.getLinkUrl().trim() : null);
        a.setActive(dto.getActive() != null ? dto.getActive() : Boolean.TRUE);
        return mapAnnouncementToDTO(announcementRepository.save(a));
    }

    @Transactional
    public void deleteAnnouncement(Long id) {
        announcementRepository.delete(announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found")));
    }

    // ---------------------------------------------------------------- Mappers & helpers

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

    private ContactMessageDTO mapContactToDTO(ContactMessage m) {
        return ContactMessageDTO.builder()
                .id(m.getId()).name(m.getName()).email(m.getEmail()).phone(m.getPhone())
                .subject(m.getSubject()).message(m.getMessage()).status(m.getStatus().name())
                .createdAt(m.getCreatedAt()).build();
    }

    private AnnouncementDTO mapAnnouncementToDTO(Announcement a) {
        return AnnouncementDTO.builder()
                .id(a.getId()).title(a.getTitle()).content(a.getContent()).linkUrl(a.getLinkUrl())
                .active(a.getActive()).createdAt(a.getCreatedAt()).build();
    }

    private static String uniqueSlug(String source, Predicate<String> exists) {
        String base = SlugUtil.slugify(source);
        if (base.isEmpty()) base = "item";
        String slug = base;
        int counter = 2;
        while (exists.test(slug)) {
            slug = base + "-" + counter++;
        }
        return slug;
    }

    private static void validateDates(java.time.LocalDate start, java.time.LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new BadRequestException("End date cannot be before start date");
        }
    }

    private static <E extends Enum<E>> E parseEnum(Class<E> type, String value, String label) {
        try {
            return Enum.valueOf(type, value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid " + label + ": " + value);
        }
    }
}
