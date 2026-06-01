package com.gofit.backend.service;

import com.gofit.backend.model.ProgressEntry;
import com.gofit.backend.model.UserProfile;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class ProgressAnalysisService {

    public String analyzeProgress(UserProfile profile) {
        List<ProgressEntry> recentEntries = getRecentEntries(profile);

        if (recentEntries.size() < 2) {
            return "More progress check-ins are needed before meaningful trend interpretation can begin.";
        }

        List<String> observations = new ArrayList<>();

        addBodyWeightObservation(recentEntries, observations);
        addRecoveryObservation(recentEntries, observations);
        addFatigueObservation(recentEntries, observations);
        addCalorieObservation(profile, recentEntries, observations);
        addPerformanceObservation(recentEntries, observations);

        if (observations.isEmpty()) {
            return "Recent progress entries look fairly stable, with no strong warning signs standing out yet.";
        }

        return String.join(" ", observations);
    }

    private List<ProgressEntry> getRecentEntries(UserProfile profile) {
        List<ProgressEntry> entries = new ArrayList<>(profile.getProgressEntries());

        entries.sort(Comparator.comparing(
                ProgressEntry::getDate,
                Comparator.nullsLast(Comparator.naturalOrder())
        ));

        if (entries.size() <= 5) {
            return entries;
        }

        return entries.subList(entries.size() - 5, entries.size());
    }

    private void addBodyWeightObservation(List<ProgressEntry> entries, List<String> observations) {
        double firstWeight = entries.get(0).getBodyWeight();
        double lastWeight = entries.get(entries.size() - 1).getBodyWeight();
        double change = Math.abs(lastWeight - firstWeight);

        if (change <= 0.5) {
            observations.add("Body weight appears relatively stagnant across recent check-ins.");
        }
    }

    private void addRecoveryObservation(List<ProgressEntry> entries, List<String> observations) {
        double firstSleep = entries.get(0).getSleepHours();
        double lastSleep = entries.get(entries.size() - 1).getSleepHours();

        if (lastSleep + 0.75 < firstSleep) {
            observations.add("Recent entries suggest recovery quality may be declining because sleep is trending downward.");
        }
    }

    private void addFatigueObservation(List<ProgressEntry> entries, List<String> observations) {
        int risingFatigueCount = 0;

        for (int index = 1; index < entries.size(); index++) {
            int previous = fatigueScore(entries.get(index - 1).getFatigueLevel());
            int current = fatigueScore(entries.get(index).getFatigueLevel());

            if (current > previous) {
                risingFatigueCount++;
            }
        }

        if (risingFatigueCount >= 2) {
            observations.add("Fatigue trends may indicate accumulated training stress across recent entries.");
        }
    }

    private void addCalorieObservation(
            UserProfile profile,
            List<ProgressEntry> entries,
            List<String> observations
    ) {
        double averageCalories = entries.stream()
                .mapToInt(ProgressEntry::getCalories)
                .filter(calories -> calories > 0)
                .average()
                .orElse(0);

        if (averageCalories == 0) {
            return;
        }

        if (safeText(profile.getGoal()).equalsIgnoreCase("Bulk")
                && averageCalories < profile.getCurrentCalories()) {
            observations.add("Calorie intake may be too inconsistent or too low to strongly support the current muscle-gain goal.");
        }

        if (hasWideCalorieSwing(entries)) {
            observations.add("Calorie intake appears inconsistent across recent check-ins, which can blur body-weight and performance trends.");
        }
    }

    private void addPerformanceObservation(List<ProgressEntry> entries, List<String> observations) {
        int stagnationSignals = 0;

        for (ProgressEntry entry : entries) {
            String performance = safeText(entry.getWorkoutPerformance()).toLowerCase();
            String notes = safeText(entry.getNotes()).toLowerCase();

            if (containsAny(performance, "stagnant", "plateau", "regressed", "worse")
                    || containsAny(notes, "stagnant", "plateau", "regressed", "worse")) {
                stagnationSignals++;
            }
        }

        if (stagnationSignals >= 2) {
            observations.add("Workout notes suggest possible stagnation or stalled progression that may deserve closer review.");
        }
    }

    private boolean hasWideCalorieSwing(List<ProgressEntry> entries) {
        int minimumCalories = Integer.MAX_VALUE;
        int maximumCalories = Integer.MIN_VALUE;

        for (ProgressEntry entry : entries) {
            int calories = entry.getCalories();

            if (calories <= 0) {
                continue;
            }

            minimumCalories = Math.min(minimumCalories, calories);
            maximumCalories = Math.max(maximumCalories, calories);
        }

        if (minimumCalories == Integer.MAX_VALUE || maximumCalories == Integer.MIN_VALUE) {
            return false;
        }

        return maximumCalories - minimumCalories >= 400;
    }

    private int fatigueScore(String fatigueLevel) {
        String value = safeText(fatigueLevel);

        if (value.equalsIgnoreCase("High") || value.equalsIgnoreCase("Severe")) {
            return 3;
        }

        if (value.equalsIgnoreCase("Moderate") || value.equalsIgnoreCase("Medium")) {
            return 2;
        }

        if (value.equalsIgnoreCase("Low") || value.equalsIgnoreCase("Light")) {
            return 1;
        }

        return 0;
    }

    private boolean containsAny(String value, String first, String second, String third, String fourth) {
        return value.contains(first)
                || value.contains(second)
                || value.contains(third)
                || value.contains(fourth);
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }
}
