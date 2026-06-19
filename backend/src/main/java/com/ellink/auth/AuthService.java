package com.ellink.auth;

import com.ellink.admin.AdminUserRepository;
import com.ellink.admin.entity.AdminUser;
import com.ellink.auth.dto.ChangePasswordRequest;
import com.ellink.auth.dto.LoginBundle;
import com.ellink.auth.dto.LoginRequest;
import com.ellink.auth.dto.LoginResponse;
import com.ellink.auth.dto.RefreshBundle;
import com.ellink.auth.dto.RefreshResponse;
import com.ellink.auth.dto.UserSummary;
import com.ellink.common.exception.BusinessException;
import com.ellink.common.exception.ErrorCode;
import com.ellink.common.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AuthService {

    private final AdminUserRepository adminUserRepository;
    private final com.ellink.partner.PartnerRepository partnerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(AdminUserRepository adminUserRepository,
                       com.ellink.partner.PartnerRepository partnerRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.adminUserRepository = adminUserRepository;
        this.partnerRepository = partnerRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional(readOnly = true)
    public LoginBundle adminLogin(LoginRequest req) {
        AdminUser admin = adminUserRepository.findByEmail(req.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        if (!admin.isActive()) {
            throw new BusinessException(ErrorCode.ACCOUNT_DISABLED);
        }
        if (!passwordEncoder.matches(req.password(), admin.getPasswordHash())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
        String role = "ADMIN";
        String access = tokenProvider.createAccessToken(admin.getId(), admin.getEmail(), role);
        String refresh = tokenProvider.createRefreshToken(admin.getId(), admin.getEmail(), role);
        LoginResponse response = new LoginResponse(
                access, "Bearer", tokenProvider.getAccessValiditySeconds(),
                false, UserSummary.admin(admin.getId(), admin.getName()));
        return new LoginBundle(response, refresh);
    }

    @Transactional
    public LoginBundle partnerLogin(LoginRequest req) {
        var partner = partnerRepository.findByEmail(req.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        if (partner.isDisabled()) {
            throw new BusinessException(ErrorCode.ACCOUNT_DISABLED);
        }
        if (!passwordEncoder.matches(req.password(), partner.getPasswordHash())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
        partner.recordLogin(Instant.now());
        String role = "PARTNER";
        String access = tokenProvider.createAccessToken(partner.getId(), partner.getEmail(), role);
        String refresh = tokenProvider.createRefreshToken(partner.getId(), partner.getEmail(), role);
        LoginResponse response = new LoginResponse(
                access, "Bearer", tokenProvider.getAccessValiditySeconds(),
                partner.isMustChangePassword(),
                UserSummary.partner(partner.getId(), partner.getCompanyName(), partner.getContactName()));
        return new LoginBundle(response, refresh);
    }

    /** refresh 토큰으로 access 재발급 + refresh 회전. */
    @Transactional(readOnly = true)
    public RefreshBundle refresh(String refreshToken) {
        if (refreshToken == null || !tokenProvider.isValid(refreshToken)) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }
        Claims claims = tokenProvider.parse(refreshToken).getPayload();
        if (!JwtTokenProvider.TYPE_REFRESH.equals(claims.get("type", String.class))) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }
        var principal = tokenProvider.toPrincipal(claims);
        String access = tokenProvider.createAccessToken(principal.id(), principal.email(), principal.role());
        String newRefresh = tokenProvider.createRefreshToken(principal.id(), principal.email(), principal.role());
        RefreshResponse response = new RefreshResponse(access, "Bearer", tokenProvider.getAccessValiditySeconds());
        return new RefreshBundle(response, newRefresh);
    }

    /** 파트너 비밀번호 변경 (최초 로그인 강제 변경 포함). */
    @Transactional
    public void partnerChangePassword(Long partnerId, ChangePasswordRequest req) {
        var partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTNER_NOT_FOUND));
        if (!passwordEncoder.matches(req.currentPassword(), partner.getPasswordHash())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
        partner.changePassword(passwordEncoder.encode(req.newPassword()));
    }
}
