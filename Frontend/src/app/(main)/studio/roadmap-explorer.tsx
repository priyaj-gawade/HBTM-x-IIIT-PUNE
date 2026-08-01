"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  PlayCircle, 
  FileText, 
  Terminal, 
  HelpCircle, 
  Layers, 
  Zap, 
  ChevronRightSquare,
  Sparkles
} from "lucide-react";
import { RoadmapModule, RoadmapSection, RoadmapActivity } from "@/lib/mock-data";

interface RoadmapExplorerProps {
  roadmap: RoadmapModule[];
  activeLearningContext?: string;
  onSelectActivity?: (activityTitle: string, activityType: string) => void;
  onToggleComplete?: (activityId: string, completed: boolean) => void;
}

export function RoadmapExplorer({ roadmap, activeLearningContext, onSelectActivity, onToggleComplete }: RoadmapExplorerProps) {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full text-foreground bg-canvas h-full overflow-y-auto no-scrollbar pb-32">
      <div className="mb-8">
        <div className="flex items-center gap-3 text-fg-accent mb-2">
          <BookOpen className="w-6 h-6" />
          <h2 className="text-xl font-bold text-foreground">Curriculum Navigator</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          What can I learn next? Click any activity below to load its YouTube lecture directly into the interactive Learning Lab. Click the checkmark to track your course progress!
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {roadmap.map((module) => (
          <ModuleCard 
            key={module.id} 
            module={module} 
            activeLearningContext={activeLearningContext}
            onSelectActivity={onSelectActivity}
            onToggleComplete={onToggleComplete}
          />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({ 
  module, 
  activeLearningContext,
  onSelectActivity,
  onToggleComplete
}: { 
  module: RoadmapModule;
  activeLearningContext?: string;
  onSelectActivity?: (activityTitle: string, activityType: string) => void;
  onToggleComplete?: (activityId: string, completed: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const progressInt = Math.round(module.progressPercent * 100);

  return (
    <div className="rounded-xl border border-border/50 bg-surface overflow-hidden shadow-sm">
      {/* Header */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 p-4 md:px-6 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          {module.subtitle && (
            <p className="text-xs font-bold text-fg-accent mb-1">{module.subtitle}</p>
          )}
          <h3 className="text-base font-bold text-foreground truncate">{module.title}</h3>
        </div>

        <div className="hidden md:flex items-center gap-4 shrink-0">
          <div className="w-24 h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.6)] transition-all duration-500 ease-out" 
              style={{ width: `${progressInt}%` }}
            />
          </div>
          <span className="text-sm font-bold text-cyan-400 w-10 text-right">{progressInt}%</span>
        </div>

        <div className="shrink-0 text-muted-foreground ml-2">
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
      </button>

      {/* Sections */}
      {isExpanded && module.sections && module.sections.length > 0 && (
        <div className="border-t border-border/50 flex flex-col">
          {module.sections.map((section) => (
            <SectionCard 
              key={section.id} 
              section={section} 
              activeLearningContext={activeLearningContext}
              onSelectActivity={onSelectActivity}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionCard({ 
  section, 
  activeLearningContext,
  onSelectActivity,
  onToggleComplete
}: { 
  section: RoadmapSection;
  activeLearningContext?: string;
  onSelectActivity?: (activityTitle: string, activityType: string) => void;
  onToggleComplete?: (activityId: string, completed: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border-b border-border/50 last:border-0">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 py-3 px-4 md:px-6 bg-sidebar hover:bg-white/5 transition-colors text-left"
      >
        <h4 className="flex-1 text-sm font-bold text-accent-emerald underline decoration-accent-emerald/40 underline-offset-4">
          {section.title}
        </h4>
        
        {section.estimatedTime && (
          <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
            Estimated {section.estimatedTime}
          </span>
        )}

        <div className="shrink-0 text-muted-foreground">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {/* Activities */}
      {isExpanded && section.activities && section.activities.length > 0 && (
        <div className="py-2 bg-surface">
          {section.activities.map((activity) => (
            <ActivityRow 
              key={activity.id} 
              activity={activity} 
              activeLearningContext={activeLearningContext}
              onSelectActivity={onSelectActivity}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityRow({ 
  activity, 
  activeLearningContext,
  onSelectActivity,
  onToggleComplete
}: { 
  activity: RoadmapActivity;
  activeLearningContext?: string;
  onSelectActivity?: (activityTitle: string, activityType: string) => void;
  onToggleComplete?: (activityId: string, completed: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isCompleted = activity.status === 'Completed';
  const isActive = activeLearningContext && (
    activity.title.toLowerCase() === activeLearningContext.toLowerCase() ||
    activeLearningContext.toLowerCase().includes(activity.title.toLowerCase()) ||
    activity.title.toLowerCase().includes(activeLearningContext.toLowerCase())
  );
  const isInProgress = activity.status === 'In Progress' || isActive;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Watch Video': return PlayCircle;
      case 'Read Article': return FileText;
      case 'Practice Lab': return Terminal;
      case 'Take Quiz': return HelpCircle;
      case 'Generate Flashcards': return Layers;
      default: return PlayCircle;
    }
  };

  const IconComponent = isCompleted ? CheckCircle2 : getActivityIcon(activity.type);
  const iconColor = isCompleted 
    ? "text-cyan-400" 
    : (isActive ? "text-accent-primary" : (isInProgress ? "text-foreground" : "text-muted-foreground"));
  const bgColor = isActive 
    ? "bg-accent-primary/10 border-accent-primary/60" 
    : (isCompleted ? "bg-[#162A32]/40 border-cyan-500/30" : (isInProgress ? "bg-fg-accent/10 border-fg-accent" : "bg-surface border-border/50"));

  const handleRowClick = () => {
    if (onSelectActivity) {
      onSelectActivity(activity.title, activity.type || "Watch Video");
    }
  };

  const handleToggleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleComplete) {
      onToggleComplete(activity.id, !isCompleted);
    }
  };

  const toggleSubActions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="flex flex-col">
      <div 
        onClick={handleRowClick}
        className={cn(
          "group flex items-center gap-3.5 mx-4 md:mx-6 my-1 p-3 rounded-lg border transition-all text-left cursor-pointer",
          bgColor,
          "hover:border-cyan-400/60 hover:bg-cyan-500/5 shadow-sm"
        )}
      >
        <button
          onClick={handleToggleCheck}
          className="p-1 -m-1 rounded-md hover:bg-white/10 transition-colors"
          title={isCompleted ? "Mark incomplete" : "Mark completed (+progress)"}
        >
          <IconComponent className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", iconColor)} />
        </button>
        
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h5 className={cn(
            "text-sm truncate",
            isCompleted && "text-cyan-300 line-through decoration-cyan-500/40",
            isActive && !isCompleted && "font-bold text-accent-primary",
            isInProgress && !isActive && !isCompleted && "font-bold text-accent-emerald underline decoration-accent-emerald/40 underline-offset-4",
            !isActive && !isInProgress && !isCompleted && "font-medium text-foreground"
          )}>
            {activity.title}
          </h5>
          {isActive && (
            <span className="px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary text-[10px] font-bold shrink-0 animate-pulse">
              Active in Lab
            </span>
          )}
          {isCompleted && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold shrink-0">
              Completed
            </span>
          )}
        </div>

        {activity.estimatedTime && (
          <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline-block">
            {activity.estimatedTime}
          </span>
        )}

        <button 
          onClick={toggleSubActions}
          className="shrink-0 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
          title="Toggle activities"
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Sub-actions (Modality Options) */}
      {isExpanded && (
        <div className="pl-[52px] md:pl-[68px] pr-4 md:pr-6 pb-2 pt-1 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <ModalityOption 
            icon={PlayCircle} 
            title="Watch Video" 
            onClick={() => onSelectActivity?.(activity.title, "Watch Video")} 
          />
          <ModalityOption 
            icon={FileText} 
            title="Read Article" 
            onClick={() => onSelectActivity?.(activity.title, "Read Article")} 
          />
          <ModalityOption 
            icon={Terminal} 
            title="Practice Lab" 
            onClick={() => onSelectActivity?.(activity.title, "Practice Lab")} 
          />
          <ModalityOption 
            icon={HelpCircle} 
            title="Take Quiz" 
            onClick={() => onSelectActivity?.(activity.title, "Take Quiz")} 
          />
          <FlashcardOption 
            onClick={() => onSelectActivity?.(activity.title, "Generate Flashcards")} 
          />
        </div>
      )}
    </div>
  );
}

function ModalityOption({ 
  icon: Icon, 
  title, 
  onClick 
}: { 
  icon: any; 
  title: string;
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="flex items-center gap-3 py-1.5 px-2.5 rounded-md bg-canvas/40 hover:bg-white/10 border border-transparent hover:border-border/50 transition-all text-left group"
    >
      <Icon className="w-4 h-4 text-fg-accent group-hover:text-accent-primary" />
      <span className="text-[13px] text-foreground flex-1 font-medium">{title}</span>
      <ChevronRightSquare className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function FlashcardOption({ onClick }: { onClick?: () => void }) {
  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="flex items-center gap-3 py-1.5 px-2.5 rounded-md bg-accent-emerald/5 hover:bg-accent-emerald/15 border border-accent-emerald/20 transition-all text-left group"
    >
      <Layers className="w-4 h-4 text-accent-emerald" />
      <span className="text-[13px] font-bold text-accent-emerald flex-1">Generate Flashcards</span>
      <Zap className="w-3.5 h-3.5 text-accent-emerald" />
    </button>
  );
}
