package com.myais.domain.favorite.repository;

import com.myais.domain.favorite.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, UUID> {

    List<Favorite> findByUserId(UUID userId);

    Optional<Favorite> findByUserIdAndAiToolId(UUID userId, UUID aiToolId);

    boolean existsByUserIdAndAiToolId(UUID userId, UUID aiToolId);

    void deleteByUserIdAndAiToolId(UUID userId, UUID aiToolId);
}
