"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { QuestionItem } from "@/lib/mock-data";
import { Code, ClipboardCheck, Terminal, Play, Wand2, CheckCircle2 } from "lucide-react";

interface CodeTerminalProps {
  question: QuestionItem;
}

export function CodeTerminal({ question }: CodeTerminalProps) {
  const [code, setCode] = useState(question.codeInitialTemplate || "");
  const [isAutoTyping, setIsAutoTyping] = useState(false);
  const [isExecuted, setIsExecuted] = useState(false);
  const [liveOutput, setLiveOutput] = useState("");
  const [allPassed, setAllPassed] = useState(false);

  const lineCount = Math.max(code.split("\n").length, 10);

  const handleAutoType = () => {
    if (isAutoTyping) return;
    setIsAutoTyping(true);
    setCode("");

    const targetCode = question.codeSolution || question.codeInitialTemplate || "";
    let i = 0;

    const interval = setInterval(() => {
      setCode(targetCode.substring(0, i + 1));
      i++;
      if (i >= targetCode.length) {
        clearInterval(interval);
        setIsAutoTyping(false);
      }
    }, 12);
  };

  const handleRunCode = () => {
    setIsExecuted(true);
    setLiveOutput(question.expectedOutput || "");
    setAllPassed(true);
  };

  return (
    <div className="w-full h-full flex flex-col p-4 bg-canvas max-w-5xl mx-auto">
      <div className="flex-1 bg-surface border border-border/50 rounded-2xl overflow-hidden flex flex-col shadow-lg">
        
        {/* Question Area */}
        <div className="bg-sidebar px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <Code className="w-4 h-4 text-accent-primary" />
            <h2 className="text-[13px] font-bold text-foreground">Question Challenge</h2>
            <div className="flex-1" />
            <span className="px-2 py-0.5 rounded text-[10px] font-bold text-accent-emerald bg-accent-emerald/10">
              Universal Code Sandbox
            </span>
          </div>
          
          <p className="text-[13px] font-medium text-foreground leading-relaxed mb-3">
            {question.questionText}
          </p>

          {question.testCases && question.testCases.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Requirements & Test Cases:</span>
              <div className="mt-1 flex flex-col gap-1">
                {question.testCases.map((tc, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-accent-primary font-bold text-xs">•</span>
                    <span className="text-xs text-muted-foreground">{tc.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Editor Area */}
        <div className="flex-[3] flex bg-canvas overflow-hidden">
          {/* Gutter */}
          <div className="w-12 bg-sidebar/50 border-r border-border/50 flex flex-col items-center py-4 text-muted-foreground font-mono text-[11px]">
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i} className="h-5">{i + 1}</div>
            ))}
          </div>

          {/* Textarea (Simplified version of editor) */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-transparent p-4 text-[13px] font-mono text-[#ABB2BF] leading-[20px] outline-none resize-none"
            style={{ 
              whiteSpace: "pre", 
              tabSize: 4 
            }}
          />
        </div>

        <div className="h-[1px] bg-border/50" />

        {/* Terminals */}
        <div className="flex-[2] flex h-48">
          {/* Expected Output */}
          <div className="flex-1 bg-sidebar p-3 flex flex-col border-r border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="w-3.5 h-3.5 text-accent-emerald" />
              <span className="text-[11px] font-bold text-accent-emerald">match output:</span>
            </div>
            <div className="flex-1 bg-black rounded-lg border border-border/50 p-2 overflow-auto font-mono text-[11px] text-accent-emerald whitespace-pre">
              {question.expectedOutput}
            </div>
          </div>

          {/* User Output */}
          <div className="flex-1 bg-sidebar p-3 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              {isExecuted ? <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald" /> : <Terminal className="w-3.5 h-3.5 text-accent-primary" />}
              <span className={cn(
                "text-[11px] font-bold",
                isExecuted ? "text-accent-emerald" : "text-accent-primary"
              )}>
                Your output:
              </span>
            </div>
            <div className="flex-1 bg-black rounded-lg border border-border/50 p-2 overflow-auto font-mono text-[11px]">
              {isExecuted ? (
                <span className="text-foreground whitespace-pre">{liveOutput}</span>
              ) : (
                <span className="text-muted-foreground">Ready to run code...</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-sidebar px-4 py-3 flex items-center justify-between border-t border-border/50">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRunCode}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent-primary text-accent-primary hover:bg-accent-primary/10 transition-colors text-xs font-bold"
            >
              <Play className="w-4 h-4 fill-current" />
              Run Code
            </button>
            <button 
              onClick={handleAutoType}
              disabled={isAutoTyping}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent-emerald text-accent-emerald hover:bg-accent-emerald/10 transition-colors text-xs font-bold disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              {isAutoTyping ? "Typing..." : "Auto-Type Solution"}
            </button>
          </div>

          <button 
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-accent-emerald text-white hover:bg-emerald-500 transition-colors text-xs font-bold"
          >
            {allPassed ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Passed! Submit
              </>
            ) : (
              "Proceed & Submit"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
