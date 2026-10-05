package com.lifeos.modules.notes.repository;

import com.lifeos.modules.notes.model.QuickNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuickNoteRepository extends JpaRepository<QuickNote, String> {
    List<QuickNote> findAllByUserIdOrderByIsPinnedDescCreatedAtDesc(String userId);
}