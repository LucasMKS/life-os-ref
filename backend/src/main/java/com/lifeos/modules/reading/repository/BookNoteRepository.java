package com.lifeos.modules.reading.repository;

import com.lifeos.modules.reading.dto.RecentNoteDTO;
import com.lifeos.modules.reading.model.BookNote;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookNoteRepository extends JpaRepository<BookNote, String> {

    @Query("""
            SELECT new com.lifeos.reading.dto.RecentNoteDTO(n.id, n.note, n.createdAt, b.id, b.title, b.coverUrl)
            FROM BookNote n JOIN n.book b
            WHERE n.userId = :userId
            ORDER BY n.createdAt DESC
            """)
    List<RecentNoteDTO> findRecentNotesByUserId(@Param("userId") String userId, Pageable pageable);
}
