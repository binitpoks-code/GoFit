package com.gofit.backend.service;

import com.gofit.backend.model.ProgressEntry;
import com.gofit.backend.model.UserProfile;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class PlateauDetectionService {

    public String detectPlateau(UserProfile profile) {
        List<ProgressEntry> recentEntries = getRecentEntries(profile);

        if (recentEntries.size() < 3) {
            return "More progress entries are needed before plateau risk can be interpreted with confidence.";
        }

        boolean stagnantWeight = hasStagnantBodyWeight(recentEntries);
        boolean stagnantPerformance = hasRepeatedStagnationSignals(recentEntries);
        boolean risingFatigue = hasRisingFatigue(recentEntries);
        boolean decliningRecovery = hasDecliningSleep(recentEntries);
        boolean inconsistentCalories = hasWideCalorieSwing(recentEntries);
        boolean lowBulkCalories = hasLowBulkCalorieSupport(profile, recentEntries);

        List<String> plateauSignals = new ArrayList<>();

        if (stagnantWeight && stagnantPerformance) {
            plateauSignals.add("Recent progress patterns may suggest a true progression stall because body weight and workout notes both appear relatively stagnant.");
        }

        if (stagnantPerformance && risingFatigue) {
            plateauSignals.add("Performance appears relatively stagnant while fatigue trends are increasing, which may point toward accumulated training stress.");
        }

        if (decliningRecovery && risingFatigue) {
            plateauSignals.add("Recovery indicators suggest accumulated training stress may be limiting performance.");
        }

        if (stagnantWeight && lowBulkCalories) {
            plateauSignals.add("Current calorie support may be insufficient for the muscle-gain goal, especially with body weight staying flat.");
        }

        if (inconsistentCalories && stagnantPerformance) {
            plateauSignals.add("Current calorie consistency may not sufficiently support progression because performance signals are already looking flat.");
        }

        if (plateauSignals.isEmpty()) {
            return "No strong multi-signal plateau pattern stands out yet. Continue collecting entries and watch whether performance, recovery, and body-weight trends begin to line up.";
        }

        return String.join(" ", plateauSignals);
    }

    private List<ProgressEntry> getRecentEntries(UserProfile profile) {
        List<ProgressEntry> entries = new ArrayList<>(profile.getProgressEntries());

        entries.sort(Comparator.comparing(
                ProgressEntry::getDate,
                Comparator.nullsLast(Comparator.naturalOrder())
        ));

        if (entries.size() <= 6) {
            return entries;
        }

        return entries.subList(entries.size() - 6, entries.size());
    }

    private boolean hasStagnantBodyWeight(List<ProgressEntry> entries) {
        double firstWeight = entries.get(0).getBodyWeight();
        double lastWeight = entries.get(entries.size() - 1).getBodyWeight();
        return Math.abs(lastWeight - firstWeight) <= 0.5;
    }

    private boolean hasRepeatedStagnationSignals(List<ProgressEntry> entries) {
        int signals = 0;

        for (ProgressEntry entry : entries) {
            String performance = safeText(entry.getWorkoutPerformance()).toLowerCase();
            String notes = safeText(entry.getNotes()).toLowerCase();

            if (containsAny(performance, "stagnant", "plateau", "stalled", "regressed")
                    || containsAny(notes, "stagnant", "plateau", "stalled", "regressed")) {
                signals++;
            }
        }

        return signals >= 2;
    }

    private boolean hasRisingFatigue(List<ProgressEntry> entries) {
        int increases = 0;

        for (int index = 1; index < entries.size(); index++) {
            int previous = fatigueScore(entries.get(index - 1).getFatigueLevel());
            int current = fatigueScore(entries.get(index).getFatigueLevel());

            if (current > previous) {
                increases++;
            }
        }

        return increases >= 2;
    }

    private boolean hasDecliningSleep(List<ProgressEntry> entries) {
        double firstSleep = entries.get(0).getSleepHours();
        double lastSleep = entries.get(entries.size() - 1).getSleepHours();
        return lastSleep + 0.75 < firstSleep;
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

    private boolean hasLowBulkCalorieSupport(UserProfile profile, List<ProgressEntry> entries) {
        if (!safeText(profile.getGoal()).equalsIgnoreCase("Bulk")) {
            return false;
        }

        double averageCalories = entries.stream()
                .mapToInt(ProgressEntry::getCalories)
                .filter(calories -> calories > 0)
                .average()
                .orElse(0);

        return averageCalories > 0
                && profile.getCurrentCalories() > 0
                && averageCalories < profile.getCurrentCalories();
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
