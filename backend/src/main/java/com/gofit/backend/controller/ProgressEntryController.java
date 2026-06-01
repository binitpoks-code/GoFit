package com.gofit.backend.controller;

import com.gofit.backend.dto.ProgressEntryDTO;
import com.gofit.backend.service.ProgressEntryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
public class ProgressEntryController {

    private final ProgressEntryService progressEntryService;

    public ProgressEntryController(ProgressEntryService progressEntryService) {
        this.progressEntryService = progressEntryService;
    }

    @PostMapping
    public ProgressEntryDTO createProgressEntry(
            @Valid @RequestBody ProgressEntryDTO progressEntryDTO,
            Authentication authentication
    ) {
        return ProgressEntryDTO.fromEntity(
                progressEntryService.saveProgressEntryForUser(
                        progressEntryDTO.toEntity(),
                        progressEntryDTO.getUserProfileId(),
                        authentication.getName()
                )
        );
    }

    @GetMapping
    public List<ProgressEntryDTO> getAllProgressEntries(Authentication authentication) {
        return progressEntryService.getProgressEntriesForUser(authentication.getName())
                .stream()
                .map(ProgressEntryDTO::fromEntity)
                .toList();
    }

    @PutMapping("/{id}")
    public ProgressEntryDTO updateProgressEntry(
            @PathVariable Long id,
            @Valid @RequestBody ProgressEntryDTO progressEntryDTO,
            Authentication authentication
    ) {
        return ProgressEntryDTO.fromEntity(
                progressEntryService.updateProgressEntry(
                        id,
                        progressEntryDTO.toEntity(),
                        progressEntryDTO.getUserProfileId(),
                        authentication.getName()
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProgressEntry(
            @PathVariable Long id,
            Authentication authentication
    ) {
        progressEntryService.deleteProgressEntry(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
