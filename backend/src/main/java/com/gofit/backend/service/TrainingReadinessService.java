package com.gofit.backend.service;

import org.springframework.stereotype.Service;

@Service
public class TrainingReadinessService {

    public TrainingReadiness assessReadiness(
            RecoveryScoreService.RecoveryScore recoveryScore,
            String progressAnalysis,
            String plateauDetection,
            WorkloadMonitoringService.WorkloadAssessment workloadAssessment
    ) {
        String progress = safeText(progressAnalysis).toLowerCase();
        String plateau = safeText(plateauDetection).toLowerCase();

        if (recoveryScore.getScore() < 60
                || workloadAssessment.getWorkloadStatus().equals("ELEVATED")) {
            return new TrainingReadiness(
                    "LOW",
                    "Training readiness currently appears low. Accumulated fatigue or recoverability limits may temporarily reduce high-performance training capacity."
            );
        }

        if (recoveryScore.getScore() < 80
                || progress.contains("fatigue trends may indicate accumulated training stress")
                || plateau.contains("progression stall")) {
            return new TrainingReadiness(
                    "MODERATE",
                    "Training readiness currently appears moderate. Productive work is still realistic, but aggressive progression may not be well-timed."
            );
        }

        return new TrainingReadiness(
                "HIGH",
                "Training readiness currently appears high. Recovery and workload signals look supportive of confident but still measured progression."
        );
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }

    public static class TrainingReadiness {

        private final String readinessLevel;
        private final String readinessFeedback;

        public TrainingReadiness(String readinessLevel, String readinessFeedback) {
            this.readinessLevel = readinessLevel;
            this.readinessFeedback = readinessFeedback;
        }

        public String getReadinessLevel() {
            return readinessLevel;
        }

        public String getReadinessFeedback() {
            return readinessFeedback;
        }
    }
}
