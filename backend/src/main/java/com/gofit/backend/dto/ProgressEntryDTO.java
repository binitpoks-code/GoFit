package com.gofit.backend.dto;

import com.gofit.backend.model.ProgressEntry;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ProgressEntryDTO {

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
    private Integer recoveryScore;

    private Boolean workoutCompleted;

    @Min(value = 1, message = "Energy level must be at least 1")
    @Max(value = 10, message = "Energy level cannot exceed 10")
    private Integer energyLevel;

    private String optionalNotes;

    private LocalDateTime createdAt;

    @Positive(message = "User profile id must be positive")
    private Long userProfileId;

    public ProgressEntry toEntity() {
        ProgressEntry progressEntry = new ProgressEntry(
                bodyWeight,
                calories,
                sleepHours,
                fatigueLevel,
                workoutPerformance,
                notes,
                date,
                null
        );

        progressEntry.setRecoveryScore(resolveRecoveryScore());
        progressEntry.setWorkoutCompleted(resolveWorkoutCompleted());
        progressEntry.setEnergyLevel(resolveEnergyLevel());

        if (optionalNotes != null && !optionalNotes.isBlank()) {
            progressEntry.setNotes(optionalNotes);
        }

        return progressEntry;
    }

    public static ProgressEntryDTO fromEntity(ProgressEntry progressEntry) {
        ProgressEntryDTO dto = new ProgressEntryDTO();
        dto.id = progressEntry.getId();
        dto.bodyWeight = progressEntry.getBodyWeight();
        dto.calories = progressEntry.getCalories();
        dto.sleepHours = progressEntry.getSleepHours();
        dto.fatigueLevel = progressEntry.getFatigueLevel();
        dto.workoutPerformance = progressEntry.getWorkoutPerformance();
        dto.notes = progressEntry.getNotes();
        dto.optionalNotes = progressEntry.getNotes();
        dto.date = progressEntry.getDate();
        dto.recoveryScore = progressEntry.getRecoveryScore();
        dto.workoutCompleted = progressEntry.isWorkoutCompleted();
        dto.energyLevel = progressEntry.getEnergyLevel();
        dto.createdAt = progressEntry.getCreatedAt();

        if (progressEntry.getUserProfile() != null) {
            dto.userProfileId = progressEntry.getUserProfile().getId();
        }

        return dto;
    }

    public Long getId() {
        return id;
    }

    public double getBodyWeight() {
        return bodyWeight;
    }

    public int getCalories() {
        return calories;
    }

    public double getSleepHours() {
        return sleepHours;
    }

    public String getFatigueLevel() {
        return fatigueLevel;
    }

    public String getWorkoutPerformance() {
        return workoutPerformance;
    }

    public String getNotes() {
        return notes;
    }

    public LocalDate getDate() {
        return date;
    }

    public Long getUserProfileId() {
        return userProfileId;
    }

    public Integer getRecoveryScore() {
        return recoveryScore;
    }

    public Boolean getWorkoutCompleted() {
        return workoutCompleted;
    }

    public Integer getEnergyLevel() {
        return energyLevel;
    }

    public String getOptionalNotes() {
        return optionalNotes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setBodyWeight(double bodyWeight) {
        this.bodyWeight = bodyWeight;
    }

    public void setCalories(int calories) {
        this.calories = calories;
    }

    public void setSleepHours(double sleepHours) {
        this.sleepHours = sleepHours;
    }

    public void setFatigueLevel(String fatigueLevel) {
        this.fatigueLevel = fatigueLevel;
    }

    public void setWorkoutPerformance(String workoutPerformance) {
        this.workoutPerformance = workoutPerformance;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public void setUserProfileId(Long userProfileId) {
        this.userProfileId = userProfileId;
    }

    public void setRecoveryScore(Integer recoveryScore) {
        this.recoveryScore = recoveryScore;
    }

    public void setWorkoutCompleted(Boolean workoutCompleted) {
        this.workoutCompleted = workoutCompleted;
    }

    public void setEnergyLevel(Integer energyLevel) {
        this.energyLevel = energyLevel;
    }

    public void setOptionalNotes(String optionalNotes) {
        this.optionalNotes = optionalNotes;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    private int resolveRecoveryScore() {
        if (recoveryScore != null) {
            return recoveryScore;
        }

        return (int) Math.round(Math.max(0, Math.min(100, sleepHours * 12)));
    }

    private boolean resolveWorkoutCompleted() {
        if (workoutCompleted != null) {
            return workoutCompleted;
        }

        return workoutPerformance == null
                || !workoutPerformance.equalsIgnoreCase("Workout not completed");
    }

    private int resolveEnergyLevel() {
        return energyLevel == null ? 7 : energyLevel;
    }
}
