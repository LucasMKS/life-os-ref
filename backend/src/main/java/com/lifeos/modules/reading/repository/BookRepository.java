package com.lifeos.modules.reading.repository;

import com.lifeos.modules.reading.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, String> {
    List<Book> findAllByUserIdOrderByStartedAtDesc(String userId);

    List<Book> findByStatusAndUpdatedAtBefore(String status, LocalDateTime date);

    long countByUserIdAndStatus(String userId, String status);

    @Query("SELECT COALESCE(SUM(b.readPages), 0) FROM Book b WHERE b.userId = :userId")
    long sumReadPagesByUserId(@Param("userId") String userId);

    @Query("SELECT AVG(b.rating) FROM Book b WHERE b.userId = :userId AND b.status = 'READ' AND b.rating IS NOT NULL")
    Double averageRatingOfFinishedBooks(@Param("userId") String userId);
}
