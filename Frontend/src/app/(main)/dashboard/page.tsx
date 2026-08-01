"use client";

import React, { useEffect, useState } from "react";
import { GreetingHeroCard } from "@/components/dashboard/GreetingHeroCard";
import { ContinueLearningCard } from "@/components/dashboard/ContinueLearningCard";
import { LearningJourneyCard } from "@/components/dashboard/LearningJourneyCard";
import { NeedsAttentionCard, RoadmapPreviewCard } from "@/components/dashboard/SecondaryCards";
import { ApiClient } from "@/lib/api-client";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, progRes, userRes] = await Promise.all([
          ApiClient.get('/dashboard').catch(() => null),
          ApiClient.get('/progress').catch(() => null),
          ApiClient.get('/auth/me').catch(() => null)
        ]);
        setDashboardData(dashRes);
        setProgressData(progRes);
        setUserData(userRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="min-h-full p-8 flex justify-center text-muted-foreground">Loading Atlas...</div>;
  }

  if (!dashboardData) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-4 p-8">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Welcome to Atlas</h2>
        <p className="text-muted-foreground max-w-[500px] text-lg">
          You haven't set up a workspace yet. Head over to the Interview to chat with Atlas and generate your personalized learning roadmap!
        </p>
        <a href="/interview" className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm">
          Start Interview
        </a>
      </div>
    );
  }

  // Transform backend data for the cards if available
  const journeyData = dashboardData ? {
    overallProgress: dashboardData.growth_score / 100,
    level: Math.floor(dashboardData.growth_score / 20) + 1,
    xp: dashboardData.growth_score * 50,
    streakDays: dashboardData.streak,
    hoursLearned: dashboardData.growth_score * 0.5,
    hoursRemaining: (100 - dashboardData.growth_score) * 0.5,
  } : undefined;

  const continueData = dashboardData ? {
    workspaceName: "Your Current Focus",
    difficulty: "Adaptive",
    currentTopic: dashboardData.today_focus,
    nextAction: dashboardData.mission?.title || "Continue where you left off",
    estimatedTime: "20m",
    progressPercent: dashboardData.growth_score / 100,
  } : undefined;

  return (
    <div className="min-h-full overflow-y-auto p-6 lg:p-8">
      <div className="max-w-[1280px] mx-auto space-y-5">
        <GreetingHeroCard userName={userData?.name} />
        
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-5">
          <div className="lg:col-span-6">
            <ContinueLearningCard data={continueData} />
          </div>
          <div className="lg:col-span-4">
            <LearningJourneyCard data={journeyData} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-5">
          <div className="lg:col-span-6">
            <RoadmapPreviewCard progress={progressData} />
          </div>
          <div className="lg:col-span-4">
            <NeedsAttentionCard insights={dashboardData?.insights} />
          </div>
        </div>
      </div>
    </div>
  );
}
