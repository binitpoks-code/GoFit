package com.gofit.backend.service;

import com.gofit.backend.model.UserProfile;
import org.springframework.stereotype.Service;

@Service
public class RecoveryScoreService {

    public RecoveryScore calculateRecoveryScore(
            UserProfile profile,
            String progressAnalysis,
            String plateauDetection,
            WorkloadMonitoringService.WorkloadAssessment workloadAssessment
    ) {
        String progress = safeText(progressAnalysis).toLowerCase();
        String plateau = safeText(plateauDetection).toLowerCase();
        int score = 82;

        if (matches(profile.getRecoveryQuality(), "poor", "low")) {
            score -= 18;
        } else if (matches(profile.getRecoveryQuality(), "average", "moderate")) {
            score -= 8;
        }

        if (matches(profile.getFatigueTolerance(), "low", "limited")) {
            score -= 12;
        }

        if (progress.contains("recovery quality may be declining")) {
            score -= 12;
        }
        if (progress.contains("fatigue trends may indicate accumulated training stress")) {
            score -= 10;
        }
        if (progress.contains("calorie intake appears inconsistent")) {
            score -= 6;
        }
        if (plateau.contains("accumulated training stress")) {
            score -= 8;
        }
        if (workloadAssessment.getWorkloadStatus().equals("ELEVATED")) {
            score -= 10;
        }

        score = Math.max(35, Math.min(score, 96));

        return new RecoveryScore(score, buildRecoveryFeedback(score, progress));
    }

    private String buildRecoveryFeedback(int score, String progress) {
        if (score < 60) {
            return "Recovery currently appears strained. Recent fatigue or recovery signals may be reducing recoverability.";
        }

        if (score < 80) {
            return "Recovery currently appears moderate. Progress can continue, but fatigue accumulation deserves attention.";
        }

        if (progress.contains("recovery quality may be declining")) {
            return "Recovery is still fairly supportive overall, though recent sleep trends suggest it should be watched closely.";
        }

        return "Recovery currently appears solid, with enough support for steady training progression.";
    }

    private boolean matches(String value, String firstOption, String secondOption) {
        String safeValue = safeText(value);
        return safeValue.equalsIgnoreCase(firstOption) || safeValue.equalsIgnoreCase(secondOption);
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }

    public static class RecoveryScore {

        private final int score;
        private final String feedback;

        public RecoveryScore(int score, String feedback) {
            this.score = score;
            this.feedback = feedback;
        }

        public int getScore() {
            return score;
        }

        public String getFeedback() {
            return feedback;
        }
    }
}
