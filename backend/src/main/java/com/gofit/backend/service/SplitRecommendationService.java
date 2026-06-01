package com.gofit.backend.service;

import com.gofit.backend.model.UserProfile;
import org.springframework.stereotype.Service;

@Service
public class SplitRecommendationService {

    public SplitRecommendation recommendSplit(UserProfile profile) {
        String goal = safeText(profile.getGoal());
        String weakArea = safeText(profile.getWeakArea());
        String experienceLevel = safeText(profile.getExperienceLevel());
        String recoveryQuality = safeText(profile.getRecoveryQuality());
        String fatigueTolerance = safeText(profile.getFatigueTolerance());
        int trainingDays = profile.getTrainingDaysAvailable();

        boolean beginner = matches(experienceLevel, "beginner", "novice");
        boolean intermediate = matches(experienceLevel, "intermediate", "");
        boolean advanced = matches(experienceLevel, "advanced", "expert");
        boolean goodRecovery = matches(recoveryQuality, "good", "high");
        boolean poorRecovery = matches(recoveryQuality, "poor", "low");
        boolean highRecovery = goodRecovery && matches(fatigueTolerance, "high", "strong");
        boolean hypertrophyFocus = matches(goal, "hypertrophy", "bodybuilding")
                || goal.equalsIgnoreCase("Bulk");
        boolean strengthFocus = matches(goal, "strength", "powerlifting");
        boolean enoughCalories = profile.getCurrentCalories() >= 2400
                || (profile.getCurrentCalories() <= 0 && !profile.isCalorieTracking());

        if (!weakArea.isEmpty() && (intermediate || advanced)) {
            return new SplitRecommendation(
                    "Hybrid Split",
                    "A hybrid approach keeps the weekly structure balanced while giving "
                            + weakArea
                            + " extra focused work without turning every session into specialization day."
            );
        }

        if (advanced && hypertrophyFocus && highRecovery) {
            return new SplitRecommendation(
                    "Arnold Split",
                    "An advanced lifter with a bodybuilding-style goal and strong recovery can usually handle the higher session density and overlapping muscle exposure this split brings."
            );
        }

        if (hypertrophyFocus
                && trainingDays >= 5
                && trainingDays <= 6
                && goodRecovery
                && enoughCalories) {
            return new SplitRecommendation(
                    "Push Pull Legs",
                    "With 5 to 6 training days, supportive recovery, and enough nutritional support, this split gives frequent hypertrophy practice while staying organized."
            );
        }

        if (strengthFocus && (poorRecovery || matches(fatigueTolerance, "low", "limited"))) {
            return new SplitRecommendation(
                    "Bro Split",
                    "Longer recovery windows and more focused single-session work can suit a strength-focused user who does better with extra rest between demanding muscle-group sessions."
            );
        }

        if (intermediate && trainingDays == 4) {
            return new SplitRecommendation(
                    "Upper/Lower",
                    "Four available days pairs naturally with upper/lower training and gives a useful balance of frequency, recovery, and session focus."
            );
        }

        if (beginner && (trainingDays <= 3 || poorRecovery)) {
            return new SplitRecommendation(
                    "Full Body",
                    "A beginner with fewer available training days or weaker recovery usually benefits from simpler full-body sessions, repeated practice, and manageable fatigue."
            );
        }

        if (trainingDays <= 3) {
            return new SplitRecommendation(
                    "Full Body",
                    "Fewer training days are usually best spent covering the whole body each session so important movement patterns stay frequent."
            );
        }

        return new SplitRecommendation(
                "Upper/Lower",
                "This is a practical middle-ground split that supports steady progression, reasonable recovery, and clear weekly structure."
        );
    }

    private boolean matches(String value, String firstOption, String secondOption) {
        String safeValue = safeText(value);

        if (!firstOption.isEmpty() && safeValue.equalsIgnoreCase(firstOption)) {
            return true;
        }

        return !secondOption.isEmpty() && safeValue.equalsIgnoreCase(secondOption);
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }

    public static class SplitRecommendation {

        private final String splitName;
        private final String reason;

        public SplitRecommendation(String splitName, String reason) {
            this.splitName = splitName;
            this.reason = reason;
        }

        public String getSplitName() {
            return splitName;
        }

        public String getReason() {
            return reason;
        }
    }
}
