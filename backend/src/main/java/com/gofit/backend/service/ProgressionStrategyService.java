package com.gofit.backend.service;

import com.gofit.backend.model.UserProfile;
import org.springframework.stereotype.Service;

@Service
public class ProgressionStrategyService {

    public ProgressionStrategy determineStrategy(
            UserProfile profile,
            RecoveryScoreService.RecoveryScore recoveryScore,
            TrainingReadinessService.TrainingReadiness trainingReadiness,
            WorkloadMonitoringService.WorkloadAssessment workloadAssessment,
            ConsistencyScoringService.ConsistencyScore consistencyScore,
            String progressAnalysis,
            String plateauDetection
    ) {
        String progress = safeText(progressAnalysis).toLowerCase();
        String plateau = safeText(plateauDetection).toLowerCase();
        String weakArea = safeText(profile.getWeakArea());

        if (recoveryScore.getScore() < 60 || trainingReadiness.getReadinessLevel().equals("LOW")) {
            return new ProgressionStrategy(
                    "RECOVERY",
                    "Fatigue accumulation may currently favor a recovery-oriented approach before pushing progression again."
            );
        }

        if (workloadAssessment.getWorkloadStatus().equals("ELEVATED")
                || progress.contains("fatigue trends may indicate accumulated training stress")) {
            return new ProgressionStrategy(
                    "FATIGUE_MANAGEMENT",
                    "Current workload and fatigue signals suggest managing training stress should take priority over adding more work."
            );
        }

        if (plateau.contains("progression stall")
                || plateau.contains("performance appears relatively stagnant")
                || consistencyScore.getScore() < 70) {
            return new ProgressionStrategy(
                    "STABILIZATION",
                    "Recent recovery or progression patterns may justify a temporary stabilization phase before increasing demands."
            );
        }

        if (!weakArea.isEmpty()
                && recoveryScore.getScore() >= 75
                && consistencyScore.getScore() >= 75
                && trainingReadiness.getReadinessLevel().equals("HIGH")) {
            return new ProgressionStrategy(
                    "SPECIALIZATION",
                    "Recovery, readiness, and consistency are strong enough to support a focused specialization phase for "
                            + weakArea
                            + "."
            );
        }

        return new ProgressionStrategy(
                "PROGRESSION",
                "Current trends support a progression-focused phase with measured increases in training demand."
        );
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }

    public static class ProgressionStrategy {

        private final String progressionState;
        private final String progressionStrategy;

        public ProgressionStrategy(String progressionState, String progressionStrategy) {
            this.progressionState = progressionState;
            this.progressionStrategy = progressionStrategy;
        }

        public String getProgressionState() {
            return progressionState;
        }

        public String getProgressionStrategy() {
            return progressionStrategy;
        }
    }
}
