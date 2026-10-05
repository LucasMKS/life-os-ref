package com.lifeos.modules.gaming.repository;

import com.lifeos.modules.gaming.model.GameJournalNote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GameJournalNoteRepository extends JpaRepository<GameJournalNote, String> {
    List<GameJournalNote> findByTrackedGameIdOrderByCreatedAtDesc(String trackedGameId);
}
