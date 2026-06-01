package com.gofit.backend.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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

    @JsonManagedReference
    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL)
    private List<ProgressEntry> progressEntries = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "user_account_id")
    private UserAccount userAccount;

    public UserProfile() {
    }

    public UserProfile(
            String name,
            int age,
            double height,
            double weight,
            double bodyFatPercentage,
            String goal,
            String weakArea,
            String experienceLevel,
            boolean calorieTracking,
            int currentCalories,
            String recoveryQuality,
            String fatigueTolerance,
            int trainingDaysAvailable
    ) {

        this.name = name;
        this.age = age;
        this.height = height;
        this.weight = weight;
        this.bodyFatPercentage = bodyFatPercentage;
        this.goal = goal;
        this.weakArea = weakArea;
        this.experienceLevel = experienceLevel;
        this.calorieTracking = calorieTracking;
        this.currentCalories = currentCalories;
        this.recoveryQuality = recoveryQuality;
        this.fatigueTolerance = fatigueTolerance;
        this.trainingDaysAvailable = trainingDaysAvailable;
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

    public void setCalorieTracking(boolean calorieTracking) {
        this.calorieTracking = calorieTracking;
    }

    public int getCurrentCalories() {
        return currentCalories;
    }

    public void setCurrentCalories(int currentCalories) {
        this.currentCalories = currentCalories;
    }

    public String getRecoveryQuality() {
        return recoveryQuality;
    }

    public void setRecoveryQuality(String recoveryQuality) {
        this.recoveryQuality = recoveryQuality;
    }

    public String getFatigueTolerance() {
        return fatigueTolerance;
    }

    public void setFatigueTolerance(String fatigueTolerance) {
        this.fatigueTolerance = fatigueTolerance;
    }

    public int getTrainingDaysAvailable() {
        return trainingDaysAvailable;
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

    public List<ProgressEntry> getProgressEntries() {
        return progressEntries;
    }

    public void setProgressEntries(List<ProgressEntry> progressEntries) {
        this.progressEntries = progressEntries;
    }

    public UserAccount getUserAccount() {
        return userAccount;
    }

    public void setUserAccount(UserAccount userAccount) {
        this.userAccount = userAccount;
    }
}
