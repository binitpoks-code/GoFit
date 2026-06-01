package com.gofit.backend.service;

import com.gofit.backend.model.WorkoutPlan;
import com.gofit.backend.repository.WorkoutPlanRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkoutService {

    private final WorkoutPlanRepository workoutPlanRepository;

    public WorkoutService(WorkoutPlanRepository workoutPlanRepository) {
        this.workoutPlanRepository = workoutPlanRepository;
    }

    public WorkoutPlan saveWorkoutPlan(WorkoutPlan workoutPlan) {
        if (workoutPlan.getExercises() != null) {
            workoutPlan.getExercises().forEach(exercise -> exercise.setWorkoutPlan(workoutPlan));
        }

        return workoutPlanRepository.save(workoutPlan);
    }

    public List<WorkoutPlan> getAllWorkoutPlans() {
        return workoutPlanRepository.findAll();
    }
}
