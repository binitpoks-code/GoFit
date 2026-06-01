package com.gofit.backend.service;

import com.gofit.backend.model.ProgressEntry;
import com.gofit.backend.model.UserProfile;
import com.gofit.backend.model.UserAccount;
import com.gofit.backend.repository.ProgressEntryRepository;
import com.gofit.backend.repository.UserAccountRepository;
import com.gofit.backend.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProgressEntryService {

    private final ProgressEntryRepository progressEntryRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserAccountRepository userAccountRepository;

    public ProgressEntryService(
            ProgressEntryRepository progressEntryRepository,
            UserProfileRepository userProfileRepository,
            UserAccountRepository userAccountRepository
    ) {
        this.progressEntryRepository = progressEntryRepository;
        this.userProfileRepository = userProfileRepository;
        this.userAccountRepository = userAccountRepository;
    }

    public ProgressEntry saveProgressEntry(ProgressEntry progressEntry) {
        return progressEntryRepository.save(progressEntry);
    }

    public ProgressEntry saveProgressEntry(ProgressEntry progressEntry, Long userProfileId) {
        if (userProfileId != null) {
            UserProfile userProfile = userProfileRepository.findById(userProfileId)
                    .orElseThrow(() -> new IllegalArgumentException("User profile not found with id: " + userProfileId));

            progressEntry.setUserProfile(userProfile);
        }

        return progressEntryRepository.save(progressEntry);
    }

    public ProgressEntry saveProgressEntryForUser(
            ProgressEntry progressEntry,
            Long userProfileId,
            String email
    ) {
        UserAccount userAccount = userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user account was not found."));

        progressEntry.setUserAccount(userAccount);

        if (userProfileId != null) {
            UserProfile userProfile = userProfileRepository.findById(userProfileId)
                    .orElseThrow(() -> new IllegalArgumentException("User profile not found with id: " + userProfileId));

            if (userProfile.getUserAccount() != null
                    && !email.equals(userProfile.getUserAccount().getEmail())) {
                throw new IllegalArgumentException("This profile does not belong to the authenticated user.");
            }

            progressEntry.setUserProfile(userProfile);
        }

        return progressEntryRepository.save(progressEntry);
    }

    public List<ProgressEntry> getAllProgressEntries() {
        return progressEntryRepository.findAll();
    }

    public List<ProgressEntry> getProgressEntriesForUser(String email) {
        return progressEntryRepository.findByUserAccountEmailOrderByDateDescCreatedAtDesc(email);
    }

    public void deleteProgressEntry(Long id, String email) {
        ProgressEntry entry = progressEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Progress entry not found with id: " + id));
        if (entry.getUserAccount() == null || !email.equals(entry.getUserAccount().getEmail())) {
            throw new IllegalArgumentException("Not authorized to delete this entry.");
        }
        progressEntryRepository.deleteById(id);
    }

    public ProgressEntry updateProgressEntry(Long id, ProgressEntry data, Long userProfileId, String email) {
        ProgressEntry existing = progressEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Progress entry not found with id: " + id));
        if (existing.getUserAccount() == null || !email.equals(existing.getUserAccount().getEmail())) {
            throw new IllegalArgumentException("Not authorized to update this entry.");
        }
        existing.setBodyWeight(data.getBodyWeight());
        existing.setCalories(data.getCalories());
        existing.setSleepHours(data.getSleepHours());
        existing.setFatigueLevel(data.getFatigueLevel());
        existing.setWorkoutPerformance(data.getWorkoutPerformance());
        existing.setNotes(data.getNotes());
        existing.setRecoveryScore(data.getRecoveryScore());
        existing.setWorkoutCompleted(data.isWorkoutCompleted());
        existing.setEnergyLevel(data.getEnergyLevel());
        if (userProfileId != null) {
            Optional<UserProfile> profileOpt = userProfileRepository.findById(userProfileId);
            profileOpt.ifPresent(existing::setUserProfile);
        }
        return progressEntryRepository.save(existing);
    }
}
