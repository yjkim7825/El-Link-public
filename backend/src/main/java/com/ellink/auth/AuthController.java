package com.ellink.auth;

import com.ellink.auth.dto.ChangePasswordRequest;
import com.ellink.auth.dto.LoginBundle;
import com.ellink.auth.dto.LoginRequest;
import com.ellink.auth.dto.LoginResponse;
import com.ellink.auth.dto.RefreshBundle;
import com.ellink.auth.dto.RefreshResponse;
import com.ellink.common.response.ApiResponse;
import com.ellink.common.security.AuthPrincipal;
import com.ellink.common.security.RefreshTokenCookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenCookie refreshCookie;

    public AuthController(AuthService authService, RefreshTokenCookie refreshCookie) {
        this.authService = authService;
        this.refreshCookie = refreshCookie;
    }

    @PostMapping("/api/admin/auth/login")
    public ResponseEntity<ApiResponse<LoginResponse>> adminLogin(@Valid @RequestBody LoginRequest req) {
        return loginResponse(authService.adminLogin(req));
    }

    @PostMapping("/api/partner/auth/login")
    public ResponseEntity<ApiResponse<LoginResponse>> partnerLogin(@Valid @RequestBody LoginRequest req) {
        return loginResponse(authService.partnerLogin(req));
    }

    @PostMapping("/api/auth/refresh")
    public ResponseEntity<ApiResponse<RefreshResponse>> refresh(HttpServletRequest request) {
        RefreshBundle bundle = authService.refresh(refreshCookie.read(request));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.create(bundle.refreshToken()).toString())
                .body(ApiResponse.ok(bundle.response()));
    }

    @PostMapping("/api/auth/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.clear().toString())
                .body(ApiResponse.ok());
    }

    @PostMapping("/api/partner/auth/change-password")
    public ApiResponse<Void> changePassword(@AuthenticationPrincipal AuthPrincipal principal,
                                            @Valid @RequestBody ChangePasswordRequest req) {
        authService.partnerChangePassword(principal.id(), req);
        return ApiResponse.ok();
    }

    private ResponseEntity<ApiResponse<LoginResponse>> loginResponse(LoginBundle bundle) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.create(bundle.refreshToken()).toString())
                .body(ApiResponse.ok(bundle.response()));
    }
}
