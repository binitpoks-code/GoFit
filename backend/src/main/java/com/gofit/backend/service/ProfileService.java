package com.gofit.backend.service;

import com.gofit.backend.model.UserProfile;
import com.gofit.backend.model.UserAccount;
import com.gofit.backend.repository.UserAccountRepository;
import com.gofit.backend.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserAccountRepository userAccountRepository;

    public ProfileService(
            UserProfileRepository userProfileRepository,
            UserAccountRepository userAccountRepository
    ) {
        this.userProfileRepository = userProfileRepository;
        this.userAccountRepository = userAccountRepository;
    }

    public UserProfile saveProfile(UserProfile userProfile) {
        return userProfileRepository.save(userProfile);
    }

    public UserProfile saveProfileForUser(UserProfile userProfile, String email) {
        UserAccount userAccount = userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user account was not found."));

        userProfile.setUserAccount(userAccount);
        return userProfileRepository.save(userProfile);
    }

    public List<UserProfile> getAllProfiles() {
        return userProfileRepository.findAll();
    }

    public List<UserProfile> getProfilesForUser(String email) {
        return userProfileRepository.findByUserAccountEmail(email);
    }
}
