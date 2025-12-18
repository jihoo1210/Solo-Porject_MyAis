package com.myais.domain.aitool.repository;

import com.myais.domain.aitool.entity.AITool;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AIToolRepository extends JpaRepository<AITool, UUID> {

    List<AITool> findByUserIdOrIsDefaultTrue(UUID userId);

    List<AITool> findByUserId(UUID userId);

    List<AITool> findByIsDefaultTrue();

    List<AITool> findByCategory(String category);

    @Query("SELECT a FROM AITool a WHERE " +
           "(a.user.id = :userId OR a.isDefault = true) " +
           "AND (LOWER(a.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(a.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<AITool> searchByKeyword(@Param("userId") UUID userId, @Param("keyword") String keyword);

    @Query("SELECT a FROM AITool a WHERE " +
           "(a.user.id = :userId OR a.isDefault = true) " +
           "AND a.category = :category")
    List<AITool> findByUserIdAndCategory(@Param("userId") UUID userId, @Param("category") String category);
}
