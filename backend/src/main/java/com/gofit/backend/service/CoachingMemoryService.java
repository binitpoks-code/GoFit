package com.gofit.backend.service;

import com.gofit.backend.model.ProgressEntry;
import com.gofit.backend.model.UserProfile;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CoachingMemoryService {

    public String buildCoachingMemory(
            UserProfile profile,
            VolumeRecommendationService.VolumeRecommendation volumeRecommendation,
            WorkloadMonitoringService.WorkloadAssessment workloadAssessment,
            ConsistencyScoringService.ConsistencyScore consistencyScore,
            String plateauDetection
    ) {
        List<ProgressEntry> entries = profile.getProgressEntries();

        if (entries.size() < 4) {
            return "Coaching memory is still developing. More progress history will make long-term personalization more reliable.";
        }

        StringBuilder memory = new StringBuilder();

        if (countStagnationSignals(entries) >= 2) {
            memory.append("Historical entries show repeated stagnation signals, so future progression should be introduced gradually. ");
        }

        if (countHighFatigueEntries(entries) >= 2) {
            memory.append("Previous phases show repeated elevated fatigue, suggesting the user may respond better to moderate-frequency structures. ");
        }

        if (workloadAssessment.getWorkloadStatus().equals("ELEVATED")
                && volumeRecommendation.getEstimatedWeeklySets() >= 16) {
            memory.append("Previous high-volume patterns appear more likely to challenge recoverability. ");
        }

        if (consistencyScore.getScore() >= 80) {
            memory.append("Long-term consistency patterns appear supportive of gradual progression. ");
        }

        if (safeText(plateauDetection).toLowerCase().contains("calorie")) {
            memory.append("Nutrition consistency should remain part of the coaching context because calorie patterns may be affecting progression. ");
        }

        if (memory.length() == 0) {
            return "Current history suggests a balanced response pattern, with no strong long-term limitation standing out yet.";
        }

        return memory.toString().trim();
    }

    private int countHighFatigueEntries(List<ProgressEntry> entries) {
        int count = 0;

        for (ProgressEntry entry : entries) {
            String fatigue = safeText(entry.getFatigueLevel());

            if (fatigue.equalsIgnoreCase("High") || fatigue.equalsIgnoreCase("Severe")) {
                count++;
            }
        }

        return count;
    }

    private int countStagnationSignals(List<ProgressEntry> entries) {
        int count = 0;

        for (ProgressEntry entry : entries) {
            String performance = safeText(entry.getWorkoutPerformance()).toLowerCase();
            String notes = safeText(entry.getNotes()).toLowerCase();

            if (containsAny(performance, "stagnant", "plateau", "stalled", "regressed")
                    || containsAny(notes, "stagnant", "plateau", "stalled", "regressed")) {
                count++;
            }
        }

        return count;
    }

    private boolean containsAny(String value, String first, String second, String third, String fourth) {
        return value.contains(first)
                || value.contains(second)
                || value.contains(third)
                || value.contains(fourth);
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }
}
