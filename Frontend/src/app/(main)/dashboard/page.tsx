import React from "react";
import { GreetingHeroCard } from "@/components/dashboard/GreetingHeroCard";
import { ContinueLearningCard } from "@/components/dashboard/ContinueLearningCard";
import { LearningJourneyCard } from "@/components/dashboard/LearningJourneyCard";
import { NeedsAttentionCard, RoadmapPreviewCard } from "@/components/dashboard/SecondaryCards";

export default function DashboardPage() {
  return (
    <div className="min-h-full overflow-y-auto p-6 lg:p-8">
      <div className="max-w-[1280px] mx-auto space-y-5">
        <GreetingHeroCard />
        
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-5">
          <div className="lg:col-span-6">
            <ContinueLearningCard />
          </div>
          <div className="lg:col-span-4">
            <LearningJourneyCard />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-5">
          <div className="lg:col-span-6">
            <RoadmapPreviewCard />
          </div>
          <div className="lg:col-span-4">
            <NeedsAttentionCard />
          </div>
        </div>
      </div>
    </div>
  );
}
