import React from "react";

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
        <span className="font-sans text-[13px] text-muted-foreground">
          {Math.floor(fallbackData.progressPercent * 100)}%
        </span>
      </div>
      <div className="w-full h-1 bg-secondary rounded-[2px] overflow-hidden mb-8">
        <div 
          className="h-full bg-ring transition-all duration-500 ease-out"
          style={{ width: `${fallbackData.progressPercent * 100}%` }}
        />
      </div>

      <div className="mt-auto" />

      {/* Continue Button */}
      <div className="w-full" style={{ boxShadow: "0 4px 16px rgba(103, 232, 249, 0.15)" }}>
        <button className="w-full bg-ring text-background py-4 rounded-lg font-bold text-[15px] font-sans hover:bg-opacity-90 transition-colors">
          Continue Learning
        </button>
      </div>
    </div>
  );
}
