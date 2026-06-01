package com.gofit.backend.controller;

import com.gofit.backend.dto.UserGoalDTO;
import com.gofit.backend.service.UserGoalService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class UserGoalController {

    private final UserGoalService userGoalService;

    public UserGoalController(UserGoalService userGoalService) {
        this.userGoalService = userGoalService;
    }

    @GetMapping
    public List<UserGoalDTO> getGoals(Authentication authentication) {
        return userGoalService.getGoalsForUser(authentication.getName())
                .stream()
                .map(UserGoalDTO::fromEntity)
                .toList();
    }

    @PostMapping
    public UserGoalDTO createGoal(@Valid @RequestBody UserGoalDTO userGoalDTO, Authentication authentication) {
        return UserGoalDTO.fromEntity(
                userGoalService.saveGoalForUser(userGoalDTO.toEntity(), authentication.getName())
        );
    }
}
