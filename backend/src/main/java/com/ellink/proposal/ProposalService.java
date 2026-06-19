package com.ellink.proposal;

import com.ellink.admin.AdminUserRepository;
import com.ellink.admin.entity.AdminUser;
import com.ellink.common.exception.BusinessException;
import com.ellink.common.exception.ErrorCode;
import com.ellink.common.gemini.GeminiClient;
import com.ellink.material.MaterialRepository;
import com.ellink.material.entity.Material;
import com.ellink.proposal.dto.ProposalAnalyzeResponse;
import com.ellink.proposal.dto.ProposalCreateRequest;
import com.ellink.proposal.dto.ProposalIdeaPayload;
import com.ellink.proposal.dto.ProposalListItem;
import com.ellink.proposal.dto.ProposalResponse;
import com.ellink.proposal.entity.Proposal;
import com.ellink.proposal.entity.ProposalIdea;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProposalService {

    private static final Logger log = LoggerFactory.getLogger(ProposalService.class);

    private final ProposalRepository proposalRepository;
    private final MaterialRepository materialRepository;
    private final AdminUserRepository adminUserRepository;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public ProposalService(ProposalRepository proposalRepository,
                           MaterialRepository materialRepository,
                           AdminUserRepository adminUserRepository,
                           GeminiClient geminiClient,
                           ObjectMapper objectMapper) {
        this.proposalRepository = proposalRepository;
        this.materialRepository = materialRepository;
        this.adminUserRepository = adminUserRepository;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    /**
     * 2단계 Gemini 호출:
     * 1) 기업 조사(마크다운) — legacy analyzeCompany 프롬프트.
     * 2) 협업 아이디어 3개(JSON) — legacy getCollaborationIdeas 프롬프트 + 현재 Material 목록 컨텍스트.
     * DB 저장은 하지 않는다.
     */
    public ProposalAnalyzeResponse analyze(String companyName) {
        String trimmed = companyName.trim();

        // --- 1단계: 기업 조사 ---
        String companyAnalysis = geminiClient.generateText(companyAnalysisPrompt(trimmed)).trim();

        // --- 2단계: 협업 아이디어 (Material 컨텍스트 포함) ---
        List<Material> materials = materialRepository.findTop30ByOrderByCreatedAtDesc();
        Set<Long> validIds = materials.stream().map(Material::getId).collect(Collectors.toSet());
        String ideasJson = geminiClient.generateJson(List.of(
                Map.of("text", ideasPrompt(trimmed, companyAnalysis, materials))));
        List<ProposalIdeaPayload> ideas = parseIdeas(ideasJson, validIds);

        return new ProposalAnalyzeResponse(trimmed, companyAnalysis, ideas);
    }

    @Transactional
    public ProposalResponse create(Long adminId, ProposalCreateRequest req) {
        AdminUser admin = adminUserRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        Proposal proposal = new Proposal(req.targetCompanyName(), req.companyAnalysis(), admin);
        for (ProposalIdeaPayload idea : req.ideas()) {
            proposal.addIdea(idea.title(), idea.description(), joinIds(idea.relatedMaterialIds()));
        }
        Proposal saved = proposalRepository.save(proposal);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProposalListItem> list() {
        return proposalRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(ProposalListItem::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProposalResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public void delete(Long id) {
        proposalRepository.delete(findOrThrow(id));
    }

    private Proposal findOrThrow(Long id) {
        return proposalRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROPOSAL_NOT_FOUND));
    }

    /** 아이디어가 참조하는 Material 제목을 한 번에 조회해 상세 응답을 구성한다. */
    private ProposalResponse toResponse(Proposal proposal) {
        Set<Long> ids = proposal.getIdeas().stream()
                .flatMap(i -> ProposalResponse.parseIds(i.getRelatedMaterialIds()).stream())
                .collect(Collectors.toSet());
        Map<Long, String> titles = ids.isEmpty() ? Map.of()
                : materialRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Material::getId, Material::getTitle));
        return ProposalResponse.from(proposal, titles);
    }

    // ---------- Gemini 프롬프트 (legacy GAS 재활용) ----------

    private String companyAnalysisPrompt(String companyName) {
        return """
                당신은 특정 기업에 대한 최신 정보를 웹에서 정확하게 찾아내는 디지털 리서치 전문가입니다. '%s'(한글/영문 이름 모두 가능)에 대한 공개 정보를 **실제로 웹 검색**하여, 그 결과를 바탕으로 아래 형식에 맞춰 한국어로 상세 보고서를 작성하세요.

                **기업명:** %s

                ### 🏢 기업 개요
                - 기업의 정체성과 핵심 사업을 설명하세요.
                - 공식 웹사이트 URL을 **반드시** 찾아서 포함하세요.

                ### ✨ 주요 사업 및 최신 동향
                - 기업의 주력 사업 모델과 최신 비즈니스 동향을 설명하세요.

                ### 💡 최신 ESG/사회공헌 실제 사례 (최대 2개)
                - 이 기업의 ESG, CSR 활동에 대한 **구체적인 최신 실제 사례**를 최대 2개까지 찾아서 제시하세요.
                - 각 사례는 활동 내용 / 주요 성과(수치·규모 기반) / 출처 URL(신뢰할 수 있는 뉴스 기사 또는 공식 발표)을 포함하세요.
                - 적합한 URL을 정말 찾을 수 없으면 "관련 URL을 찾지 못했습니다."라고만 작성하세요. 절대 '(URL을 삽입하세요)' 같은 지시문/괄호 설명을 넣지 마세요.
                """.formatted(companyName, companyName);
    }

    private String ideasPrompt(String companyName, String companyInfo, List<Material> materials) {
        String projectSummaries;
        if (materials.isEmpty()) {
            projectSummaries = "없음 (등록된 과거 프로젝트 자료가 없습니다)";
        } else {
            projectSummaries = materials.stream()
                    .map(m -> "[id:%d] %s (%s): %s".formatted(
                            m.getId(), m.getTitle(), m.getCategory(), m.getSummary()))
                    .collect(Collectors.joining("\n"));
        }
        return """
                당신은 'EcoLink'의 CSR/ESG 협업 제안 전문가입니다. 'EcoLink'은 업사이클링, 환경 교육, 체험 활동을 주로 하는 사회적 기업입니다.

                아래는 우리가 과거에 진행했던 프로젝트 목록입니다:
                ---
                %s
                ---

                아래는 협업 대상 기업 '%s'의 정보입니다:
                ---
                %s
                ---

                위 EcoLink의 프로젝트 특성과 대상 기업 정보를 모두 고려하여, 시너지를 낼 수 있는 창의적인 CSR/ESG 협업 아이디어를 정확히 3가지 제안하세요.
                반드시 아래 JSON 스키마로만 응답하세요 (마크다운/설명 문장 금지):
                {
                  "ideas": [
                    {
                      "title": "매력적인 협업 제안 제목",
                      "description": "주요 활동과 기대 효과를 구체적으로 서술",
                      "relatedMaterialIds": [관련 프로젝트의 id 숫자 배열]
                    }
                  ]
                }
                - relatedMaterialIds에는 위 프로젝트 목록의 [id:N]에 표시된 숫자 중 해당 아이디어와 직접 관련된 것만 넣으세요.
                - 관련 프로젝트가 없거나 목록이 비어 있으면 relatedMaterialIds는 빈 배열([])로 두세요.
                - ideas 배열은 정확히 3개여야 합니다.
                """.formatted(projectSummaries, companyName, companyInfo);
    }

    // ---------- 파싱 ----------

    /** 2단계 JSON({"ideas":[...]} 또는 [...])을 파싱. relatedMaterialIds는 실제 존재하는 id만 남긴다. */
    private List<ProposalIdeaPayload> parseIdeas(String json, Set<Long> validIds) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode arr = root.isArray() ? root : root.path("ideas");
            if (!arr.isArray()) {
                throw new IllegalStateException("ideas 배열이 없습니다.");
            }
            List<ProposalIdeaPayload> ideas = new ArrayList<>();
            for (JsonNode node : arr) {
                String title = node.path("title").asText("").trim();
                String description = node.path("description").asText("").trim();
                if (title.isEmpty() && description.isEmpty()) {
                    continue;
                }
                List<Long> related = new ArrayList<>();
                JsonNode ids = node.get("relatedMaterialIds");
                if (ids != null && ids.isArray()) {
                    for (JsonNode idNode : ids) {
                        Long id = idNode.isNumber() ? idNode.asLong() : parseLongOrNull(idNode.asText());
                        if (id != null && validIds.contains(id) && !related.contains(id)) {
                            related.add(id);
                        }
                    }
                }
                ideas.add(new ProposalIdeaPayload(
                        title.isEmpty() ? "(제목 없음)" : title,
                        description.isEmpty() ? "(내용 없음)" : description,
                        related));
            }
            if (ideas.isEmpty()) {
                throw new IllegalStateException("아이디어가 비어 있습니다.");
            }
            return ideas;
        } catch (Exception e) {
            log.warn("협업 아이디어 파싱 실패. raw={}", json, e);
            throw new BusinessException(ErrorCode.GEMINI_ERROR, "AI 협업 아이디어 결과를 해석하지 못했습니다.");
        }
    }

    private String joinIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return null;
        }
        // LinkedHashMap으로 순서 유지 + 중복 제거
        Map<Long, Boolean> unique = new LinkedHashMap<>();
        ids.forEach(id -> unique.put(id, Boolean.TRUE));
        return unique.keySet().stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    private Long parseLongOrNull(String s) {
        try {
            return Long.parseLong(s.trim());
        } catch (Exception e) {
            return null;
        }
    }
}
