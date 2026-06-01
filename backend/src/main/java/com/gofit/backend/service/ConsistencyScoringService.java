package com.gofit.backend.service;

import com.gofit.backend.model.ProgressEntry;
import com.gofit.backend.model.UserProfile;
import org.springframework.stereotype.Service;

import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class ConsistencyScoringService {

    public ConsistencyScore calculateConsistency(UserProfile profile, String progressAnalysis) {
        List<ProgressEntry> recentEntries = getRecentEntries(profile);
        int score = 88;

        if (recentEntries.size() < 3) {
            score -= 18;
        }
        if (hasWideCalorieSwing(recentEntries)) {
            score -= 12;
        }
        if (hasWideSleepSwing(recentEntries)) {
            score -= 10;
        }
        if (hasSparseCheckIns(recentEntries)) {
            score -= 10;
        }
        if (safeText(progressAnalysis).toLowerCase().contains("relatively stagnant")) {
            score -= 6;
        }

        score = Math.max(40, Math.min(score, 98));

        return new ConsistencyScore(score, buildFeedback(score));
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

        return minimumCalories != Integer.MAX_VALUE
                && maximumCalories != Integer.MIN_VALUE
                && maximumCalories - minimumCalories >= 400;
    }

    private boolean hasWideSleepSwing(List<ProgressEntry> entries) {
        double minimumSleep = Double.MAX_VALUE;
        double maximumSleep = Double.MIN_VALUE;

        for (ProgressEntry entry : entries) {
            double sleep = entry.getSleepHours();
            if (sleep <= 0) {
                continue;
            }
            minimumSleep = Math.min(minimumSleep, sleep);
            maximumSleep = Math.max(maximumSleep, sleep);
        }

        return minimumSleep != Double.MAX_VALUE
                && maximumSleep != Double.MIN_VALUE
                && maximumSleep - minimumSleep >= 2.0;
    }

    private boolean hasSparseCheckIns(List<ProgressEntry> entries) {
        if (entries.size() < 2
                || entries.get(0).getDate() == null
                || entries.get(entries.size() - 1).getDate() == null) {
            return false;
        }

        long daysBetween = ChronoUnit.DAYS.between(
                entries.get(0).getDate(),
                entries.get(entries.size() - 1).getDate()
        );

        return daysBetween > 28 && entries.size() <= 4;
    }

    private String buildFeedback(int score) {
        if (score < 65) {
            return "Recent inconsistency may limit progression quality. More regular check-ins, steadier calories, and steadier recovery habits would improve confidence in future adjustments.";
        }

        if (score < 85) {
            return "Training and recovery consistency appear workable, though a few habits still look uneven enough to affect progression quality.";
        }

        return "Training and recovery consistency currently appear stable, which gives the coaching system cleaner feedback to work from.";
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }

    public static class ConsistencyScore {

        private final int score;
        private final String feedback;

        public ConsistencyScore(int score, String feedback) {
            this.score = score;
            this.feedback = feedback;
        }

        public int getScore() {
            return score;
        }

        public String getFeedback() {
            return feedback;
        }
    }
}
