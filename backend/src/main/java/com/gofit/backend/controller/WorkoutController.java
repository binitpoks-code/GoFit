package com.gofit.backend.controller;

import com.gofit.backend.model.WorkoutPlan;
import com.gofit.backend.service.WorkoutService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workouts")
public class WorkoutController {

    private final WorkoutService workoutService;

    public WorkoutController(WorkoutService workoutService) {
        this.workoutService = workoutService;
    }

    @PostMapping
    public WorkoutPlan createWorkoutPlan(@RequestBody WorkoutPlan workoutPlan) {
        return workoutService.saveWorkoutPlan(workoutPlan);
    }

    @GetMapping
    public List<WorkoutPlan> getAllWorkoutPlans() {
        return workoutService.getAllWorkoutPlans();
    }
}
