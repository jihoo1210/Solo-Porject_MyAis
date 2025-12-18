package com.myais.domain.execution.repository;

import com.myais.domain.execution.entity.Execution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExecutionRepository extends JpaRepository<Execution, UUID> {

    Page<Execution> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<Execution> findByUserIdAndAiToolIdOrderByCreatedAtDesc(UUID userId, UUID aiToolId, Pageable pageable);

    Page<Execution> findByUserIdAndIsFavoriteTrueOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<Execution> findTop5ByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT e FROM Execution e WHERE e.user.id = :userId " +
           "AND e.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY e.createdAt DESC")
    Page<Execution> findByUserIdAndDateRange(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query("SELECT e FROM Execution e WHERE e.user.id = :userId " +
           "AND (LOWER(e.output) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(e.inputData) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY e.createdAt DESC")
    Page<Execution> searchByKeyword(
            @Param("userId") UUID userId,
            @Param("keyword") String keyword,
            Pageable pageable);
}
