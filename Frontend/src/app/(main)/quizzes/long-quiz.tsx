"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { QuestionItem } from "@/lib/mock-data";
import { 
  CheckCircle2, 
  XCircle, 
  Circle, 
  CircleDot, 
  FactCheck, 
  EditNote,
  Send,
  WarningAmber
} from "lucide-react"; // FactCheck -> ClipboardCheck, EditNote -> FileEdit, WarningAmber -> AlertTriangle. Let's adjust imports

import { ClipboardCheck, FileEdit, AlertTriangle, Loader2 } from "lucide-react";

interface LongQuizProps {
  questions: QuestionItem[];
}

export function LongQuiz({ questions }: LongQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{ isPassed: boolean, score: string, feedback: string, suggestedReviewTopic?: string } | null>(null);
  
  const [subjectiveText, setSubjectiveText] = useState("");

  const currentQuestion = questions[currentIndex];
  const isSubjective = currentQuestion.type === 'subjective';

  const handleOptionSelect = (optId: string) => {
    setUserAnswers(prev => ({ ...prev, [currentIndex]: optId }));
  };

  const submitSubjective = () => {
    setIsEvaluating(true);
    setEvaluationResult(null);

    // Mock evaluation delay
    setTimeout(() => {
      setEvaluationResult({
        isPassed: false,
        score: "60/100",
        feedback: "You mentioned QuickSort but did not provide the space complexity for MergeSort (O(n)).",
        suggestedReviewTopic: "Time vs Space Complexity Trade-offs"
      });
      setUserAnswers(prev => ({ ...prev, [currentIndex]: subjectiveText }));
      setIsEvaluating(false);
    }, 1500);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setEvaluationResult(null);
      setSubjectiveText("");
    } else {
      alert("Long Quiz Completed!");
    }
  };

  if (questions.length === 0) return null;

  return (
    <div className="w-full h-full flex flex-col p-4 bg-canvas max-w-4xl mx-auto">
      <div className="flex-1 bg-surface border border-border/50 rounded-2xl overflow-hidden flex flex-col shadow-lg">
        
        {/* Header */}
        <div className="bg-sidebar px-4 py-3 flex items-center gap-3 border-b border-border/50">
          {isSubjective ? <FileEdit className="w-4 h-4 text-accent-primary" /> : <ClipboardCheck className="w-4 h-4 text-accent-primary" />}
          <h2 className="text-xs font-bold text-foreground">
            Dynamic Assessment · Question {currentIndex + 1} of {questions.length}
          </h2>
          <div className="flex-1" />
          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-accent-primary bg-accent-primary/10">
            {currentQuestion.topicTag}
          </span>
        </div>

        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <p className="text-[15px] font-bold text-foreground leading-relaxed mb-6">
            {currentQuestion.questionText}
          </p>

          {!isSubjective ? (
            <div className="flex flex-col gap-3">
              {currentQuestion.options.map(opt => {
                const selectedOptionId = userAnswers[currentIndex];
                const isSelected = selectedOptionId === opt.id;
                const showAnswer = !!selectedOptionId;

                let borderColor = "border-border/50";
                let bgColor = "bg-transparent";

                if (showAnswer) {
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
                    disabled={showAnswer}
                    onClick={() => handleOptionSelect(opt.id)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border transition-colors text-left",
                      borderColor,
                      bgColor,
                      !showAnswer && "hover:border-accent-primary/50"
                    )}
                  >
                    <div className="shrink-0">
                      {isSelected ? (
                        <CircleDot className={cn("w-4 h-4", showAnswer ? (opt.isCorrect ? "text-accent-emerald" : "text-orange-500") : "text-accent-primary")} />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    <span className={cn(
                      "text-[13px] flex-1",
                      isSelected ? "font-bold text-foreground" : "text-foreground"
                    )}>
                      {opt.text}
                    </span>

                    {showAnswer && opt.isCorrect && <CheckCircle2 className="w-5 h-5 text-accent-emerald" />}
                    {showAnswer && isSelected && !opt.isCorrect && <XCircle className="w-5 h-5 text-orange-500" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {evaluationResult ? (
                <div className={cn(
                  "p-5 border rounded-xl",
                  evaluationResult.isPassed ? "bg-accent-emerald/10 border-accent-emerald" : "bg-orange-500/10 border-orange-500"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    {evaluationResult.isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-accent-emerald" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    )}
                    <span className={cn(
                      "font-bold text-sm",
                      evaluationResult.isPassed ? "text-accent-emerald" : "text-orange-500"
                    )}>
                      {evaluationResult.isPassed ? `Passed! Score: ${evaluationResult.score}` : `Needs Work! Score: ${evaluationResult.score}`}
                    </span>
                  </div>
                  
                  <p className="text-sm text-foreground leading-relaxed mb-3">
                    <strong className="opacity-70">Feedback:</strong> {evaluationResult.feedback}
                  </p>
                  
                  {!evaluationResult.isPassed && evaluationResult.suggestedReviewTopic && (
                    <p className="text-[13px] text-orange-400 font-medium">
                      Suggested Review: {evaluationResult.suggestedReviewTopic}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <textarea 
                    value={subjectiveText}
                    onChange={(e) => setSubjectiveText(e.target.value)}
                    placeholder="Type your detailed answer here..."
                    className="w-full h-32 bg-canvas border border-border/50 rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent-primary transition-colors resize-none"
                  />
                  
                  <div className="flex justify-end">
                    {isEvaluating ? (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI is evaluating your answer...
                      </div>
                    ) : (
                      <button 
                        disabled={!subjectiveText.trim()}
                        onClick={submitSubjective}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface border border-border hover:bg-white/5 transition-colors text-sm font-bold disabled:opacity-50 text-foreground"
                      >
                        <Send className="w-4 h-4" />
                        Submit Answer
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-sidebar px-6 py-4 flex items-center justify-between border-t border-border/50">
          <button 
            disabled={currentIndex === 0}
            onClick={() => {
              setCurrentIndex(c => c - 1);
              setEvaluationResult(null);
            }}
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Previous
          </button>

          <button 
            disabled={!(userAnswers[currentIndex] !== undefined || evaluationResult !== null)}
            onClick={handleNext}
            className="px-6 py-2.5 rounded-lg bg-accent-primary text-black font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-primary/90 transition-colors"
          >
            {currentIndex === questions.length - 1 ? 'Finish Assessment' : 'Next Question'}
          </button>
        </div>

      </div>
    </div>
  );
}
