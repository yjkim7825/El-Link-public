package com.ellink.material;

import com.ellink.material.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MaterialRepository extends JpaRepository<Material, Long> {

    /**
     * 카테고리(일치)·키워드(keywords 부분일치) 필터. null인 조건은 무시한다.
     *
     * PostgreSQL(Hibernate 6) 대응: `:param is null or ...` 패턴에서는 파라미터가
     * null 비교에만 묶여 바인드 타입을 추론하지 못해 드라이버가 bytea 로 전송 →
     * `operator does not exist: character varying ~~ bytea` 500 발생. 명시적
     * cast(:param as String) 로 varchar 타입을 강제해 타입 추론 문제를 차단한다.
     */
    @Query("""
            select m from Material m
            where (:category is null or m.category = cast(:category as String))
              and (:keyword is null or m.keywords like concat('%', cast(:keyword as String), '%'))
            order by m.createdAt desc
            """)
    List<Material> search(@Param("category") String category, @Param("keyword") String keyword);

    /** 협업 제안 컨텍스트용 — 최근 자료 30건. */
    List<Material> findTop30ByOrderByCreatedAtDesc();
}
