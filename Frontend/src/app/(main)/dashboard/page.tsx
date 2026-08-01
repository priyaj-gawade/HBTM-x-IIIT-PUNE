"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GreetingHeroCard } from "@/components/dashboard/GreetingHeroCard";
import { ContinueLearningCard } from "@/components/dashboard/ContinueLearningCard";
import { LearningJourneyCard } from "@/components/dashboard/LearningJourneyCard";
import { NeedsAttentionCard, RoadmapPreviewCard } from "@/components/dashboard/SecondaryCards";
import { ApiClient } from "@/lib/api-client";
import { useWorkspace } from "@/lib/workspace-context";

export default function DashboardPage() {
  const { activeWorkspace, workspaces, isLoading: wsLoading } = useWorkspace();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(true);

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
        console.error("Dashboard API error:", err);
      } finally {
        setApiLoading(false);
      }
    }
    loadData();
  }, []);

  const loading = wsLoading && apiLoading;

  if (loading) {
    return <div className="min-h-full p-8 flex justify-center text-muted-foreground">Loading Atlas...</div>;
  }

  const hasWorkspace = Boolean(activeWorkspace || (workspaces && workspaces.length > 0) || dashboardData);

  if (!hasWorkspace) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-4 p-8">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Welcome to Atlas</h2>
        <p className="text-muted-foreground max-w-[500px] text-lg">
          You haven't set up a workspace yet. Head over to the Interview to chat with Atlas and generate your personalized learning roadmap!
        </p>
        <Link href="/interview" className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm">
          Start Interview
        </Link>
      </div>
    );
  }

  // Derive display values from active workspace + backend data
  const currentSubject = activeWorkspace?.title || activeWorkspace?.subject || dashboardData?.today_focus || "Foundations";
  const currentFocus = activeWorkspace?.activeLearningContext || activeWorkspace?.subtitle || dashboardData?.today_focus || "Core Concepts";
  const progressPercent = activeWorkspace?.progressPercent ?? ((activeWorkspace?.progress ?? (dashboardData?.growth_score ?? 0)) / 100);
  const progressScore = Math.round(progressPercent * 100);
  const streak = dashboardData?.streak ?? 1;

  const journeyData = {
    overallProgress: progressPercent,
    level: Math.floor(progressScore / 20) + 1,
    xp: progressScore * 50,
    streakDays: streak,
    hoursLearned: Math.round(progressScore * 0.5 * 10) / 10,
    hoursRemaining: Math.round((100 - progressScore) * 0.5 * 10) / 10,
  };

  const continueData = {
    workspaceName: currentSubject,
    difficulty: activeWorkspace?.difficulty || "Adaptive",
    currentTopic: currentFocus,
    nextAction: dashboardData?.mission?.title || `Deep dive into ${currentFocus}`,
    estimatedTime: "25m",
    progressPercent: progressPercent,
  };

  // Convert blueprint nodes if available to roadmap preview nodes
  const blueprintNodes = activeWorkspace?.blueprintNodes || [];
  const roadmapNodes = blueprintNodes.length > 0 ? blueprintNodes.map((n: any, idx: number) => ({
    title: n.title || `Phase ${idx+1}`,
    status: idx === 0 ? "active" : "locked",
    icon: undefined,
  })) : undefined;

  const previewProgress = roadmapNodes ? { nodes: roadmapNodes } : progressData;

  return (
    <div className="min-h-full overflow-y-auto p-6 lg:p-8">
      <div className="max-w-[1280px] mx-auto space-y-5">
        <GreetingHeroCard userName={userData?.name || "Learner"} />
        
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
            <RoadmapPreviewCard progress={previewProgress} />
          </div>
          <div className="lg:col-span-4">
            <NeedsAttentionCard insights={dashboardData?.insights} />
          </div>
        </div>
      </div>
    </div>
  );
}

