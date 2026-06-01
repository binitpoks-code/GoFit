package com.gofit.backend.service;

import com.gofit.backend.model.UserProfile;
import org.springframework.stereotype.Service;

@Service
public class WorkloadMonitoringService {

    public WorkloadAssessment monitorWorkload(
            UserProfile profile,
            VolumeRecommendationService.VolumeRecommendation volumeRecommendation,
            String progressAnalysis,
            String plateauDetection
    ) {
        String progress = safeText(progressAnalysis).toLowerCase();
        String plateau = safeText(plateauDetection).toLowerCase();
        int weeklySets = volumeRecommendation.getEstimatedWeeklySets();

        int stressSignals = 0;

        if (weeklySets >= 17) {
            stressSignals++;
        }
        if (progress.contains("fatigue trends may indicate accumulated training stress")) {
            stressSignals++;
        }
        if (progress.contains("recovery quality may be declining")) {
            stressSignals++;
        }
        if (plateau.contains("accumulated training stress")) {
            stressSignals++;
        }
        if (matches(profile.getRecoveryQuality(), "poor", "low")) {
            stressSignals++;
        }

        if (stressSignals >= 3) {
            return new WorkloadAssessment(
                    "ELEVATED",
                    "Recent trends may suggest excessive accumulated training stress. Current workload may be outpacing recoverability."
            );
        }

        if (stressSignals >= 1) {
            return new WorkloadAssessment(
                    "WATCH",
                    "Current workload appears manageable, but fatigue, recovery, or plateau signals suggest progression should stay measured."
            );
        }

        return new WorkloadAssessment(
                "SUSTAINABLE",
                "Current workload appears sustainable, with no strong sign that training stress is exceeding recoverability."
        );
    }

    private boolean matches(String value, String firstOption, String secondOption) {
        String safeValue = safeText(value);
        return safeValue.equalsIgnoreCase(firstOption) || safeValue.equalsIgnoreCase(secondOption);
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }

    public static class WorkloadAssessment {

        private final String workloadStatus;
        private final String workloadObservation;

        public WorkloadAssessment(String workloadStatus, String workloadObservation) {
            this.workloadStatus = workloadStatus;
            this.workloadObservation = workloadObservation;
        }

        public String getWorkloadStatus() {
            return workloadStatus;
        }

        public String getWorkloadObservation() {
            return workloadObservation;
        }
    }
}
