package com.gofit.backend.repository;

import com.gofit.backend.model.ProgressEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProgressEntryRepository extends JpaRepository<ProgressEntry, Long> {

    List<ProgressEntry> findByUserAccountEmail(String email);

    List<ProgressEntry> findByUserAccountEmailOrderByDateDescCreatedAtDesc(String email);
}
