package com.gofit.backend.service;

import com.gofit.backend.model.UserProfile;
import org.springframework.stereotype.Service;

@Service
public class CoachingInsightService {

    public CoachingInsights buildInsights(UserProfile profile) {
        String goal = safeText(profile.getGoal());
        String weakArea = safeText(profile.getWeakArea());
        String experienceLevel = safeText(profile.getExperienceLevel());
        String recoveryQuality = safeText(profile.getRecoveryQuality());
        String fatigueTolerance = safeText(profile.getFatigueTolerance());

        int trainingFrequency = chooseTrainingFrequency(profile);
        int recommendedCalories = chooseRecommendedCalories(profile, goal);

        return new CoachingInsights(
                buildNutritionAdvice(profile, goal, recommendedCalories),
                buildRecoveryFeedback(recoveryQuality),
                buildFatigueFeedback(fatigueTolerance, profile),
                buildAdditionalAdvice(goal, weakArea, experienceLevel, trainingFrequency),
                trainingFrequency,
                recommendedCalories
        );
    }

    private int chooseTrainingFrequency(UserProfile profile) {
        int availableDays = profile.getTrainingDaysAvailable() > 0
                ? profile.getTrainingDaysAvailable()
                : 4;

        int trainingFrequency = Math.min(availableDays, 5);

        boolean lowRecovery = matches(profile.getRecoveryQuality(), "poor", "low");
        boolean lowFatigueTolerance = matches(profile.getFatigueTolerance(), "low", "limited");
        boolean aggressiveDeficit = isAggressiveDeficit(profile);

        if (lowRecovery || lowFatigueTolerance || aggressiveDeficit) {
            trainingFrequency = Math.min(trainingFrequency, 4);
        }

        if (matches(profile.getExperienceLevel(), "beginner", "novice")) {
            trainingFrequency = Math.min(trainingFrequency, 4);
        }

        return Math.max(trainingFrequency, 3);
    }

    private int chooseRecommendedCalories(UserProfile profile, String goal) {
        int currentCalories = profile.getCurrentCalories();

        if (goal.equalsIgnoreCase("Bulk")) {
            return currentCalories > 0 ? currentCalories + 250 : 2800;
        }

        if (goal.equalsIgnoreCase("Cut")) {
            return currentCalories > 0 ? Math.max(currentCalories - 350, 1600) : 2200;
        }

        return currentCalories > 0 ? currentCalories : 2500;
    }

    private String buildNutritionAdvice(UserProfile profile, String goal, int recommendedCalories) {
        if (!profile.isCalorieTracking()) {
            return "Start tracking calories for a few weeks so nutrition changes can be judged more accurately.";
        }

        if (isAggressiveDeficit(profile)) {
            return "Current calories look quite aggressive for a fat-loss phase, so training frequency should stay conservative and recovery should be monitored closely.";
        }

        if (goal.equalsIgnoreCase("Bulk")) {
            return "A target near "
                    + recommendedCalories
                    + " calories is a practical starting point for a lean gaining phase.";
        }

        if (goal.equalsIgnoreCase("Cut")) {
            return "A target near "
                    + recommendedCalories
                    + " calories keeps the deficit purposeful without pushing unnecessarily hard.";
        }

        return "A target near "
                + recommendedCalories
                + " calories supports a stable maintenance phase.";
    }

    private String buildRecoveryFeedback(String recoveryQuality) {
        if (recoveryQuality.equalsIgnoreCase("Poor") || recoveryQuality.equalsIgnoreCase("Low")) {
            return "Recovery quality looks limited, so use rest days deliberately, keep sleep consistent, and avoid increasing training volume too quickly.";
        }

        if (recoveryQuality.equalsIgnoreCase("Average") || recoveryQuality.equalsIgnoreCase("Moderate")) {
            return "Recovery looks workable, but sleep, soreness, and session quality should guide whether volume increases are appropriate.";
        }

        return "Recovery appears supportive enough for steady progression, provided sleep and food stay consistent.";
    }

    private String buildFatigueFeedback(String fatigueTolerance, UserProfile profile) {
        if (fatigueTolerance.equalsIgnoreCase("Low") || fatigueTolerance.equalsIgnoreCase("Limited")) {
            return "Fatigue tolerance appears lower, so prioritize high-quality sets, avoid stacking too many demanding days together, and keep training frequency realistic.";
        }

        if (isAggressiveDeficit(profile)) {
            return "Because the profile suggests a harder deficit, fatigue can build faster than usual even if motivation is high.";
        }

        if (fatigueTolerance.equalsIgnoreCase("Moderate")) {
            return "Fatigue tolerance looks moderate, so progress should be steady rather than rushed.";
        }

        return "Fatigue tolerance appears supportive of consistent progression when recovery habits stay stable.";
    }

    private String buildAdditionalAdvice(
            String goal,
            String weakArea,
            String experienceLevel,
            int trainingFrequency
    ) {
        StringBuilder advice = new StringBuilder();

        if (goal.equalsIgnoreCase("Bulk")) {
            advice.append("Aim for a small calorie surplus to support muscle gain while keeping progression steady. ");
        } else if (goal.equalsIgnoreCase("Cut")) {
            advice.append("Prioritize a controlled calorie deficit, high protein intake, and strength retention. ");
        } else {
            advice.append("Use a balanced maintenance approach with steady training performance and consistent recovery. ");
        }

        if (experienceLevel.equalsIgnoreCase("Beginner") || experienceLevel.equalsIgnoreCase("Novice")) {
            advice.append("Keep the plan beginner-friendly around ")
                    .append(trainingFrequency)
                    .append(" weekly training days. ");
        } else {
            advice.append("A structured plan across ")
                    .append(trainingFrequency)
                    .append(" weekly training days should fit the profile well. ");
        }

        if (!weakArea.isEmpty()) {
            advice.append("Add a little extra quality volume for ")
                    .append(weakArea)
                    .append(" while keeping total workload manageable.");
        }

        return advice.toString().trim();
    }

    private boolean isAggressiveDeficit(UserProfile profile) {
        return profile.getGoal() != null
                && profile.getGoal().equalsIgnoreCase("Cut")
                && profile.isCalorieTracking()
                && profile.getCurrentCalories() > 0
                && profile.getCurrentCalories() <= 1800;
    }

    private boolean matches(String value, String firstOption, String secondOption) {
        String safeValue = safeText(value);
        return safeValue.equalsIgnoreCase(firstOption) || safeValue.equalsIgnoreCase(secondOption);
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }

    public static class CoachingInsights {

        private final String calorieFeedback;
        private final String recoveryFeedback;
        private final String fatigueFeedback;
        private final String additionalAdvice;
        private final int trainingFrequency;
        private final int recommendedCalories;

        public CoachingInsights(
                String calorieFeedback,
                String recoveryFeedback,
                String fatigueFeedback,
                String additionalAdvice,
                int trainingFrequency,
                int recommendedCalories
        ) {
            this.calorieFeedback = calorieFeedback;
            this.recoveryFeedback = recoveryFeedback;
            this.fatigueFeedback = fatigueFeedback;
            this.additionalAdvice = additionalAdvice;
            this.trainingFrequency = trainingFrequency;
            this.recommendedCalories = recommendedCalories;
        }

        public String getCalorieFeedback() {
            return calorieFeedback;
        }

        public String getRecoveryFeedback() {
            return recoveryFeedback;
        }

        public String getFatigueFeedback() {
            return fatigueFeedback;
        }

        public String getAdditionalAdvice() {
            return additionalAdvice;
        }

        public int getTrainingFrequency() {
            return trainingFrequency;
        }

        public int getRecommendedCalories() {
            return recommendedCalories;
        }
    }
}
