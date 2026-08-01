"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Radar, 
  ClipboardList, 
  Compass, 
  Library, 
  Plus,
  Sparkles,
  CheckCircle2,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace-context";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: MessageSquare, label: "Interview", href: "/interview" },
  { icon: Radar, label: "Studio", href: "/studio" },
  { icon: ClipboardList, label: "Quizzes", href: "/quizzes" },
  { icon: Compass, label: "Hub", href: "/hub" },
];

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return "Recently";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Recently";
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    workspaces, 
    activeWorkspaceId, 
    selectWorkspace, 
    isPanelOpen, 
    setIsPanelOpen, 
    loadWorkspaces 
  } = useWorkspace();

  const handleTogglePanel = () => {
    const nextState = !isPanelOpen;
    setIsPanelOpen(nextState);
    if (nextState) {
      loadWorkspaces();
    }
  };

  const handleSelectWorkspace = async (wsId: string) => {
    await selectWorkspace(wsId);
    setIsPanelOpen(false);
    if (pathname !== "/studio") {
      router.push("/studio");
    }
  };

  const handleNewWorkspace = () => {
    setIsPanelOpen(false);
    router.push("/interview");
  };

  return (
    <div className="flex z-50">
      {/* Left Vertical Activity Bar */}
      <div className="w-[56px] bg-[#141414] border-r border-[#333333] flex flex-col items-center py-4 relative z-20 shrink-0 select-none">
        
        {/* Brand Icon */}
        <Link 
          href="/dashboard"
          className="w-[34px] h-[34px] bg-[#2F2F2F] hover:bg-[#383838] rounded-[10px] border border-[#333333] flex items-center justify-center mb-4 transition-colors"
          title="Atlas Home"
        >
          <span className="text-white text-sm">✨</span>
        </Link>

        {/* Learning Spaces Explorer Icon */}
        <button 
          onClick={handleTogglePanel}
          className={cn(
            "relative w-[44px] h-[44px] rounded-[10px] flex items-center justify-center mb-2 transition-all duration-200",
            isPanelOpen 
              ? "bg-white/15 border border-white/40 shadow-inner" 
              : "hover:bg-[#2F2F2F] border border-transparent"
          )}
          title="Learning Spaces History"
        >
          <Library className={cn("w-[22px] h-[22px]", isPanelOpen ? "text-white" : "text-[#878787]")} />
          {isPanelOpen && (
            <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-cyan-400 rounded-r-md shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          )}
        </button>
        
        <div className="w-8 h-[1px] bg-[#333333] mb-2" />

        {/* Nav Icons */}
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "relative w-[44px] h-[44px] my-1 rounded-[10px] flex items-center justify-center transition-colors group",
                isActive ? "bg-white/15 border border-white/40" : "hover:bg-[#2F2F2F] border border-transparent"
              )}
              title={item.label}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-white rounded-r-md shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
              )}
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-[#878787] group-hover:text-[#ECECEC]")} />
            </Link>
          );
        })}

        <div className="flex-1" />

        {/* Auto-save indicator */}
        <div className="flex items-center gap-1 mb-4" title="Auto-Save: Active">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[10px] font-bold text-[#878787]">✓</span>
        </div>

        {/* Profile Avatar */}
        <Link href="/settings" className="w-[30px] h-[30px] rounded-full bg-[#D97706] flex items-center justify-center hover:opacity-90 transition-opacity">
          <span className="text-white text-[11px] font-bold">PG</span>
        </Link>
      </div>

      {/* Slide-out Panel Overlay */}
      {isPanelOpen && (
        <div className="w-[320px] h-full bg-[#171717] border-r border-[#333333] fixed left-[56px] top-0 bottom-0 z-30 shadow-2xl flex flex-col backdrop-blur-md animate-in slide-in-from-left duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/50 bg-[#141414]/70">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-foreground font-bold text-sm font-display tracking-tight">Learning Spaces</h2>
            </div>
            <button 
              onClick={handleNewWorkspace}
              className="w-7 h-7 rounded-lg bg-[#262626] hover:bg-white/15 border border-white/10 flex items-center justify-center transition-colors group text-muted-foreground hover:text-white"
              title="Start New Learning Space"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Workspaces List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {workspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground px-4">
                <Library className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">No workspaces saved yet.</p>
                <button
                  onClick={handleNewWorkspace}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition"
                >
                  Create your first space
                </button>
              </div>
            ) : (
              workspaces.map((workspace) => {
                const isActive = workspace.id === activeWorkspaceId;
                const progressPct = typeof workspace.progress === "number" 
                  ? Math.min(Math.max(workspace.progress, 0), 100)
                  : typeof workspace.progressPercent === "number"
                    ? Math.round(workspace.progressPercent <= 1 ? workspace.progressPercent * 100 : workspace.progressPercent)
                    : 0;

                return (
                  <div 
                    key={workspace.id}
                    onClick={() => handleSelectWorkspace(workspace.id)}
                    className={cn(
                      "group relative flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all duration-200 select-none",
                      isActive 
                        ? "bg-[#222222] border-cyan-500/40 shadow-[0_0_12px_rgba(56,189,248,0.15)] ring-1 ring-cyan-500/20" 
                        : "bg-[#1B1B1B]/70 border-[#2A2A2A] hover:bg-[#232323] hover:border-white/15"
                    )}
                  >
                    {/* Active Ribbon indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                    )}

                    {/* Top Row: Created time */}
                    <div className="flex justify-between items-center mb-1.5">
                      <h3 className={cn(
                        "font-sans text-[13px] font-bold transition-colors leading-snug line-clamp-1 flex-1",
                        isActive ? "text-cyan-300" : "text-foreground group-hover:text-white"
                      )}>
                        {workspace.title || workspace.subject || "Learning Workspace"}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 ml-2">
                        <Clock className="w-3 h-3 opacity-60" />
                        <span>{formatTimeAgo(workspace.createdAt || workspace.lastOpened)}</span>
                      </div>
                    </div>

                    {/* Progress Section: Percentage number above the blue line */}
                    <div className="mt-auto pt-1">
                      <div className="flex justify-between items-center text-[11px] mb-1 font-sans">
                        <span className="text-muted-foreground text-[10px] font-medium">Course Completion</span>
                        <span className={cn(
                          "font-bold text-[11px]",
                          progressPct > 0 ? "text-cyan-400" : "text-muted-foreground"
                        )}>
                          {progressPct}%
                        </span>
                      </div>

                      {/* Blue Progress Bar Line */}
                      <div className="w-full bg-[#2A2A2A] h-[3.5px] rounded-full overflow-hidden">
                        <div 
                          className="bg-[#38BDF8] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-4 py-2.5 border-t border-border/40 bg-[#141414]/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{workspaces.length} {workspaces.length === 1 ? "Space" : "Spaces"} Synced</span>
            <span className="text-accent-emerald flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Cloud Synced
            </span>
          </div>

        </div>
      )}
    </div>
  );
}

