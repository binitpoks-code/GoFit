package com.gofit.backend.dto;

import com.gofit.backend.model.UserGoal;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class UserGoalDTO {

    private Long id;

    @NotBlank(message = "Goal type is required")
    private String goalType;

    private String focus;

    private boolean active = true;

    private LocalDateTime createdAt;

    public UserGoal toEntity() {
        UserGoal userGoal = new UserGoal();
        userGoal.setGoalType(goalType);
        userGoal.setFocus(focus);
        userGoal.setActive(active);
        return userGoal;
    }

    public static UserGoalDTO fromEntity(UserGoal userGoal) {
        UserGoalDTO dto = new UserGoalDTO();
        dto.id = userGoal.getId();
        dto.goalType = userGoal.getGoalType();
        dto.focus = userGoal.getFocus();
        dto.active = userGoal.isActive();
        dto.createdAt = userGoal.getCreatedAt();
        return dto;
    }

    public Long getId() {
        return id;
    }

    public String getGoalType() {
        return goalType;
    }

    public void setGoalType(String goalType) {
        this.goalType = goalType;
    }

    public String getFocus() {
        return focus;
    }

    public void setFocus(String focus) {
        this.focus = focus;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
