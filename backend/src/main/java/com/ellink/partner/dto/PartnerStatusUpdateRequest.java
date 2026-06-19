package com.ellink.partner.dto;

import com.ellink.partner.PartnerStatus;
import jakarta.validation.constraints.NotNull;

/**
 * 파트너 활성/비활성 변경 요청. INVITED는 최초 등록 상태이므로 지정할 수 없다.
 */
public record PartnerStatusUpdateRequest(@NotNull PartnerStatus status) {
}
