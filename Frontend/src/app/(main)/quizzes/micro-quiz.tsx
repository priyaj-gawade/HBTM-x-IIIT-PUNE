"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { QuestionItem } from "@/lib/mock-data";
import { CheckCircle2, XCircle, Circle, CircleDot, X } from "lucide-react";

interface MicroQuizProps {
  questions: QuestionItem[];
}

export function MicroQuiz({ questions }: MicroQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentQuestion = questions[currentIndex];

  const handleSubmit = () => {
    if (!selectedOptionId) return;

    const selectedOpt = currentQuestion.options.find(o => o.id === selectedOptionId);
    
    if (!hasSubmitted) {
      setHasSubmitted(true);
      if (selectedOpt?.isCorrect) {
        setCorrectCount(c => c + 1);
      }
    } else {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(c => c + 1);
        setSelectedOptionId(null);
        setHasSubmitted(false);
      } else {
        alert("Micro-Quiz Complete!");
      }
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-[580px] bg-surface border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-sidebar px-4 py-3 flex items-center gap-3 border-b border-border/50">
          <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
          <h2 className="text-xs font-bold text-foreground">
            Micro-Quiz Checkpoint · Score: {correctCount}/{currentIndex + 1} · Q{currentIndex + 1}/{questions.length}
          </h2>
          <div className="flex-1" />
          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-accent-emerald bg-accent-emerald/10">
            {currentQuestion.topicTag}
          </span>
          <button className="text-muted-foreground hover:text-foreground transition-colors ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question Body */}
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm font-bold text-foreground leading-relaxed">
            {currentQuestion.questionText}
          </p>

          <div className="flex flex-col gap-2.5">
            {currentQuestion.options.map(opt => {
              const isSelected = selectedOptionId === opt.id;
              
              let borderColor = "border-border/50";
              let bgColor = "bg-canvas";
              
              if (hasSubmitted) {
                if (opt.isCorrect) {
                  borderColor = "border-accent-emerald";
                  bgColor = "bg-accent-emerald/10";
                } else if (isSelected && !opt.isCorrect) {
                  borderColor = "border-orange-500";
                  bgColor = "bg-orange-500/10";
                }
              } else if (isSelected) {
                borderColor = "border-accent-primary";
                bgColor = "bg-accent-primary/10";
              }

              return (
                <button
                  key={opt.id}
                  disabled={hasSubmitted}
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3.5 py-3 rounded-xl border transition-colors text-left",
                    borderColor,
                    bgColor,
                    !hasSubmitted && "hover:border-accent-primary/50"
                  )}
                >
                  <div className="shrink-0">
                    {hasSubmitted ? (
                      opt.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
                      ) : isSelected ? (
                        <XCircle className="w-4 h-4 text-orange-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )
                    ) : (
                      isSelected ? (
                        <CircleDot className="w-4 h-4 text-accent-primary" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )
                    )}
                  </div>
                  
                  <span className={cn(
                    "text-xs flex-1",
                    isSelected ? "font-bold text-foreground" : "text-foreground"
                  )}>
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-sidebar px-4 py-3 flex items-center justify-between border-t border-border/50">
          <span className="text-[11px] text-muted-foreground">
            Selected: {selectedOptionId ? "1 Answer" : "None"}
          </span>
          
          <button 
            disabled={!selectedOptionId}
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg bg-accent-primary text-black font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-primary/90 transition-colors"
          >
            {hasSubmitted 
              ? (currentIndex + 1 < questions.length ? 'Next Question →' : 'View Results')
              : 'Submit Answer'
            }
          </button>
        </div>

      </div>
    </div>
  );
}
