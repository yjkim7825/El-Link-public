package com.ellink.quote;

import com.ellink.quote.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuoteRepository extends JpaRepository<Quote, Long> {

    List<Quote> findByPartnerIdOrderByCreatedAtDesc(Long partnerId);

    /** 소유권 확인 포함 단건 조회(다른 파트너 견적은 빈 Optional → 404). */
    Optional<Quote> findByIdAndPartnerId(Long id, Long partnerId);
}
