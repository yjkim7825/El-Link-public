package com.ellink.common.bootstrap;

import com.ellink.admin.AdminRole;
import com.ellink.admin.AdminUserRepository;
import com.ellink.admin.entity.AdminUser;
import com.ellink.common.storage.StorageService;
import com.ellink.common.storage.StoredObject;
import com.ellink.document.CompanyDocType;
import com.ellink.document.CompanyDocumentRepository;
import com.ellink.document.entity.CompanyDocument;
import com.ellink.document.pdf.QuotePdfGenerator;
import com.ellink.material.MaterialRepository;
import com.ellink.material.entity.Material;
import com.ellink.partner.PartnerRepository;
import com.ellink.partner.PartnerStatus;
import com.ellink.partner.entity.Partner;
import com.ellink.proposal.ProposalRepository;
import com.ellink.proposal.entity.Proposal;
import com.ellink.quote.PriceCatalogRepository;
import com.ellink.quote.PriceType;
import com.ellink.quote.QuoteCategory;
import com.ellink.quote.QuoteRepository;
import com.ellink.quote.entity.PriceCatalog;
import com.ellink.quote.entity.Quote;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * dev 프로필 전용 시드. 기본 관리자/테스트 파트너/단가 카탈로그/회사 서류에 더해,
 * 데모 시연용 목업(자료·협업 제안·파트너·견적)을 생성한다(각 도메인이 비어 있을 때만).
 * 운영(prod)에서는 동작하지 않는다.
 */
@Component
@Profile("dev")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private static final String ADMIN_EMAIL = "admin@ecolink.demo";
    private static final String ADMIN_PASSWORD = "admin1234";
    private static final String PARTNER_EMAIL = "partner@company.demo";
    private static final String PARTNER_TEMP_PASSWORD = "temp1234";

    /** 데모 활성 파트너(즉시 로그인 가능) 계정. */
    private static final String DEMO_PARTNER_EMAIL = "active@partner.demo";
    private static final String DEMO_PARTNER_PASSWORD = "demo1234";

    /** 자료 첨부 데모용 1x1 PNG placeholder. */
    private static final byte[] PLACEHOLDER_PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");

    private final AdminUserRepository adminUserRepository;
    private final PartnerRepository partnerRepository;
    private final PriceCatalogRepository catalogRepository;
    private final CompanyDocumentRepository documentRepository;
    private final MaterialRepository materialRepository;
    private final ProposalRepository proposalRepository;
    private final QuoteRepository quoteRepository;
    private final QuotePdfGenerator quotePdfGenerator;
    private final StorageService storageService;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(AdminUserRepository adminUserRepository,
                           PartnerRepository partnerRepository,
                           PriceCatalogRepository catalogRepository,
                           CompanyDocumentRepository documentRepository,
                           MaterialRepository materialRepository,
                           ProposalRepository proposalRepository,
                           QuoteRepository quoteRepository,
                           QuotePdfGenerator quotePdfGenerator,
                           StorageService storageService,
                           PasswordEncoder passwordEncoder) {
        this.adminUserRepository = adminUserRepository;
        this.partnerRepository = partnerRepository;
        this.catalogRepository = catalogRepository;
        this.documentRepository = documentRepository;
        this.materialRepository = materialRepository;
        this.proposalRepository = proposalRepository;
        this.quoteRepository = quoteRepository;
        this.quotePdfGenerator = quotePdfGenerator;
        this.storageService = storageService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        AdminUser admin = adminUserRepository.findByEmail(ADMIN_EMAIL)
                .orElseGet(() -> {
                    AdminUser created = adminUserRepository.save(new AdminUser(
                            ADMIN_EMAIL, passwordEncoder.encode(ADMIN_PASSWORD), "관리자", AdminRole.ADMIN));
                    log.info("[seed] 기본 관리자 생성: {} / {}", ADMIN_EMAIL, ADMIN_PASSWORD);
                    return created;
                });

        if (!partnerRepository.existsByEmail(PARTNER_EMAIL)) {
            partnerRepository.save(new Partner(
                    PARTNER_EMAIL, passwordEncoder.encode(PARTNER_TEMP_PASSWORD),
                    "Acme Corp", "김담당", "010-0000-0000", admin.getId()));
            log.info("[seed] 테스트 파트너 생성: {} / {} (mustChangePassword=true)",
                    PARTNER_EMAIL, PARTNER_TEMP_PASSWORD);
        }

        seedCatalog();
        seedDocuments(admin);

        // ----- 데모 목업 -----
        List<Material> materials = seedMaterials(admin);
        seedProposals(admin, materials);
        Partner activePartner = seedDemoPartners(admin);
        seedQuotes(activePartner);
    }

    /** 단가 카탈로그 16종(ERD 초기 시드). 비어 있을 때만 일괄 생성. */
    private void seedCatalog() {
        if (catalogRepository.count() > 0) {
            return;
        }
        List<PriceCatalog> items = List.of(
                new PriceCatalog(QuoteCategory.PLANNING, "기획", 0, "식", PriceType.CUSTOM),
                new PriceCatalog(QuoteCategory.PLANNING, "디자인", 0, "식", PriceType.CUSTOM),
                new PriceCatalog(QuoteCategory.VOLUNTEER, "장난감 수리", 30_000, "개", PriceType.FIXED),
                new PriceCatalog(QuoteCategory.VOLUNTEER, "장난감 소독", 10_000, "개", PriceType.FIXED),
                new PriceCatalog(QuoteCategory.VOLUNTEER, "장난감 분해", 5_000, "개", PriceType.FIXED),
                new PriceCatalog(QuoteCategory.EXPERIENCE, "업사이클 키링 체험", 15_000, "명", PriceType.FIXED),
                new PriceCatalog(QuoteCategory.EXPERIENCE, "업사이클 블럭 조립 체험", 15_000, "명", PriceType.FIXED),
                new PriceCatalog(QuoteCategory.SOUVENIR, "병뚜껑 업사이클 치약짜개", 3_500, "개", PriceType.FIXED),
                new PriceCatalog(QuoteCategory.SOUVENIR, "곰돌이 키링", 10_000, "개", PriceType.FIXED),
                new PriceCatalog(QuoteCategory.SOUVENIR, "업사이클 화분 키트", 15_000, "개", PriceType.FIXED),
                new PriceCatalog(QuoteCategory.SOUVENIR, "업사이클 블럭 연필꽂이", 15_000, "개", PriceType.FIXED),
                new PriceCatalog(QuoteCategory.SOUVENIR, "환경 교육 동화책 (지구는 내 친구)", 15_000, "권", PriceType.FIXED),
                new PriceCatalog(QuoteCategory.SOUVENIR, "주문 제작시 별도 금액(금형+디자인비)", 0, "식", PriceType.CUSTOM),
                new PriceCatalog(QuoteCategory.OPERATIONS, "인건비", 120_000, "인", PriceType.FIXED),
                new PriceCatalog(QuoteCategory.OPERATIONS, "왕복 출장비", 600_000, "회", PriceType.FIXED),
                new PriceCatalog(QuoteCategory.OPERATIONS, "행사 운영비", 10_000, "식", PriceType.FIXED));
        catalogRepository.saveAll(items);
        log.info("[seed] 단가 카탈로그 {}종 생성", items.size());
    }

    /** 더미 회사 서류 2종(사업자등록증/통장사본). seed/ 클래스패스 파일을 StorageService에 복사 후 메타 저장. */
    private void seedDocuments(AdminUser admin) {
        if (documentRepository.count() > 0) {
            return;
        }
        seedDocument(admin, CompanyDocType.BUSINESS_LICENSE, "사업자등록증",
                "seed/business_license.pdf", "사업자등록증.pdf", "application/pdf");
        seedDocument(admin, CompanyDocType.BANK_ACCOUNT, "통장사본",
                "seed/bank_account.png", "통장사본.png", "image/png");
    }

    private void seedDocument(AdminUser admin, CompanyDocType type, String title,
                              String classpath, String originalName, String mimeType) {
        try {
            byte[] bytes = new ClassPathResource(classpath).getInputStream().readAllBytes();
            StoredObject stored = storageService.store(originalName, bytes, mimeType);
            documentRepository.save(new CompanyDocument(
                    type, title, stored.key(), originalName, mimeType, stored.size(), admin));
            log.info("[seed] 회사 서류 생성: {} ({} bytes)", title, stored.size());
        } catch (IOException e) {
            log.warn("[seed] 회사 서류 시드 실패: {} - {}", title, e.getMessage());
        }
    }

    /**
     * 데모 자료 7종(EcoLink 활동 컨셉). 카테고리(환경 교육/체험/봉사/업사이클링)에 골고루 분포.
     * 일부 자료엔 placeholder 이미지 첨부. 비어 있을 때만 생성.
     */
    private List<Material> seedMaterials(AdminUser admin) {
        if (materialRepository.count() > 0) {
            return materialRepository.findAll();
        }
        Material m1 = material(admin, "임직원 환경교육 프로그램",
                "기업 임직원을 대상으로 자원순환과 기후위기를 다루는 1일 환경교육 프로그램. ESG 내재화와 조직 참여를 동시에.",
                "환경 교육", "ESG 경영,환경교육,임직원 참여", true);
        Material m2 = material(admin, "폐배터리 업사이클 키링 만들기 체험",
                "수명을 다한 소형 배터리 부품을 활용해 나만의 키링을 제작하는 체험. 자원순환을 손으로 경험합니다.",
                "체험", "업사이클링,체험,자원순환", false);
        Material m3 = material(admin, "장난감 수리 나눔 봉사활동",
                "버려진 장난감을 수리·소독해 지역아동센터에 기부하는 임직원 봉사 프로그램.",
                "봉사", "봉사,자원순환,나눔", false);
        Material m4 = material(admin, "ESG 굿즈 제작 협업",
                "폐플라스틱·병뚜껑을 활용한 친환경 사내 굿즈를 공동 기획·제작합니다.",
                "업사이클링", "업사이클링,ESG 굿즈,친환경", true);
        Material m5 = material(admin, "청소년 친환경 워크숍",
                "지역 청소년을 대상으로 한 친환경 캠페인·워크숍. 기업 사회공헌 연계 프로그램.",
                "환경 교육", "환경교육,청소년,캠페인", false);
        Material m6 = material(admin, "업사이클 블럭 조립 체험 키트",
                "폐플라스틱 재생 블럭으로 진행하는 단체 조립 체험. 교구형 키트로 제공됩니다.",
                "체험", "체험,업사이클링,교구", false);
        Material m7 = material(admin, "폐장난감 자원순환 봉사 캠페인",
                "폐장난감 수거-분해-재활용 전 과정을 함께하는 대규모 자원순환 봉사 캠페인.",
                "봉사", "봉사,자원순환,캠페인", false);
        List<Material> saved = materialRepository.saveAll(List.of(m1, m2, m3, m4, m5, m6, m7));
        log.info("[seed] 데모 자료 {}종 생성", saved.size());
        return saved;
    }

    /** 카테고리별 대표 이미지 색상(단색 PNG placeholder 생성용). 프론트 CategoryThumb와 톤 일치. */
    private static final Map<String, Integer> CATEGORY_COLORS = Map.of(
            "환경 교육", 0x16A34A, // green
            "체험", 0x0EA5E9,      // sky
            "봉사", 0xF59E0B,      // amber
            "업사이클링", 0x8B5CF6 // violet
    );

    private Material material(AdminUser admin, String title, String summary,
                             String category, String keywords, boolean withFile) {
        Material m = new Material(title, summary, category, keywords, admin);
        // 대표 이미지: 카테고리 색상 단색 PNG를 동적 생성해 StorageService에 저장
        int rgb = CATEGORY_COLORS.getOrDefault(category, 0x64748B);
        byte[] png = solidColorPng(rgb);
        StoredObject thumb = storageService.store("thumb.png", png, "image/png");
        m.assignThumbnail(thumb.key());
        if (withFile) {
            StoredObject stored = storageService.store("sample.png", PLACEHOLDER_PNG, "image/png");
            m.addFile(stored.key(), "활동사진.png", "image/png", stored.size());
        }
        return m;
    }

    /** 16:9 단색 PNG 바이트 생성(데모 대표 이미지). */
    private byte[] solidColorPng(int rgb) {
        BufferedImage img = new BufferedImage(480, 270, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(rgb));
        g.fillRect(0, 0, 480, 270);
        g.dispose();
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(img, "png", out);
            return out.toByteArray();
        } catch (IOException e) {
            return PLACEHOLDER_PNG; // 실패 시 1x1 fallback
        }
    }

    /** 데모 협업 제안 2종. 위에서 만든 자료와 연결(relatedMaterialIds). 비어 있을 때만 생성. */
    private void seedProposals(AdminUser admin, List<Material> materials) {
        if (proposalRepository.count() > 0 || materials.isEmpty()) {
            return;
        }
        // 자료 id 확보(인덱스 안전 접근)
        Long mEnvEdu = materials.get(0).getId();
        Long mExp = materials.size() > 1 ? materials.get(1).getId() : mEnvEdu;
        Long mVol = materials.size() > 2 ? materials.get(2).getId() : mEnvEdu;
        Long mGoods = materials.size() > 3 ? materials.get(3).getId() : mEnvEdu;

        Proposal p1 = new Proposal("Verde Inc",
                "## Verde Inc\n친환경 소재 사업을 확대 중인 중견 제조 기업으로, 최근 ESG 경영을 핵심 과제로 선언했습니다.\n\n"
                        + "- **강점**: 제조 기반의 자원순환 역량, 활발한 사내 봉사 문화\n"
                        + "- **니즈**: 임직원 참여형 ESG 프로그램, 대외 홍보가 가능한 친환경 협업 사례\n\n"
                        + "EcoLink의 업사이클링·환경교육 콘텐츠와 결합하면 임직원 참여와 브랜드 메시지를 동시에 확보할 수 있습니다.",
                admin);
        p1.addIdea("임직원 환경교육 + 봉사 패키지",
                "환경교육 세션과 장난감 수리 나눔 봉사를 하루 일정으로 결합한 임직원 참여 프로그램.",
                mEnvEdu + "," + mVol);
        p1.addIdea("ESG 굿즈 공동 제작",
                "폐자원을 활용한 사내 ESG 굿즈를 공동 기획·제작해 임직원 배포 및 대외 홍보에 활용.",
                String.valueOf(mGoods));
        p1.addIdea("업사이클 체험 부스 운영",
                "사내 행사·가족의 날에 업사이클 키링 체험 부스를 운영해 자원순환 메시지를 전달.",
                String.valueOf(mExp));

        Proposal p2 = new Proposal("Terra Partners",
                "## Terra Partners\n친환경 유통을 표방하는 성장기 스타트업으로, 브랜드 가치에 ‘지속가능성’을 강하게 결합하고 있습니다.\n\n"
                        + "- **강점**: 젊은 조직 문화, MZ 고객 접점, 빠른 캠페인 실행력\n"
                        + "- **니즈**: 비용 효율적이면서 SNS 확산이 쉬운 친환경 체험·캠페인\n\n"
                        + "체험형 콘텐츠와 청소년 대상 캠페인을 통해 브랜드 인지도와 ESG 메시지를 함께 키울 수 있습니다.",
                admin);
        p2.addIdea("청소년 친환경 워크숍 후원",
                "지역 청소년 대상 친환경 워크숍을 공동 후원·운영하여 사회공헌 스토리를 확보.",
                String.valueOf(materials.size() > 4 ? materials.get(4).getId() : mEnvEdu));
        p2.addIdea("업사이클 체험 클래스",
                "고객·임직원 참여형 업사이클 블럭 조립 체험 클래스를 정기 운영.",
                String.valueOf(materials.size() > 5 ? materials.get(5).getId() : mExp));
        p2.addIdea("자원순환 봉사 캠페인 공동 진행",
                "폐장난감 자원순환 봉사 캠페인을 공동 브랜딩으로 진행해 SNS 확산을 도모.",
                String.valueOf(materials.size() > 6 ? materials.get(6).getId() : mVol));

        proposalRepository.saveAll(List.of(p1, p2));
        log.info("[seed] 데모 협업 제안 2종 생성");
    }

    /**
     * 데모 파트너 3종: 활성(로그인 가능)/초대됨(임시비번)/비활성. 각 이메일이 없을 때만 생성.
     * @return 활성 데모 파트너(견적 시드용)
     */
    private Partner seedDemoPartners(AdminUser admin) {
        Partner active = null;
        if (!partnerRepository.existsByEmail(DEMO_PARTNER_EMAIL)) {
            Partner p = new Partner(DEMO_PARTNER_EMAIL, passwordEncoder.encode(DEMO_PARTNER_PASSWORD),
                    "Acme Corp", "이대표", "010-1111-2222", admin.getId());
            p.changePassword(passwordEncoder.encode(DEMO_PARTNER_PASSWORD)); // ACTIVE + mustChange 해제
            active = partnerRepository.save(p);
            log.info("[seed] 데모 파트너(활성) 생성: {} / {} (즉시 로그인 가능)",
                    DEMO_PARTNER_EMAIL, DEMO_PARTNER_PASSWORD);
        } else {
            active = partnerRepository.findByEmail(DEMO_PARTNER_EMAIL).orElse(null);
        }

        if (!partnerRepository.existsByEmail("invited@partner.com")) {
            partnerRepository.save(new Partner("invited@partner.com",
                    passwordEncoder.encode("temp1234"), "Verde Inc", "박초대", "010-3333-4444", admin.getId()));
            log.info("[seed] 데모 파트너(초대됨) 생성: invited@partner.com / temp1234");
        }

        if (!partnerRepository.existsByEmail("disabled@partner.com")) {
            Partner p = new Partner("disabled@partner.com",
                    passwordEncoder.encode("temp1234"), "Terra Partners", "최비활", "010-5555-6666", admin.getId());
            p.changeStatus(PartnerStatus.DISABLED);
            partnerRepository.save(p);
            log.info("[seed] 데모 파트너(비활성) 생성: disabled@partner.com");
        }

        return active;
    }

    /** 데모 견적 2종(활성 파트너): 발급완료 1 + 임시저장 1. 비어 있을 때만 생성. */
    private void seedQuotes(Partner partner) {
        if (partner == null || quoteRepository.count() > 0) {
            return;
        }
        List<PriceCatalog> cats = catalogRepository.findAll();
        PriceCatalog keyring = findCatalog(cats, "업사이클 키링 체험");
        PriceCatalog labor = findCatalog(cats, "인건비");
        PriceCatalog block = findCatalog(cats, "업사이클 블럭 조립 체험");
        PriceCatalog ops = findCatalog(cats, "행사 운영비");
        if (keyring == null || labor == null) {
            log.warn("[seed] 견적 시드 건너뜀 - 카탈로그 항목 미발견");
            return;
        }

        // 1) 발급완료 견적 (PDF 생성 후 ISSUED)
        Quote issued = new Quote(partner);
        issued.setClientCompanyName("Verde Inc");
        issued.addItem(keyring, keyring.getItemName(), keyring.getUnitPrice(), 30, 1);
        issued.addItem(labor, labor.getItemName(), labor.getUnitPrice(), 2, 3);
        issued.recalculateTotal();
        quoteRepository.save(issued);
        try {
            byte[] pdf = quotePdfGenerator.generate(issued);
            StoredObject stored = storageService.store("quote-seed.pdf", pdf, "application/pdf");
            issued.markIssued(Instant.now(), stored.key());
            quoteRepository.save(issued);
            log.info("[seed] 데모 견적(발급완료) 생성: id={} 총액={}", issued.getId(), issued.getTotalAmount());
        } catch (Exception e) {
            log.warn("[seed] 견적 PDF 생성 실패 - 발급 견적을 DRAFT로 유지: {}", e.getMessage());
        }

        // 2) 임시저장 견적
        Quote draft = new Quote(partner);
        draft.setClientCompanyName("Terra Partners");
        if (block != null) {
            draft.addItem(block, block.getItemName(), block.getUnitPrice(), 20, 1);
        }
        if (ops != null) {
            draft.addItem(ops, ops.getItemName(), ops.getUnitPrice(), 1, 2);
        }
        draft.addItem(null, "맞춤 운송비", 80_000, 1, 1); // 커스텀 라인
        draft.recalculateTotal();
        quoteRepository.save(draft);
        log.info("[seed] 데모 견적(임시저장) 생성: id={} 총액={}", draft.getId(), draft.getTotalAmount());
    }

    private PriceCatalog findCatalog(List<PriceCatalog> cats, String itemName) {
        return cats.stream().filter(c -> c.getItemName().equals(itemName)).findFirst().orElse(null);
    }
}
