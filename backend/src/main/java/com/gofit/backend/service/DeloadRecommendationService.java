package com.gofit.backend.service;

import org.springframework.stereotype.Service;

@Service
public class DeloadRecommendationService {

    public String recommendDeload(
            RecoveryScoreService.RecoveryScore recoveryScore,
            TrainingReadinessService.TrainingReadiness readiness,
            String plateauDetection,
            WorkloadMonitoringService.WorkloadAssessment workloadAssessment
    ) {
        String plateau = safeText(plateauDetection).toLowerCase();

        if (readiness.getReadinessLevel().equals("LOW")
                && workloadAssessment.getWorkloadStatus().equals("ELEVATED")) {
            return "Current recovery trends may justify a temporary reduction in weekly volume or a recovery-focused training week.";
        }

        if (plateau.contains("accumulated training stress")
                || plateau.contains("true progression stall")) {
            return "Accumulated fatigue patterns may support a lower-stress training week before attempting to push progression again.";
        }

        if (recoveryScore.getScore() < 70) {
            return "A stabilization period with slightly reduced specialization emphasis may be useful while recovery quality improves.";
        }

        return "A dedicated deload does not appear necessary right now. Maintain the current plan and continue monitoring recovery and performance trends.";
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }
}
