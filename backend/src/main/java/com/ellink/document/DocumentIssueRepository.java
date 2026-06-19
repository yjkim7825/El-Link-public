package com.ellink.document;

import com.ellink.document.entity.DocumentIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface DocumentIssueRepository extends JpaRepository<DocumentIssue, Long> {

    /**
     * 발급 이력 조회(관리자). partner/document를 fetch join으로 함께 로드한다.
     * partnerId/from/to는 null이면 무시.
     */
    @Query("""
            select di from DocumentIssue di
            join fetch di.partner p
            join fetch di.document d
            where (:partnerId is null or p.id = :partnerId)
              and (:from is null or di.issuedAt >= :from)
              and (:to is null or di.issuedAt <= :to)
            order by di.issuedAt desc
            """)
    List<DocumentIssue> search(@Param("partnerId") Long partnerId,
                               @Param("from") Instant from,
                               @Param("to") Instant to);
}
