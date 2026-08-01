import React from "react";

interface LearningJourneyData {
  overallProgress: number;
  level: number;
  xp: number;
  streakDays: number;
  hoursLearned: number;
  hoursRemaining: number;
}

function JourneyMetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-secondary rounded-xl py-6 px-4 flex flex-col items-center justify-center">
      <span className="font-display text-[28px] font-bold text-foreground mb-2">{value}</span>
      <span className="font-sans text-[13px] text-muted-foreground">{label}</span>
    </div>
  );
}

export function LearningJourneyCard({ data }: { data?: LearningJourneyData }) {
  const fallbackData = data || {
    overallProgress: 0.35,
    level: 4,
    xp: 2450,
    streakDays: 12,
    hoursLearned: 14,
    hoursRemaining: 26,
  };

  const progressPct = Math.round(fallbackData.overallProgress * 100);

  return (
    <div className="bg-card rounded-2xl p-8 h-full border-none flex flex-col">
      <h2 className="font-display text-xl font-bold text-foreground mb-8">
        Learning Journey
      </h2>

      <div className="flex flex-col gap-4 mt-auto">
        <div className="flex gap-4">
          <div className="flex-1">
            <JourneyMetricCard value={`${progressPct}%`} label="Progress" />
          </div>
          <div className="flex-1">
            <JourneyMetricCard value={`${fallbackData.level}`} label="Level" />
          </div>
          <div className="flex-1">
            <JourneyMetricCard value={`${fallbackData.xp}`} label="XP" />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <JourneyMetricCard value={`${fallbackData.streakDays}`} label="Day Streak" />
          </div>
          <div className="flex-1">
            <JourneyMetricCard value={`${Math.round(fallbackData.hoursLearned)}h`} label="Learned" />
          </div>
          <div className="flex-1">
            <JourneyMetricCard value={`${Math.round(fallbackData.hoursRemaining)}h`} label="Remaining" />
          </div>
        </div>
      </div>
    </div>
  );
}
