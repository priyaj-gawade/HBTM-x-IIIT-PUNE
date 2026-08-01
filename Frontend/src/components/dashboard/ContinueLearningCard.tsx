import React from "react";
import Link from "next/link";

interface ContinueLearningData {
  workspaceName: string;
  difficulty: string;
  currentTopic: string;
  nextAction: string;
  estimatedTime: string;
  progressPercent: number;
}

export function ContinueLearningCard({ data }: { data?: ContinueLearningData }) {
  const fallbackData = data || {
    workspaceName: "Data Science Fundamentals",
    difficulty: "Beginner",
    currentTopic: "Introduction to Pandas",
    nextAction: "Complete Exercise 3",
    estimatedTime: "25m",
    progressPercent: 0.35,
  };

  const pct = Math.round(fallbackData.progressPercent <= 1 ? fallbackData.progressPercent * 100 : fallbackData.progressPercent);

  return (
    <div className="bg-card rounded-2xl p-8 flex flex-col h-full border-none">
      <div className="flex justify-between items-center mb-2">
        <span className="font-sans text-[13px] text-muted-foreground">Workspace</span>
        <span className="font-sans text-[13px] text-[#6B6B6B]">{fallbackData.difficulty}</span>
      </div>
      
      <h2 className="font-display text-2xl font-bold text-foreground mb-6">
        {fallbackData.workspaceName}
      </h2>

      <span className="font-sans text-[13px] text-muted-foreground mb-2">Current Topic</span>
      <p className="font-sans text-base text-foreground mb-4">{fallbackData.currentTopic}</p>

      <span className="font-sans text-[13px] text-muted-foreground mb-2">Next Action</span>
      <p className="font-sans text-base text-foreground mb-4">{fallbackData.nextAction}</p>

      <span className="font-sans text-[13px] text-muted-foreground mb-2">Estimated Time</span>
      <p className="font-sans text-base text-foreground mb-6">{fallbackData.estimatedTime}</p>

      {/* Progress */}
      <div className="flex justify-between items-center mb-2">
        <span className="font-sans text-[13px] text-muted-foreground">Overall Progress</span>
        <span className="font-sans text-[13px] font-bold text-cyan-400">
          {pct}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden mb-8">
        <div 
          className="h-full bg-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.6)] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-auto" />

      {/* Continue Button */}
      <div className="w-full" style={{ boxShadow: "0 4px 16px rgba(103, 232, 249, 0.15)" }}>
        <Link href="/studio">
          <button className="w-full bg-[#38BDF8] text-black py-4 rounded-lg font-bold text-[15px] font-sans hover:bg-opacity-90 transition-colors">
            Continue Learning
          </button>
        </Link>
      </div>
    </div>
  );
}
