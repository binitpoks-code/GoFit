package com.gofit.backend.controller;

import com.gofit.backend.dto.CoachingResponseDTO;
import com.gofit.backend.dto.UserProfileDTO;
import com.gofit.backend.model.UserProfile;
import com.gofit.backend.service.CoachingService;
import com.gofit.backend.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ProfileController {

    private final CoachingService coachingService;
    private final ProfileService profileService;

    public ProfileController(CoachingService coachingService, ProfileService profileService) {
        this.coachingService = coachingService;
        this.profileService = profileService;
    }

    @PostMapping("/profile")
    public CoachingResponseDTO createProfile(
            @Valid @RequestBody UserProfileDTO userProfileDTO,
            Authentication authentication
    ) {
        UserProfile savedProfile = profileService.saveProfileForUser(
                userProfileDTO.toEntity(),
                authentication.getName()
        );

        return CoachingResponseDTO.fromResponse(coachingService.generateRecommendation(savedProfile));
    }

    @GetMapping("/profiles")
    public List<UserProfileDTO> getAllProfiles(Authentication authentication) {

        return profileService.getProfilesForUser(authentication.getName())
                .stream()
                .map(UserProfileDTO::fromEntity)
                .toList();
    }
}
