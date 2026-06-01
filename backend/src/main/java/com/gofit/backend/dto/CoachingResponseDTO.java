package com.gofit.backend.dto;

import com.gofit.backend.model.CoachingResponse;

public class CoachingResponseDTO {

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

    public static CoachingResponseDTO fromResponse(CoachingResponse response) {
        CoachingResponseDTO dto = new CoachingResponseDTO();
        dto.splitRecommendation = response.getSplitRecommendation();
        dto.splitReason = response.getSplitReason();
        dto.calorieFeedback = response.getCalorieFeedback();
        dto.recoveryFeedback = response.getRecoveryFeedback();
        dto.fatigueFeedback = response.getFatigueFeedback();
        dto.weeklyTrainingVolume = response.getWeeklyTrainingVolume();
        dto.estimatedWeeklySets = response.getEstimatedWeeklySets();
        dto.muscleFrequencyEmphasis = response.getMuscleFrequencyEmphasis();
        dto.specializationAdjustment = response.getSpecializationAdjustment();
        dto.volumeReason = response.getVolumeReason();
        dto.progressAnalysis = response.getProgressAnalysis();
        dto.plateauDetection = response.getPlateauDetection();
        dto.adaptiveAdjustment = response.getAdaptiveAdjustment();
        dto.workloadStatus = response.getWorkloadStatus();
        dto.workloadObservation = response.getWorkloadObservation();
        dto.recoveryScore = response.getRecoveryScore();
        dto.recoveryScoreFeedback = response.getRecoveryScoreFeedback();
        dto.trainingReadinessLevel = response.getTrainingReadinessLevel();
        dto.trainingReadinessFeedback = response.getTrainingReadinessFeedback();
        dto.deloadRecommendation = response.getDeloadRecommendation();
        dto.consistencyScore = response.getConsistencyScore();
        dto.consistencyFeedback = response.getConsistencyFeedback();
        dto.progressionState = response.getProgressionState();
        dto.progressionStrategy = response.getProgressionStrategy();
        dto.coachingMemory = response.getCoachingMemory();
        dto.estimatedMaintenanceCalories = response.getEstimatedMaintenanceCalories();
        dto.cuttingCalories = response.getCuttingCalories();
        dto.bulkingCalories = response.getBulkingCalories();
        dto.maintenanceCaloriesLow = response.getMaintenanceCaloriesLow();
        dto.maintenanceCaloriesHigh = response.getMaintenanceCaloriesHigh();
        dto.deficitSeverity = response.getDeficitSeverity();
        dto.surplusSustainability = response.getSurplusSustainability();
        dto.calorieStrategy = response.getCalorieStrategy();
        dto.additionalAdvice = response.getAdditionalAdvice();
        dto.trainingFrequency = response.getTrainingFrequency();
        dto.recommendedCalories = response.getRecommendedCalories();
        return dto;
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
