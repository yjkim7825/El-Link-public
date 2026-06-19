package com.ellink.proposal;

import com.ellink.common.response.ApiResponse;
import com.ellink.common.security.AuthPrincipal;
import com.ellink.proposal.dto.ProposalAnalyzeRequest;
import com.ellink.proposal.dto.ProposalAnalyzeResponse;
import com.ellink.proposal.dto.ProposalCreateRequest;
import com.ellink.proposal.dto.ProposalListItem;
import com.ellink.proposal.dto.ProposalResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 관리자용 협업 제안 API. /api/admin/** 은 ROLE_ADMIN 제한.
 */
@RestController
@RequestMapping("/api/admin/proposals")
public class AdminProposalController {

    private final ProposalService proposalService;

    public AdminProposalController(ProposalService proposalService) {
        this.proposalService = proposalService;
    }

    /** 2단계 Gemini 분석(기업 조사 + 아이디어 3개). DB 저장 없음. */
    @PostMapping("/analyze")
    public ApiResponse<ProposalAnalyzeResponse> analyze(@Valid @RequestBody ProposalAnalyzeRequest req) {
        return ApiResponse.ok(proposalService.analyze(req.companyName()));
    }

    @PostMapping
    public ApiResponse<ProposalResponse> create(@AuthenticationPrincipal AuthPrincipal principal,
                                                @Valid @RequestBody ProposalCreateRequest req) {
        return ApiResponse.ok(proposalService.create(principal.id(), req));
    }

    @GetMapping
    public ApiResponse<List<ProposalListItem>> list() {
        return ApiResponse.ok(proposalService.list());
    }

    @GetMapping("/{id}")
    public ApiResponse<ProposalResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(proposalService.get(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        proposalService.delete(id);
        return ApiResponse.ok();
    }
}
