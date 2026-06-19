package com.ellink.partner.entity;

import com.ellink.common.audit.BaseTimeEntity;
import com.ellink.partner.PartnerStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * 외부 CSR 담당자 계정. 자가 가입 없이 관리자가 등록하며, 임시 비밀번호 발급 후
 * 최초 로그인 시 비밀번호 변경을 강제한다(mustChangePassword).
 */
@Entity
@Table(name = "partner")
public class Partner extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String contactName;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PartnerStatus status;

    @Column(nullable = false)
    private boolean mustChangePassword;

    private Instant lastLoginAt;

    /** 등록한 관리자 id (참조 단순화를 위해 FK 객체 대신 id만 보관). */
    @Column(nullable = false)
    private Long createdById;

    protected Partner() {
    }

    public Partner(String email, String passwordHash, String companyName,
                   String contactName, String phone, Long createdById) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.companyName = companyName;
        this.contactName = contactName;
        this.phone = phone;
        this.status = PartnerStatus.INVITED;
        this.mustChangePassword = true;
        this.createdById = createdById;
    }

    /** 비밀번호 변경 — 변경 강제 플래그 해제 및 상태 활성화. */
    public void changePassword(String newPasswordHash) {
        this.passwordHash = newPasswordHash;
        this.mustChangePassword = false;
        if (this.status == PartnerStatus.INVITED) {
            this.status = PartnerStatus.ACTIVE;
        }
    }

    /** 관리자에 의한 비밀번호 초기화 — 새 임시 비밀번호 발급 + 변경 강제. */
    public void resetPassword(String temporaryPasswordHash) {
        this.passwordHash = temporaryPasswordHash;
        this.mustChangePassword = true;
    }

    public void recordLogin(Instant when) {
        this.lastLoginAt = when;
    }

    /** 관리자에 의한 활성/비활성 전환. */
    public void changeStatus(PartnerStatus status) {
        this.status = status;
    }

    public boolean isDisabled() {
        return this.status == PartnerStatus.DISABLED;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getContactName() {
        return contactName;
    }

    public String getPhone() {
        return phone;
    }

    public PartnerStatus getStatus() {
        return status;
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public Long getCreatedById() {
        return createdById;
    }
}
