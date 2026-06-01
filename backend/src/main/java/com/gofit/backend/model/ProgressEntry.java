package com.gofit.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
public class ProgressEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Positive(message = "Body weight must be positive")
    private double bodyWeight;

    @Min(value = 0, message = "Calories cannot be negative")
    private int calories;

    @Min(value = 0, message = "Sleep hours cannot be negative")
    @Max(value = 24, message = "Sleep hours must be realistic")
    private double sleepHours;

    @NotBlank(message = "Fatigue level is required")
    private String fatigueLevel;

    @NotBlank(message = "Workout performance is required")
    private String workoutPerformance;

    private String notes;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @Min(value = 0, message = "Recovery score cannot be negative")
    @Max(value = 100, message = "Recovery score cannot exceed 100")
    private int recoveryScore;

    private boolean workoutCompleted;

    @Min(value = 1, message = "Energy level must be at least 1")
    @Max(value = 10, message = "Energy level cannot exceed 10")
    private int energyLevel;

    private LocalDateTime createdAt;

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "user_profile_id")
    private UserProfile userProfile;

    @ManyToOne
    @JoinColumn(name = "user_account_id")
    private UserAccount userAccount;

    public ProgressEntry() {
    }

    public ProgressEntry(
            double bodyWeight,
            int calories,
            double sleepHours,
            String fatigueLevel,
            String workoutPerformance,
            String notes,
            LocalDate date,
            UserProfile userProfile
    ) {
        this.bodyWeight = bodyWeight;
        this.calories = calories;
        this.sleepHours = sleepHours;
        this.fatigueLevel = fatigueLevel;
        this.workoutPerformance = workoutPerformance;
        this.notes = notes;
        this.date = date;
        this.userProfile = userProfile;
    }

    @PrePersist
    public void setCreatedAtIfMissing() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public double getBodyWeight() {
        return bodyWeight;
    }

    public void setBodyWeight(double bodyWeight) {
        this.bodyWeight = bodyWeight;
    }

    public int getCalories() {
        return calories;
    }

    public void setCalories(int calories) {
        this.calories = calories;
    }

    public double getSleepHours() {
        return sleepHours;
    }

    public void setSleepHours(double sleepHours) {
        this.sleepHours = sleepHours;
    }

    public String getFatigueLevel() {
        return fatigueLevel;
    }

    public void setFatigueLevel(String fatigueLevel) {
        this.fatigueLevel = fatigueLevel;
    }

    public String getWorkoutPerformance() {
        return workoutPerformance;
    }

    public void setWorkoutPerformance(String workoutPerformance) {
        this.workoutPerformance = workoutPerformance;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public UserProfile getUserProfile() {
        return userProfile;
    }

    public void setUserProfile(UserProfile userProfile) {
        this.userProfile = userProfile;
    }

    public UserAccount getUserAccount() {
        return userAccount;
    }

    public void setUserAccount(UserAccount userAccount) {
        this.userAccount = userAccount;
    }

    public int getRecoveryScore() {
        return recoveryScore;
    }

    public void setRecoveryScore(int recoveryScore) {
        this.recoveryScore = recoveryScore;
    }

    public boolean isWorkoutCompleted() {
        return workoutCompleted;
    }

    public void setWorkoutCompleted(boolean workoutCompleted) {
        this.workoutCompleted = workoutCompleted;
    }

    public int getEnergyLevel() {
        return energyLevel;
    }

    public void setEnergyLevel(int energyLevel) {
        this.energyLevel = energyLevel;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
