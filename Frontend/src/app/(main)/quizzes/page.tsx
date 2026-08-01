"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ListChecks, LayoutGrid, TerminalSquare } from "lucide-react";
import { MOCK_MICRO_QUIZ, MOCK_LONG_QUIZ, MOCK_CODE_CHALLENGE } from "@/lib/mock-data";

import { MicroQuiz } from "./micro-quiz";
import { LongQuiz } from "./long-quiz";
import { CodeTerminal } from "./code-terminal";

export default function QuizzesPage() {
  const [activeTab, setActiveTab] = useState<"micro" | "long" | "code">("micro");

  return (
    <div className="w-full h-full flex flex-col bg-canvas">
      {/* Dev Mode Switcher Header */}
      <div className="bg-sidebar border-b border-border/50 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-sm font-bold text-foreground">Quiz Components Lab</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Switch between the 3 distinct quiz layouts.</p>
        </div>
        
        <div className="flex bg-surface rounded-lg p-1 border border-border/50 shadow-sm">
          <button
            onClick={() => setActiveTab("micro")}
            className={cn(
              "px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-colors",
              activeTab === "micro" 
                ? "bg-accent-primary/10 text-accent-primary" 
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Micro Quiz
          </button>
          <button
            onClick={() => setActiveTab("long")}
            className={cn(
              "px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-colors",
              activeTab === "long" 
                ? "bg-accent-primary/10 text-accent-primary" 
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <ListChecks className="w-4 h-4" />
            Long Quiz
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={cn(
              "px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-colors",
              activeTab === "code" 
                ? "bg-accent-primary/10 text-accent-primary" 
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <TerminalSquare className="w-4 h-4" />
            Code Terminal
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 overflow-hidden relative">
        {/* We absolutely position them and toggle opacity/pointer-events to preserve state if desired, or just conditionally render. Let's do conditional rendering to ensure clean mount/unmount for testing. */}
        {activeTab === "micro" && <MicroQuiz questions={MOCK_MICRO_QUIZ} />}
        {activeTab === "long" && <LongQuiz questions={MOCK_LONG_QUIZ} />}
        {activeTab === "code" && <CodeTerminal question={MOCK_CODE_CHALLENGE} />}
      </div>
    </div>
  );
}
