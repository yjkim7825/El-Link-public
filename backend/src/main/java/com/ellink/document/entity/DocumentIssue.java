package com.ellink.document.entity;

import com.ellink.partner.entity.Partner;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * 서류 발급 이력 — 누가(partner) / 언제(issuedAt) / 어떤 문서(document)를 받았는지.
 * 같은 파트너가 같은 문서를 여러 번 다운로드하면 row가 그만큼 쌓인다.
 */
@Entity
@Table(name = "document_issue")
public class DocumentIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private CompanyDocument document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private Partner partner;

    @Column(nullable = false, updatable = false)
    private Instant issuedAt;

    protected DocumentIssue() {
    }

    public DocumentIssue(CompanyDocument document, Partner partner) {
        this.document = document;
        this.partner = partner;
        this.issuedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public CompanyDocument getDocument() {
        return document;
    }

    public Partner getPartner() {
        return partner;
    }

    public Instant getIssuedAt() {
        return issuedAt;
    }
}
