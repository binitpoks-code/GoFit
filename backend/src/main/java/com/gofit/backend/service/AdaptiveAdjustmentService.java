package com.gofit.backend.service;

import com.gofit.backend.model.UserProfile;
import org.springframework.stereotype.Service;

@Service
public class AdaptiveAdjustmentService {

    public String recommendAdjustments(
            UserProfile profile,
            String progressAnalysis,
            VolumeRecommendationService.VolumeRecommendation volumeRecommendation
    ) {
        String analysis = safeText(progressAnalysis).toLowerCase();
        String goal = safeText(profile.getGoal());
        String recoveryQuality = safeText(profile.getRecoveryQuality());
        String weakArea = safeText(profile.getWeakArea());

        StringBuilder adjustments = new StringBuilder();

        if (analysis.contains("fatigue trends may indicate accumulated training stress")) {
            adjustments.append("Recent fatigue trends suggest backing off weekly volume slightly or holding it steady before progressing again. ");
        }

        if (analysis.contains("recovery quality may be declining")
                || matches(recoveryQuality, "poor", "low")) {
            adjustments.append("Recovery indicators may support maintaining current workload instead of progressing aggressively. ");
        }

        if (analysis.contains("possible stagnation")
                || analysis.contains("stalled progression")) {
            adjustments.append("Progress appears stalled, so a short deload-style reduction in effort or volume may help restore training quality. ");
        }

        if (analysis.contains("calorie intake appears inconsistent")) {
            adjustments.append("Improve calorie consistency before increasing workload so body-weight and performance trends become easier to interpret. ");
        }

        if (goal.equalsIgnoreCase("Bulk")
                && analysis.contains("too inconsistent or too low")) {
            adjustments.append("For a muscle-gain phase, keep intake more consistently aligned with the calorie target before expecting faster progression. ");
        }

        if (!weakArea.isEmpty()
                && (analysis.contains("fatigue")
                || analysis.contains("recovery"))) {
            adjustments.append("Reduce weak-area specialization volume temporarily so recovery resources are not stretched too thin. ");
        }

        if (adjustments.length() == 0) {
            return "Current trends do not call for a major adjustment yet. Maintain the present workload, monitor progress entries, and increase demands only when recovery and performance remain steady.";
        }

        adjustments.append("This keeps the plan aligned with the current ")
                .append(volumeRecommendation.getWeeklyTrainingVolume().toLowerCase())
                .append(" approach instead of adding stress too quickly.");

        return adjustments.toString().trim();
    }

    private boolean matches(String value, String firstOption, String secondOption) {
        String safeValue = safeText(value);
        return safeValue.equalsIgnoreCase(firstOption) || safeValue.equalsIgnoreCase(secondOption);
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }
}
