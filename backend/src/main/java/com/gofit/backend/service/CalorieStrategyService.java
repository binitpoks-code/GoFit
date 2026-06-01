package com.gofit.backend.service;

import com.gofit.backend.model.UserProfile;
import org.springframework.stereotype.Service;

@Service
public class CalorieStrategyService {

    public CalorieStrategy buildCalorieStrategy(
            UserProfile profile,
            CoachingInsightService.CoachingInsights coachingInsights,
            RecoveryScoreService.RecoveryScore recoveryScore,
            ProgressionStrategyService.ProgressionStrategy progressionStrategy
    ) {
        int maintenanceCalories = estimateMaintenanceCalories(profile, coachingInsights.getTrainingFrequency());
        int cuttingCalories = maintenanceCalories - 400;
        int bulkingCalories = maintenanceCalories + 250;
        int maintenanceLow = maintenanceCalories - 150;
        int maintenanceHigh = maintenanceCalories + 150;

        String deficitSeverity = buildDeficitSeverity(profile, maintenanceCalories);
        String surplusSustainability = buildSurplusSustainability(profile, maintenanceCalories, recoveryScore);
        String calorieStrategy = buildStrategyMessage(
                profile,
                maintenanceCalories,
                cuttingCalories,
                bulkingCalories,
                progressionStrategy
        );

        return new CalorieStrategy(
                maintenanceCalories,
                cuttingCalories,
                bulkingCalories,
                maintenanceLow,
                maintenanceHigh,
                deficitSeverity,
                surplusSustainability,
                calorieStrategy
        );
    }

    private int estimateMaintenanceCalories(UserProfile profile, int trainingFrequency) {
        double baseCalories = profile.getWeight() * 22;
        int activityCalories = trainingFrequency * 120;
        int maintenanceCalories = (int) Math.round(baseCalories + activityCalories);

        return Math.max(maintenanceCalories, 1800);
    }

    private String buildDeficitSeverity(UserProfile profile, int maintenanceCalories) {
        if (!profile.isCalorieTracking() || profile.getCurrentCalories() <= 0) {
            return "Deficit severity cannot be judged well until current intake is tracked consistently.";
        }

        int gap = maintenanceCalories - profile.getCurrentCalories();

        if (gap >= 600) {
            return "Current intake may be too aggressive for sustainable progression and recovery.";
        }

        if (gap >= 250) {
            return "Current intake suggests a moderate deficit that should be monitored for fatigue and performance changes.";
        }

        return "Current intake does not suggest an aggressive deficit.";
    }

    private String buildSurplusSustainability(
            UserProfile profile,
            int maintenanceCalories,
            RecoveryScoreService.RecoveryScore recoveryScore
    ) {
        if (!safeText(profile.getGoal()).equalsIgnoreCase("Bulk")) {
            return "Surplus sustainability is most relevant during a muscle-gain phase.";
        }

        int surplus = profile.getCurrentCalories() - maintenanceCalories;

        if (profile.getCurrentCalories() <= 0) {
            return "A moderate surplus may better support recovery and hypertrophy once intake tracking is consistent.";
        }

        if (surplus < 150) {
            return "The current surplus may be too small to strongly support recovery and hypertrophy progression.";
        }

        if (surplus > 500 && recoveryScore.getScore() < 70) {
            return "The current surplus is sizeable, but recovery still looks limited, so food may not be the only bottleneck.";
        }

        return "The current surplus appears reasonable for a sustainable muscle-gain phase.";
    }

    private String buildStrategyMessage(
            UserProfile profile,
            int maintenanceCalories,
            int cuttingCalories,
            int bulkingCalories,
            ProgressionStrategyService.ProgressionStrategy progressionStrategy
    ) {
        String goal = safeText(profile.getGoal());

        if (goal.equalsIgnoreCase("Cut")) {
            return "Estimated maintenance calories are near "
                    + maintenanceCalories
                    + ". A realistic cutting target is around "
                    + cuttingCalories
                    + " calories, adjusted based on recovery and performance.";
        }

        if (goal.equalsIgnoreCase("Bulk")) {
            return "Estimated maintenance calories are near "
                    + maintenanceCalories
                    + ". A moderate surplus near "
                    + bulkingCalories
                    + " calories may better support recovery and hypertrophy goals.";
        }

        if (progressionStrategy.getProgressionState().equals("RECOVERY")) {
            return "Estimated maintenance calories are near "
                    + maintenanceCalories
                    + ". Maintenance intake is the safest default while recovery is being rebuilt.";
        }

        return "Estimated maintenance calories are near "
                + maintenanceCalories
                + ". Staying close to maintenance gives the coaching system a stable baseline for future adjustments.";
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }

    public static class CalorieStrategy {

        private final int estimatedMaintenanceCalories;
        private final int cuttingCalories;
        private final int bulkingCalories;
        private final int maintenanceCaloriesLow;
        private final int maintenanceCaloriesHigh;
        private final String deficitSeverity;
        private final String surplusSustainability;
        private final String calorieStrategy;

        public CalorieStrategy(
                int estimatedMaintenanceCalories,
                int cuttingCalories,
                int bulkingCalories,
                int maintenanceCaloriesLow,
                int maintenanceCaloriesHigh,
                String deficitSeverity,
                String surplusSustainability,
                String calorieStrategy
        ) {
            this.estimatedMaintenanceCalories = estimatedMaintenanceCalories;
            this.cuttingCalories = cuttingCalories;
            this.bulkingCalories = bulkingCalories;
            this.maintenanceCaloriesLow = maintenanceCaloriesLow;
            this.maintenanceCaloriesHigh = maintenanceCaloriesHigh;
            this.deficitSeverity = deficitSeverity;
            this.surplusSustainability = surplusSustainability;
            this.calorieStrategy = calorieStrategy;
        }

        public int getEstimatedMaintenanceCalories() {
            return estimatedMaintenanceCalories;
        }

        public int getCuttingCalories() {
            return cuttingCalories;
        }

        public int getBulkingCalories() {
            return bulkingCalories;
        }

        public int getMaintenanceCaloriesLow() {
            return maintenanceCaloriesLow;
        }

        public int getMaintenanceCaloriesHigh() {
            return maintenanceCaloriesHigh;
        }

        public String getDeficitSeverity() {
            return deficitSeverity;
        }

        public String getSurplusSustainability() {
            return surplusSustainability;
        }

        public String getCalorieStrategy() {
            return calorieStrategy;
        }
    }
}
