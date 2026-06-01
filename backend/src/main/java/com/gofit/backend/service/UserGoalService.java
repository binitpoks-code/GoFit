package com.gofit.backend.service;

import com.gofit.backend.model.UserAccount;
import com.gofit.backend.model.UserGoal;
import com.gofit.backend.repository.UserAccountRepository;
import com.gofit.backend.repository.UserGoalRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserGoalService {

    private final UserGoalRepository userGoalRepository;
    private final UserAccountRepository userAccountRepository;

    public UserGoalService(UserGoalRepository userGoalRepository, UserAccountRepository userAccountRepository) {
        this.userGoalRepository = userGoalRepository;
        this.userAccountRepository = userAccountRepository;
    }

    public UserGoal saveGoalForUser(UserGoal userGoal, String email) {
        UserAccount userAccount = userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user account was not found."));

        if (userGoal.isActive()) {
            List<UserGoal> activeGoals = userGoalRepository.findByUserAccountEmailAndActiveTrue(email);
            activeGoals.forEach(activeGoal -> activeGoal.setActive(false));
            userGoalRepository.saveAll(activeGoals);
        }

        userGoal.setUserAccount(userAccount);
        return userGoalRepository.save(userGoal);
    }

    public List<UserGoal> getGoalsForUser(String email) {
        return userGoalRepository.findByUserAccountEmailOrderByCreatedAtDesc(email);
    }
}
