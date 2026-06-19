package com.ellink.partner;

import com.ellink.common.exception.BusinessException;
import com.ellink.common.exception.ErrorCode;
import com.ellink.partner.dto.PartnerCreateRequest;
import com.ellink.partner.dto.PartnerCreateResponse;
import com.ellink.partner.dto.PartnerMeResponse;
import com.ellink.partner.dto.PartnerSummary;
import com.ellink.partner.entity.Partner;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
public class PartnerService {

    /** 임시 비밀번호 문자셋 — 혼동 문자(0/O, 1/l/I) 제외. */
    private static final String TEMP_PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    private static final int TEMP_PASSWORD_LENGTH = 10;

    private final PartnerRepository partnerRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    public PartnerService(PartnerRepository partnerRepository, PasswordEncoder passwordEncoder) {
        this.partnerRepository = partnerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * 파트너 등록 — 임시 비밀번호를 발급하고 응답에 1회만 노출한다(서버는 해시만 보관).
     */
    @Transactional
    public PartnerCreateResponse create(Long adminId, PartnerCreateRequest req) {
        if (partnerRepository.existsByEmail(req.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
        String temporaryPassword = generateTemporaryPassword();
        Partner partner = partnerRepository.save(new Partner(
                req.email(), passwordEncoder.encode(temporaryPassword),
                req.companyName(), req.contactName(), req.phone(), adminId));
        return new PartnerCreateResponse(
                partner.getId(), partner.getEmail(), partner.getCompanyName(), temporaryPassword);
    }

    @Transactional(readOnly = true)
    public List<PartnerSummary> list() {
        return partnerRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(PartnerSummary::from)
                .toList();
    }

    /** 활성/비활성 전환. INVITED는 등록 직후 상태이므로 수동 지정 불가. */
    @Transactional
    public PartnerSummary updateStatus(Long partnerId, PartnerStatus status) {
        if (status == PartnerStatus.INVITED) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "INVITED 상태로는 변경할 수 없습니다.");
        }
        Partner partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTNER_NOT_FOUND));
        partner.changeStatus(status);
        return PartnerSummary.from(partner);
    }

    @Transactional(readOnly = true)
    public PartnerMeResponse getMe(Long partnerId) {
        Partner partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTNER_NOT_FOUND));
        return PartnerMeResponse.from(partner);
    }

    private String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(TEMP_PASSWORD_LENGTH);
        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            sb.append(TEMP_PASSWORD_CHARS.charAt(random.nextInt(TEMP_PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
}
