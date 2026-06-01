package com.gofit.backend.controller;

import com.gofit.backend.dto.CoachingResponseDTO;
import com.gofit.backend.model.CoachingResponse;
import com.gofit.backend.model.ProgressEntry;
import com.gofit.backend.model.UserProfile;
import com.gofit.backend.service.CoachingService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/testing")
public class TestingController {

    private final CoachingService coachingService;

    public TestingController(CoachingService coachingService) {
        this.coachingService = coachingService;
    }

    @GetMapping
    public List<String> getTestingScenarios() {
        return List.of(
                "/api/testing/beginner-cutting",
                "/api/testing/advanced-hypertrophy",
                "/api/testing/plateau-fatigue",
                "/api/testing/recovery-focused",
                "/api/testing/high-consistency-progression",
                "/api/testing/low-recovery-overreaching"
        );
    }

    @GetMapping("/beginner-cutting")
    public CoachingResponseDTO testBeginnerCuttingProfile() {
        UserProfile profile = new UserProfile(
                "Beginner Cutting Test",
                27,
                175,
                86,
                24,
                "Cut",
                "",
                "Beginner",
                true,
                1900,
                "Average",
                "Moderate",
                3
        );

        addProgressEntries(profile, List.of(
                entry(86.8, 2050, 7.2, "Low", "Learning movements well", "Energy is decent", 21),
                entry(86.2, 1950, 7.0, "Moderate", "Strength mostly stable", "Hunger is manageable", 14),
                entry(85.7, 1900, 6.8, "Moderate", "Some reps feel harder", "Still consistent", 7),
                entry(85.1, 1900, 6.7, "Moderate", "Performance holding", "Cut feels sustainable", 0)
        ));

        return coachingResponse(profile);
    }

    @GetMapping("/advanced-hypertrophy")
    public CoachingResponseDTO testAdvancedHypertrophyProfile() {
        UserProfile profile = new UserProfile(
                "Advanced Hypertrophy Test",
                32,
                180,
                88,
                13,
                "Hypertrophy",
                "Chest",
                "Advanced",
                true,
                3200,
                "Good",
                "High",
                6
        );

        addProgressEntries(profile, List.of(
                entry(87.2, 3150, 7.8, "Low", "Added reps on compounds", "Strong sessions", 28),
                entry(87.5, 3200, 8.0, "Low", "Progressing accessories", "Recovery feels good", 21),
                entry(87.8, 3250, 7.7, "Moderate", "Volume is productive", "Chest focus feels useful", 14),
                entry(88.1, 3200, 7.9, "Moderate", "Still adding load slowly", "Good pumps and energy", 7),
                entry(88.4, 3250, 8.1, "Low", "Progression steady", "No recovery issues", 0)
        ));

        return coachingResponse(profile);
    }

    @GetMapping("/plateau-fatigue")
    public CoachingResponseDTO testPlateauFatigueProfile() {
        UserProfile profile = new UserProfile(
                "Plateau Fatigue Test",
                35,
                178,
                82,
                16,
                "Bulk",
                "Back",
                "Intermediate",
                true,
                2800,
                "Average",
                "Moderate",
                5
        );

        addProgressEntries(profile, List.of(
                entry(82.1, 2800, 7.1, "Low", "Squat moved well", "Normal week", 35),
                entry(82.2, 2500, 6.8, "Moderate", "Bench felt stagnant", "Missed some meals", 28),
                entry(82.0, 3000, 6.4, "Moderate", "Deadlift stalled", "Fatigue building", 21),
                entry(82.3, 2450, 6.1, "High", "Plateau on presses", "Sleep getting worse", 14),
                entry(82.2, 2900, 5.8, "High", "Regressed on accessories", "Feeling run down", 7),
                entry(82.1, 2550, 5.6, "High", "Stalled again", "Need a reset", 0)
        ));

        return coachingResponse(profile);
    }

    @GetMapping("/recovery-focused")
    public CoachingResponseDTO testRecoveryFocusedProfile() {
        UserProfile profile = new UserProfile(
                "Recovery Focused Test",
                41,
                170,
                76,
                20,
                "Maintenance",
                "",
                "Intermediate",
                true,
                2400,
                "Poor",
                "Low",
                4
        );

        addProgressEntries(profile, List.of(
                entry(76.2, 2400, 6.4, "Moderate", "Performance okay", "Work stress high", 21),
                entry(76.1, 2350, 5.9, "High", "Sessions feel heavy", "Poor sleep", 14),
                entry(76.0, 2450, 5.6, "High", "Reduced effort needed", "Soreness lingering", 7),
                entry(76.1, 2400, 5.4, "High", "No major progression", "Recovery is the priority", 0)
        ));

        return coachingResponse(profile);
    }

    @GetMapping("/high-consistency-progression")
    public CoachingResponseDTO testHighConsistencyProgressionProfile() {
        UserProfile profile = new UserProfile(
                "High Consistency Progression Test",
                29,
                172,
                72,
                15,
                "Bulk",
                "Shoulders",
                "Intermediate",
                true,
                2750,
                "Good",
                "High",
                4
        );

        addProgressEntries(profile, List.of(
                entry(71.4, 2725, 7.6, "Low", "Added reps", "Good routine", 35),
                entry(71.7, 2750, 7.7, "Low", "Added load", "Sleep consistent", 28),
                entry(71.9, 2760, 7.8, "Low", "Performance improved", "Meals consistent", 21),
                entry(72.1, 2740, 7.8, "Low", "Progressing steadily", "Recovery feels strong", 14),
                entry(72.3, 2765, 7.9, "Low", "More reps again", "Shoulder work tolerated", 7),
                entry(72.5, 2755, 8.0, "Low", "Strong sessions", "Ready to progress", 0)
        ));

        return coachingResponse(profile);
    }

    @GetMapping("/low-recovery-overreaching")
    public CoachingResponseDTO testLowRecoveryOverreachingProfile() {
        UserProfile profile = new UserProfile(
                "Low Recovery Overreaching Test",
                30,
                183,
                91,
                18,
                "Hypertrophy",
                "Legs",
                "Advanced",
                true,
                2300,
                "Poor",
                "Low",
                6
        );

        addProgressEntries(profile, List.of(
                entry(91.0, 2600, 6.2, "Moderate", "Legs felt heavy", "Volume is high", 35),
                entry(90.8, 2300, 5.9, "High", "Squat stagnant", "Hard to recover", 28),
                entry(90.7, 2200, 5.5, "High", "Performance worse", "Constant soreness", 21),
                entry(90.6, 2400, 5.2, "Severe", "Regressed on leg press", "Sleep poor", 14),
                entry(90.5, 2250, 5.0, "Severe", "Plateau and fatigue", "Need lower stress", 7),
                entry(90.4, 2300, 4.8, "Severe", "Worse again", "Overreached", 0)
        ));

        return coachingResponse(profile);
    }

    private CoachingResponseDTO coachingResponse(UserProfile profile) {
        CoachingResponse response = coachingService.generateRecommendation(profile);
        return CoachingResponseDTO.fromResponse(response);
    }

    private void addProgressEntries(UserProfile profile, List<ProgressEntry> entries) {
        entries.forEach(entry -> entry.setUserProfile(profile));
        profile.setProgressEntries(entries);
    }

    private ProgressEntry entry(
            double bodyWeight,
            int calories,
            double sleepHours,
            String fatigueLevel,
            String workoutPerformance,
            String notes,
            int daysAgo
    ) {
        return new ProgressEntry(
                bodyWeight,
                calories,
                sleepHours,
                fatigueLevel,
                workoutPerformance,
                notes,
                LocalDate.now().minusDays(daysAgo),
                null
        );
    }
}
