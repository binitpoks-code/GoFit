package com.gofit.backend.service;

import com.gofit.backend.model.UserProfile;
import org.springframework.stereotype.Service;

@Service
public class VolumeRecommendationService {

    public VolumeRecommendation recommendVolume(UserProfile profile) {
        String goal = safeText(profile.getGoal());
        String experienceLevel = safeText(profile.getExperienceLevel());
        String recoveryQuality = safeText(profile.getRecoveryQuality());
        String fatigueTolerance = safeText(profile.getFatigueTolerance());
        String weakArea = safeText(profile.getWeakArea());

        int weeklySets = chooseBaseWeeklySets(goal, experienceLevel);
        weeklySets = adjustForRecovery(weeklySets, recoveryQuality);
        weeklySets = adjustForFatigue(weeklySets, fatigueTolerance);
        weeklySets = adjustForCaloriesAndGoal(weeklySets, profile, goal);

        int trainingDays = profile.getTrainingDaysAvailable() > 0
                ? profile.getTrainingDaysAvailable()
                : 4;

        String weeklyTrainingVolume = buildWeeklyTrainingVolume(weeklySets);
        String muscleFrequencyEmphasis = buildFrequencyEmphasis(goal, experienceLevel, trainingDays);
        String specializationAdjustment = buildSpecializationAdjustment(weakArea, experienceLevel);
        String volumeReason = buildVolumeReason(
                goal,
                experienceLevel,
                recoveryQuality,
                fatigueTolerance,
                profile,
                weakArea
        );

        return new VolumeRecommendation(
                weeklyTrainingVolume,
                weeklySets,
                muscleFrequencyEmphasis,
                specializationAdjustment,
                volumeReason
        );
    }

    private int chooseBaseWeeklySets(String goal, String experienceLevel) {
        if (matches(experienceLevel, "beginner", "novice")) {
            return 10;
        }

        if (matches(experienceLevel, "advanced", "expert")) {
            return isHypertrophyGoal(goal) ? 18 : 16;
        }

        return isHypertrophyGoal(goal) ? 16 : 14;
    }

    private int adjustForRecovery(int weeklySets, String recoveryQuality) {
        if (matches(recoveryQuality, "poor", "low")) {
            return weeklySets - 3;
        }

        if (matches(recoveryQuality, "good", "high")) {
            return weeklySets + 1;
        }

        return weeklySets;
    }

    private int adjustForFatigue(int weeklySets, String fatigueTolerance) {
        if (matches(fatigueTolerance, "low", "limited")) {
            return weeklySets - 2;
        }

        if (matches(fatigueTolerance, "high", "strong")) {
            return weeklySets + 1;
        }

        return weeklySets;
    }

    private int adjustForCaloriesAndGoal(int weeklySets, UserProfile profile, String goal) {
        if (isAggressiveDeficit(profile, goal)) {
            return Math.max(weeklySets - 2, 8);
        }

        if (isHypertrophyGoal(goal) && hasStrongCalorieSupport(profile)) {
            return weeklySets + 1;
        }

        return weeklySets;
    }

    private String buildWeeklyTrainingVolume(int weeklySets) {
        if (weeklySets <= 10) {
            return "Conservative weekly volume";
        }

        if (weeklySets <= 15) {
            return "Moderate weekly volume";
        }

        return "Higher weekly volume";
    }

    private String buildFrequencyEmphasis(String goal, String experienceLevel, int trainingDays) {
        if (matches(experienceLevel, "beginner", "novice")) {
            return "Train most major muscle groups 2 to 3 times per week with repeatable, easy-to-progress sessions.";
        }

        if (isHypertrophyGoal(goal) && trainingDays >= 5) {
            return "Aim to expose priority muscle groups about 2 times per week while spreading volume across enough sessions to keep quality high.";
        }

        return "Keep most major muscle groups around 2 weekly exposures so progress stays steady without cramming too much work into one day.";
    }

    private String buildSpecializationAdjustment(String weakArea, String experienceLevel) {
        if (weakArea.isEmpty()) {
            return "No specialization bump is necessary right now; keep volume distributed evenly across major muscle groups.";
        }

        if (matches(experienceLevel, "beginner", "novice")) {
            return "Because the user is still early in training, keep weak-area work modest and focus first on consistent full-program progression.";
        }

        return "Add roughly 2 focused sets per week for "
                + weakArea
                + " while keeping the rest of the plan recoverable.";
    }

    private String buildVolumeReason(
            String goal,
            String experienceLevel,
            String recoveryQuality,
            String fatigueTolerance,
            UserProfile profile,
            String weakArea
    ) {
        StringBuilder reason = new StringBuilder();

        if (matches(experienceLevel, "beginner", "novice")) {
            reason.append("Volume stays conservative because newer lifters usually grow well from simpler, lower-fatigue workloads. ");
        } else if (isHypertrophyGoal(goal)) {
            reason.append("Volume is set with hypertrophy in mind, using enough weekly work to create growth pressure without assuming unlimited recovery. ");
        } else {
            reason.append("Volume is kept balanced so performance and recovery can stay stable over the full week. ");
        }

        if (matches(recoveryQuality, "poor", "low")) {
            reason.append("Poorer recovery lowers recoverable volume. ");
        } else if (matches(recoveryQuality, "good", "high")) {
            reason.append("Better recovery allows a little more productive work. ");
        }

        if (matches(fatigueTolerance, "low", "limited")) {
            reason.append("Lower fatigue tolerance also supports a more restrained volume target. ");
        }

        if (isAggressiveDeficit(profile, goal)) {
            reason.append("Because the user appears to be cutting hard, excess volume is avoided to protect training quality. ");
        } else if (isHypertrophyGoal(goal) && hasStrongCalorieSupport(profile)) {
            reason.append("Calorie support appears strong enough to justify a slight volume increase. ");
        }

        if (!weakArea.isEmpty()) {
            reason.append("The plan leaves room for a small specialization emphasis on ")
                    .append(weakArea)
                    .append(".");
        }

        return reason.toString().trim();
    }

    private boolean isHypertrophyGoal(String goal) {
        return matches(goal, "hypertrophy", "bodybuilding") || goal.equalsIgnoreCase("Bulk");
    }

    private boolean hasStrongCalorieSupport(UserProfile profile) {
        return profile.getCurrentCalories() >= 2400
                || (profile.getCurrentCalories() <= 0 && !profile.isCalorieTracking());
    }

    private boolean isAggressiveDeficit(UserProfile profile, String goal) {
        return goal.equalsIgnoreCase("Cut")
                && profile.isCalorieTracking()
                && profile.getCurrentCalories() > 0
                && profile.getCurrentCalories() <= 1800;
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

    public static class VolumeRecommendation {

        private final String weeklyTrainingVolume;
        private final int estimatedWeeklySets;
        private final String muscleFrequencyEmphasis;
        private final String specializationAdjustment;
        private final String volumeReason;

        public VolumeRecommendation(
                String weeklyTrainingVolume,
                int estimatedWeeklySets,
                String muscleFrequencyEmphasis,
                String specializationAdjustment,
                String volumeReason
        ) {
            this.weeklyTrainingVolume = weeklyTrainingVolume;
            this.estimatedWeeklySets = estimatedWeeklySets;
            this.muscleFrequencyEmphasis = muscleFrequencyEmphasis;
            this.specializationAdjustment = specializationAdjustment;
            this.volumeReason = volumeReason;
        }

        public String getWeeklyTrainingVolume() {
            return weeklyTrainingVolume;
        }

        public int getEstimatedWeeklySets() {
            return estimatedWeeklySets;
        }

        public String getMuscleFrequencyEmphasis() {
            return muscleFrequencyEmphasis;
        }

        public String getSpecializationAdjustment() {
            return specializationAdjustment;
        }

        public String getVolumeReason() {
            return volumeReason;
        }
    }
}
