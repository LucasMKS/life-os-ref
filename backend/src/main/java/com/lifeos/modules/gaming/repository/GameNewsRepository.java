package com.lifeos.modules.gaming.repository;

import com.lifeos.modules.gaming.model.GameNews;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameNewsRepository extends JpaRepository<GameNews, String> {
    List<GameNews> findAllByOrderByPublishedAtDesc();
}
