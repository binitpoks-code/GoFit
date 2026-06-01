package com.gofit.backend.repository;

import com.gofit.backend.model.UserGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserGoalRepository extends JpaRepository<UserGoal, Long> {

    List<UserGoal> findByUserAccountEmailOrderByCreatedAtDesc(String email);

    List<UserGoal> findByUserAccountEmailAndActiveTrue(String email);
}
