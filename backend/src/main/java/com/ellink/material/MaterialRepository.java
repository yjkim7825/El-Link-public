package com.ellink.material;

import com.ellink.material.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MaterialRepository extends JpaRepository<Material, Long> {

    /** 카테고리(일치)·키워드(keywords 부분일치) 필터. null인 조건은 무시한다. */
    @Query("""
            select m from Material m
            where (:category is null or m.category = :category)
              and (:keyword is null or m.keywords like concat('%', :keyword, '%'))
            order by m.createdAt desc
            """)
    List<Material> search(@Param("category") String category, @Param("keyword") String keyword);

    /** 협업 제안 컨텍스트용 — 최근 자료 30건. */
    List<Material> findTop30ByOrderByCreatedAtDesc();
}
