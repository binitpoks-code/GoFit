package com.gofit.backend.dto;

import com.gofit.backend.model.UserProfile;
import jakarta.validation.constraints.*;

public class UserProfileDTO {

    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @Min(value = 13, message = "Age must be at least 13")
    @Max(value = 100, message = "Age must be realistic")
    private int age;

    @Positive(message = "Height must be positive")
    private double height;

    @Positive(message = "Weight must be positive")
    // weight stored as received from frontend (frontend converts to kg before sending)
    private double weight;

    @Min(value = 0, message = "Body fat percentage cannot be negative")
    @Max(value = 70, message = "Body fat percentage must be realistic")
    private double bodyFatPercentage;

    @NotBlank(message = "Goal is required")
    private String goal;

    private String weakArea;

    @NotBlank(message = "Experience level is required")
    private String experienceLevel;

    private boolean calorieTracking;

    @Min(value = 0, message = "Current calories cannot be negative")
    private int currentCalories;

    @NotBlank(message = "Recovery quality is required")
    private String recoveryQuality;

    @NotBlank(message = "Fatigue tolerance is required")
    private String fatigueTolerance;

    @Min(value = 1, message = "Training days must be at least 1")
    @Max(value = 7, message = "Training days must be between 1 and 7")
    private int trainingDaysAvailable;

    private String gender;

    private String activityLevel;

    private Double weeklyWeightTarget;

    public UserProfile toEntity() {
        UserProfile entity = new UserProfile(
                name,
                age,
                height,
                weight,
                bodyFatPercentage,
                goal,
                weakArea,
                experienceLevel,
                calorieTracking,
                currentCalories,
                recoveryQuality,
                fatigueTolerance,
                trainingDaysAvailable
        );
        entity.setGender(gender);
        entity.setActivityLevel(activityLevel);
        entity.setWeeklyWeightTarget(weeklyWeightTarget);
        return entity;
    }

    public static UserProfileDTO fromEntity(UserProfile userProfile) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.id = userProfile.getId();
        dto.name = userProfile.getName();
        dto.age = userProfile.getAge();
        dto.height = userProfile.getHeight();
        dto.weight = userProfile.getWeight();
        dto.bodyFatPercentage = userProfile.getBodyFatPercentage();
        dto.goal = userProfile.getGoal();
        dto.weakArea = userProfile.getWeakArea();
        dto.experienceLevel = userProfile.getExperienceLevel();
        dto.calorieTracking = userProfile.isCalorieTracking();
        dto.currentCalories = userProfile.getCurrentCalories();
        dto.recoveryQuality = userProfile.getRecoveryQuality();
        dto.fatigueTolerance = userProfile.getFatigueTolerance();
        dto.trainingDaysAvailable = userProfile.getTrainingDaysAvailable();
        dto.gender = userProfile.getGender();
        dto.activityLevel = userProfile.getActivityLevel();
        dto.weeklyWeightTarget = userProfile.getWeeklyWeightTarget();
        return dto;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    public double getHeight() {
        return height;
    }

    public double getWeight() {
        return weight;
    }

    public double getBodyFatPercentage() {
        return bodyFatPercentage;
    }

    public String getGoal() {
        return goal;
    }

    public String getWeakArea() {
        return weakArea;
    }

    public String getExperienceLevel() {
        return experienceLevel;
    }

    public boolean isCalorieTracking() {
        return calorieTracking;
    }

    public int getCurrentCalories() {
        return currentCalories;
    }

    public String getRecoveryQuality() {
        return recoveryQuality;
    }

    public String getFatigueTolerance() {
        return fatigueTolerance;
    }

    public int getTrainingDaysAvailable() {
        return trainingDaysAvailable;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public void setHeight(double height) {
        this.height = height;
    }

    public void setWeight(double weight) {
        this.weight = weight;
    }

    public void setBodyFatPercentage(double bodyFatPercentage) {
        this.bodyFatPercentage = bodyFatPercentage;
    }

    public void setGoal(String goal) {
        this.goal = goal;
    }

    public void setWeakArea(String weakArea) {
        this.weakArea = weakArea;
    }

    public void setExperienceLevel(String experienceLevel) {
        this.experienceLevel = experienceLevel;
    }

    public void setCalorieTracking(boolean calorieTracking) {
        this.calorieTracking = calorieTracking;
    }

    public void setCurrentCalories(int currentCalories) {
        this.currentCalories = currentCalories;
    }

    public void setRecoveryQuality(String recoveryQuality) {
        this.recoveryQuality = recoveryQuality;
    }

    public void setFatigueTolerance(String fatigueTolerance) {
        this.fatigueTolerance = fatigueTolerance;
    }

    public void setTrainingDaysAvailable(int trainingDaysAvailable) {
        this.trainingDaysAvailable = trainingDaysAvailable;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getActivityLevel() {
        return activityLevel;
    }

    public void setActivityLevel(String activityLevel) {
        this.activityLevel = activityLevel;
    }

    public Double getWeeklyWeightTarget() {
        return weeklyWeightTarget;
    }

    public void setWeeklyWeightTarget(Double weeklyWeightTarget) {
        this.weeklyWeightTarget = weeklyWeightTarget;
    }
}
