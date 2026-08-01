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
  ChevronRightSquare 
} from "lucide-react";
import { RoadmapModule, RoadmapSection, RoadmapActivity } from "@/lib/mock-data";

interface RoadmapExplorerProps {
  roadmap: RoadmapModule[];
}

export function RoadmapExplorer({ roadmap }: RoadmapExplorerProps) {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full text-foreground bg-canvas h-full overflow-y-auto no-scrollbar pb-32">
      <div className="mb-8">
        <div className="flex items-center gap-3 text-fg-accent mb-2">
          <BookOpen className="w-6 h-6" />
          <h2 className="text-xl font-bold text-foreground">Curriculum Navigator</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          What can I learn next? Select any activity below to jump straight into the interactive Learning Lab.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {roadmap.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({ module }: { module: RoadmapModule }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const progressInt = Math.round(module.progressPercent * 100);

  return (
    <div className="rounded-xl border border-border/50 bg-surface overflow-hidden">
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
              className="h-full bg-fg-accent transition-all duration-500 ease-out" 
              style={{ width: `${progressInt}%` }}
            />
          </div>
          <span className="text-sm font-bold text-muted-foreground w-10 text-right">{progressInt}%</span>
        </div>

        <div className="shrink-0 text-muted-foreground ml-2">
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
      </button>

      {/* Sections */}
      {isExpanded && module.sections.length > 0 && (
        <div className="border-t border-border/50 flex flex-col">
          {module.sections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionCard({ section }: { section: RoadmapSection }) {
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
      {isExpanded && section.activities.length > 0 && (
        <div className="py-3 bg-surface">
          {section.activities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityRow({ activity }: { activity: RoadmapActivity }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isCompleted = activity.status === 'Completed';
  const isInProgress = activity.status === 'In Progress';

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Watch Video': return PlayCircle;
      case 'Read Article': return FileText;
      case 'Practice Lab': return Terminal;
      case 'Take Quiz': return HelpCircle;
      case 'Generate Flashcards': return Layers;
      default: return FileText;
    }
  };

  const IconComponent = isCompleted ? CheckCircle2 : getActivityIcon(activity.type);
  const iconColor = isCompleted ? "text-accent-emerald" : (isInProgress ? "text-foreground" : "text-muted-foreground");
  const bgColor = isCompleted ? "bg-sidebar" : (isInProgress ? "bg-fg-accent/10" : "bg-surface");
  const borderColor = isInProgress ? "border-fg-accent" : "border-border/50";

  return (
    <div className="flex flex-col">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-3.5 mx-4 md:mx-6 my-1.5 p-3 rounded-lg border transition-colors text-left",
          bgColor,
          borderColor,
          "hover:border-fg-accent/50"
        )}
      >
        <IconComponent className={cn("w-4 h-4 shrink-0", iconColor)} />
        
        <h5 className={cn(
          "flex-1 text-sm",
          isInProgress ? "font-bold text-accent-emerald underline decoration-accent-emerald/40 underline-offset-4" : "font-medium text-foreground",
          isCompleted && "text-accent-emerald underline decoration-accent-emerald/40 underline-offset-4"
        )}>
          {activity.title}
        </h5>

        {activity.estimatedTime && (
          <span className="text-xs text-muted-foreground shrink-0">
            {activity.estimatedTime}
          </span>
        )}

        <div className="shrink-0 text-muted-foreground ml-2">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Sub-actions (Modality Options) */}
      {isExpanded && (
        <div className="pl-[52px] md:pl-[68px] pr-4 md:pr-6 pb-2 pt-1 flex flex-col gap-0.5">
          <ModalityOption icon={PlayCircle} title="Watch Video" />
          <ModalityOption icon={FileText} title="Read Article" />
          <ModalityOption icon={Terminal} title="Practice Lab" />
          <ModalityOption icon={HelpCircle} title="Take Quiz" />
          <FlashcardOption />
        </div>
      )}
    </div>
  );
}

function ModalityOption({ icon: Icon, title }: { icon: any, title: string }) {
  return (
    <button className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-white/5 transition-colors text-left group">
      <Icon className="w-4 h-4 text-fg-accent group-hover:text-fg-accent/80" />
      <span className="text-[13px] text-foreground flex-1">{title}</span>
      <ChevronRightSquare className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function FlashcardOption() {
  return (
    <button className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-white/5 transition-colors text-left group">
      <Layers className="w-4 h-4 text-accent-emerald" />
      <span className="text-[13px] font-bold text-foreground flex-1">Generate Flashcards</span>
      <Zap className="w-3.5 h-3.5 text-accent-emerald" />
    </button>
  );
}
