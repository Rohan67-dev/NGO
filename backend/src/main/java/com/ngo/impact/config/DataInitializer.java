package com.ngo.impact.config;

import com.ngo.impact.entity.*;
import com.ngo.impact.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ImpactMetricRepository impactMetricRepository;
    private final ImpactProjectRepository impactProjectRepository;
    private final CampaignRepository campaignRepository;
    private final ImpactStoryRepository impactStoryRepository;
    private final AnnouncementRepository announcementRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.demo-data:true}")
    private boolean seedDemoData;

    @Value("${APP_ADMIN_EMAIL:}")
    private String bootstrapAdminEmail;

    @Value("${APP_ADMIN_PASSWORD:}")
    private String bootstrapAdminPassword;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        bootstrapAdminFromEnvironment();

        if (!seedDemoData) {
            log.info("Demo data seeding disabled (APP_SEED_DEMO_DATA=false).");
            return;
        }
        try {
            if (userRepository.existsByEmail("admin@ngo.org") || productRepository.count() > 0) {
                log.info("Database already contains data. Skipping demo data creation.");
                return;
            }

            log.info("Seeding initial database with NGO Impact Marketplace data...");

            // 1. Users
            User admin = User.builder()
                    .firstName("NGO")
                    .lastName("Admin")
                    .email("admin@ngo.org")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .phone("+91 98765 00000")
                    .role(User.Role.ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);

            User customer = User.builder()
                    .firstName("Rohan")
                    .lastName("Kumar")
                    .email("customer@ngo.org")
                    .passwordHash(passwordEncoder.encode("customer123"))
                    .phone("+91 98765 11111")
                    .role(User.Role.CUSTOMER)
                    .active(true)
                    .build();
            userRepository.save(customer);

            // 2. Categories
            Category c1 = Category.builder()
                    .name("Artisan Handicrafts")
                    .slug("artisan-handicrafts")
                    .description("Demo category - Handcrafted products made by traditional rural artisans using sustainable techniques.")
                    .imageUrl("https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&q=80&w=800")
                    .active(true)
                    .build();

            Category c2 = Category.builder()
                    .name("Eco Essentials")
                    .slug("eco-essentials")
                    .description("Demo category - Zero-waste home and lifestyle alternatives promoting environmental preservation.")
                    .imageUrl("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800")
                    .active(true)
                    .build();

            Category c3 = Category.builder()
                    .name("Organic & Wellness")
                    .slug("organic-wellness")
                    .description("Demo category - Pure, organic teas, spices, and skincare cultivated by marginal farmers.")
                    .imageUrl("https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=800")
                    .active(true)
                    .build();

            categoryRepository.saveAll(Arrays.asList(c1, c2, c3));

            // 3. Products
            Product p1 = Product.builder()
                    .name("Handcrafted Jute Utility Tote Bag")
                    .slug("handcrafted-jute-tote-bag")
                    .description("Durable, natural jute bag handcrafted by rural women self-help groups in West Bengal. Ideal for daily shopping and work.")
                    .shortDescription("[Demo product] Eco-friendly handcrafted jute bag supporting rural women artisans.")
                    .price(new BigDecimal("799.00"))
                    .discountPrice(new BigDecimal("599.00"))
                    .sku("NGO-BAG-001")
                    .stockQuantity(45)
                    .category(c1)
                    .impactDescription("Demo text, not a verified claim: Provides 3 days of fair-wage income and skill development for a rural woman artisan.")
                    .impactAmount(new BigDecimal("150.00"))
                    .status(Product.Status.ACTIVE)
                    .featured(true)
                    .images(new ArrayList<>())
                    .build();
            p1.getImages().add(ProductImage.builder().product(p1).imageUrl("https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800").altText("Jute Tote Bag").sortOrder(0).build());

            Product p2 = Product.builder()
                    .name("Handloom Terracotta Planter Set")
                    .slug("terracotta-planter-set")
                    .description("Set of 2 handcrafted clay planters painted using non-toxic natural pigments by potter communities.")
                    .shortDescription("[Demo product] Traditional clay planters supporting indigenous potter livelihoods.")
                    .price(new BigDecimal("999.00"))
                    .discountPrice(new BigDecimal("849.00"))
                    .sku("NGO-POT-002")
                    .stockQuantity(20)
                    .category(c1)
                    .impactDescription("Demo text, not a verified claim: Directly supports traditional potter family livelihoods and preserves ancestral crafts.")
                    .impactAmount(new BigDecimal("200.00"))
                    .status(Product.Status.ACTIVE)
                    .featured(true)
                    .images(new ArrayList<>())
                    .build();
            p2.getImages().add(ProductImage.builder().product(p2).imageUrl("https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=800").altText("Terracotta Planters").sortOrder(0).build());

            Product p3 = Product.builder()
                    .name("Bamboo Travel Cutlery & Straw Kit")
                    .slug("bamboo-travel-cutlery-kit")
                    .description("Reusable zero-waste bamboo cutlery set with natural pouch. Includes spoon, fork, knife, chopsticks, and straw.")
                    .shortDescription("[Demo product] Portable zero-waste cutlery set reducing single-use plastic waste.")
                    .price(new BigDecimal("499.00"))
                    .discountPrice(new BigDecimal("399.00"))
                    .sku("NGO-ECO-003")
                    .stockQuantity(80)
                    .category(c2)
                    .impactDescription("Demo text, not a verified claim: Prevents over 500 single-use plastic items from entering landfills and ocean ecosystems.")
                    .impactAmount(new BigDecimal("80.00"))
                    .status(Product.Status.ACTIVE)
                    .featured(true)
                    .images(new ArrayList<>())
                    .build();
            p3.getImages().add(ProductImage.builder().product(p3).imageUrl("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800").altText("Bamboo Cutlery Kit").sortOrder(0).build());

            Product p4 = Product.builder()
                    .name("Organic Himalayan Herbal Tea Blend")
                    .slug("organic-himalayan-herbal-tea")
                    .description("100% organic, hand-picked herbal tea blend sourced directly from smallholder hill farmers in Uttarakhand.")
                    .shortDescription("[Demo product] Aromatic Himalayan herbal tea supporting sustainable mountain agriculture.")
                    .price(new BigDecimal("650.00"))
                    .sku("NGO-TEA-004")
                    .stockQuantity(60)
                    .category(c3)
                    .impactDescription("Demo text, not a verified claim: Funds educational supplies for children of smallholder mountain farming families.")
                    .impactAmount(new BigDecimal("120.00"))
                    .status(Product.Status.ACTIVE)
                    .featured(false)
                    .images(new ArrayList<>())
                    .build();
            p4.getImages().add(ProductImage.builder().product(p4).imageUrl("https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800").altText("Himalayan Herbal Tea").sortOrder(0).build());

            productRepository.saveAll(Arrays.asList(p1, p2, p3, p4));

            // 4. Impact Metrics
            ImpactMetric m1 = ImpactMetric.builder().title("Meals Provided").description("Directly served to rural school children (demo figure - replace with verified data)").value(15400L).unit("Meals").icon("Utensils").displayOrder(1).active(true).build();
            ImpactMetric m2 = ImpactMetric.builder().title("Artisans Supported").description("Receiving fair wages and healthcare access (demo figure - replace with verified data)").value(3200L).unit("Artisans").icon("Users").displayOrder(2).active(true).build();
            ImpactMetric m3 = ImpactMetric.builder().title("Trees Planted").description("Planted across degraded forest land (demo figure - replace with verified data)").value(50000L).unit("Trees").icon("Trees").displayOrder(3).active(true).build();
            ImpactMetric m4 = ImpactMetric.builder().title("Children Educated").description("Scholarships and learning material provided (demo figure - replace with verified data)").value(1850L).unit("Students").icon("GraduationCap").displayOrder(4).active(true).build();
            impactMetricRepository.saveAll(Arrays.asList(m1, m2, m3, m4));

            // 5. Impact Projects
            ImpactProject proj1 = ImpactProject.builder()
                    .title("Rural Women Handloom & Artisan Empowerment")
                    .description("Demo project: Providing vocational handloom training, design mentorship, and market connections for 500 women in rural Rajasthan.")
                    .location("Barmer, Rajasthan")
                    .beneficiariesCount(500L)
                    .imageUrl("https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&q=80&w=800")
                    .status(ImpactProject.Status.ACTIVE)
                    .startDate(LocalDate.of(2025, 1, 15))
                    .build();
            impactProjectRepository.save(proj1);

            // 6. Active Campaigns
            Campaign camp1 = Campaign.builder()
                    .title("Winter Relief & Warmth Drive 2026")
                    .slug("winter-relief-drive-2026")
                    .description("Demo campaign: Distributing 5,000 hand-knitted blankets and thermal wear kits to homeless families and rural elders.")
                    .targetAmount(new BigDecimal("500000.00"))
                    .currentAmount(new BigDecimal("345000.00"))
                    .startDate(LocalDate.of(2025, 11, 1))
                    .endDate(LocalDate.of(2026, 3, 31))
                    .imageUrl("https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800")
                    .status(Campaign.Status.ACTIVE)
                    .featured(true)
                    .build();
            campaignRepository.save(camp1);

            // 7. Impact Stories
            ImpactStory story1 = ImpactStory.builder()
                    .title("From Traditional Weaver to Community Leader: Sunita's Journey")
                    .slug("sunitas-journey-handloom-leader")
                    .excerpt("Demo story (fictional): How artisan collectives and sustainable product sales restored dignity and financial independence to 40 village families.")
                    .content("Sunita Devi, a 34-year-old artisan from Barmer, spent years struggling to support her three children through low-paid seasonal farm labor. When our handloom empowerment center opened in her cluster, she received 6 months of specialized artisan training. Today, Sunita leads a team of 15 women weavers whose handcrafted products are featured in our catalog...")
                    .imageUrl("https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800")
                    .author("Demo content - fictional example")
                    .published(true)
                    .publishedAt(LocalDateTime.now().minusDays(5))
                    .build();
            impactStoryRepository.save(story1);

            // 8. Banners
            Announcement ann1 = Announcement.builder()
                    .title("Demo store")
                    .content("This store is showing sample products and figures. They will be replaced by the NGO's real catalogue and verified impact data.")
                    .linkUrl("/about")
                    .active(true)
                    .build();
            announcementRepository.save(ann1);

            log.info("Database seeding completed successfully!");
        } catch (Exception e) {
            // Re-throw so the transaction rolls back instead of committing a half-seeded database.
            log.error("Demo data seeding failed", e);
            throw e;
        }
    }

    /**
     * Creates an administrator from APP_ADMIN_EMAIL / APP_ADMIN_PASSWORD when set and not already present.
     * Use this for real deployments instead of the demo admin account.
     */
    private void bootstrapAdminFromEnvironment() {
        if (bootstrapAdminEmail == null || bootstrapAdminEmail.isBlank()) return;
        String email = bootstrapAdminEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) return;
        if (bootstrapAdminPassword == null || bootstrapAdminPassword.length() < 8) {
            log.error("APP_ADMIN_EMAIL is set but APP_ADMIN_PASSWORD is missing or shorter than 8 characters - admin not created");
            return;
        }
        userRepository.save(User.builder()
                .firstName("Site").lastName("Administrator").email(email)
                .passwordHash(passwordEncoder.encode(bootstrapAdminPassword))
                .role(User.Role.ADMIN).active(true).build());
        log.info("Created administrator account {} from environment", email);
    }
}
