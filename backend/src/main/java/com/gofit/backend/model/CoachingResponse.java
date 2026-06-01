package com.gofit.backend.model;

public class CoachingResponse {

    private String splitRecommendation;
    private String splitReason;
    private String calorieFeedback;
    private String recoveryFeedback;
    private String fatigueFeedback;
    private String weeklyTrainingVolume;
    private int estimatedWeeklySets;
    private String muscleFrequencyEmphasis;
    private String specializationAdjustment;
    private String volumeReason;
    private String progressAnalysis;
    private String plateauDetection;
    private String adaptiveAdjustment;
    private String workloadStatus;
    private String workloadObservation;
    private int recoveryScore;
    private String recoveryScoreFeedback;
    private String trainingReadinessLevel;
    private String trainingReadinessFeedback;
    private String deloadRecommendation;
    private int consistencyScore;
    private String consistencyFeedback;
    private String progressionState;
    private String progressionStrategy;
    private String coachingMemory;
    private int estimatedMaintenanceCalories;
    private int cuttingCalories;
    private int bulkingCalories;
    private int maintenanceCaloriesLow;
    private int maintenanceCaloriesHigh;
    private String deficitSeverity;
    private String surplusSustainability;
    private String calorieStrategy;
    private String additionalAdvice;
    private int trainingFrequency;
    private int recommendedCalories;

    public CoachingResponse(
            String splitRecommendation,
            String splitReason,
            String calorieFeedback,
            String recoveryFeedback,
            String fatigueFeedback,
            String weeklyTrainingVolume,
            int trainingFrequency,
            int recommendedCalories
    ) {
        this.splitRecommendation = splitRecommendation;
        this.splitReason = splitReason;
        this.calorieFeedback = calorieFeedback;
        this.recoveryFeedback = recoveryFeedback;
        this.fatigueFeedback = fatigueFeedback;
        this.weeklyTrainingVolume = weeklyTrainingVolume;
        this.trainingFrequency = trainingFrequency;
        this.recommendedCalories = recommendedCalories;
    }

    public CoachingResponse(
            String splitRecommendation,
            String splitReason,
            String calorieFeedback,
            String recoveryFeedback,
            String fatigueFeedback,
            String weeklyTrainingVolume,
            int estimatedWeeklySets,
            String muscleFrequencyEmphasis,
            String specializationAdjustment,
            String volumeReason,
            String progressAnalysis,
            String plateauDetection,
            String adaptiveAdjustment,
            String workloadStatus,
            String workloadObservation,
            int recoveryScore,
            String recoveryScoreFeedback,
            String trainingReadinessLevel,
            String trainingReadinessFeedback,
            String deloadRecommendation,
            int consistencyScore,
            String consistencyFeedback,
            String progressionState,
            String progressionStrategy,
            String coachingMemory,
            int estimatedMaintenanceCalories,
            int cuttingCalories,
            int bulkingCalories,
            int maintenanceCaloriesLow,
            int maintenanceCaloriesHigh,
            String deficitSeverity,
            String surplusSustainability,
            String calorieStrategy,
            String additionalAdvice,
            int trainingFrequency,
            int recommendedCalories
    ) {
        this.splitRecommendation = splitRecommendation;
        this.splitReason = splitReason;
        this.calorieFeedback = calorieFeedback;
        this.recoveryFeedback = recoveryFeedback;
        this.fatigueFeedback = fatigueFeedback;
        this.weeklyTrainingVolume = weeklyTrainingVolume;
        this.estimatedWeeklySets = estimatedWeeklySets;
        this.muscleFrequencyEmphasis = muscleFrequencyEmphasis;
        this.specializationAdjustment = specializationAdjustment;
        this.volumeReason = volumeReason;
        this.progressAnalysis = progressAnalysis;
        this.plateauDetection = plateauDetection;
        this.adaptiveAdjustment = adaptiveAdjustment;
        this.workloadStatus = workloadStatus;
        this.workloadObservation = workloadObservation;
        this.recoveryScore = recoveryScore;
        this.recoveryScoreFeedback = recoveryScoreFeedback;
        this.trainingReadinessLevel = trainingReadinessLevel;
        this.trainingReadinessFeedback = trainingReadinessFeedback;
        this.deloadRecommendation = deloadRecommendation;
        this.consistencyScore = consistencyScore;
        this.consistencyFeedback = consistencyFeedback;
        this.progressionState = progressionState;
        this.progressionStrategy = progressionStrategy;
        this.coachingMemory = coachingMemory;
        this.estimatedMaintenanceCalories = estimatedMaintenanceCalories;
        this.cuttingCalories = cuttingCalories;
        this.bulkingCalories = bulkingCalories;
        this.maintenanceCaloriesLow = maintenanceCaloriesLow;
        this.maintenanceCaloriesHigh = maintenanceCaloriesHigh;
        this.deficitSeverity = deficitSeverity;
        this.surplusSustainability = surplusSustainability;
        this.calorieStrategy = calorieStrategy;
        this.additionalAdvice = additionalAdvice;
        this.trainingFrequency = trainingFrequency;
        this.recommendedCalories = recommendedCalories;
    }

    public String getSplitRecommendation() {
        return splitRecommendation;
    }

    public String getSplitReason() {
        return splitReason;
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

    public String getProgressAnalysis() {
        return progressAnalysis;
    }

    public String getPlateauDetection() {
        return plateauDetection;
    }

    public String getAdaptiveAdjustment() {
        return adaptiveAdjustment;
    }

    public String getWorkloadStatus() {
        return workloadStatus;
    }

    public String getWorkloadObservation() {
        return workloadObservation;
    }

    public int getRecoveryScore() {
        return recoveryScore;
    }

    public String getRecoveryScoreFeedback() {
        return recoveryScoreFeedback;
    }

    public String getTrainingReadinessLevel() {
        return trainingReadinessLevel;
    }

    public String getTrainingReadinessFeedback() {
        return trainingReadinessFeedback;
    }

    public String getDeloadRecommendation() {
        return deloadRecommendation;
    }

    public int getConsistencyScore() {
        return consistencyScore;
    }

    public String getConsistencyFeedback() {
        return consistencyFeedback;
    }

    public String getProgressionState() {
        return progressionState;
    }

    public String getProgressionStrategy() {
        return progressionStrategy;
    }

    public String getCoachingMemory() {
        return coachingMemory;
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
