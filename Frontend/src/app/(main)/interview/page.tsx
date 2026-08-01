"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { 
  Image as ImageIcon, 
  Edit3, 
  Globe, 
  Plus, 
  Mic, 
  AudioLines, 
  ArrowUp,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  MoreHorizontal
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ApiClient } from "@/lib/api-client";
import { useWorkspace } from "@/lib/workspace-context";

export default function InterviewPage() {
  const router = useRouter();
  const { createWorkspace } = useWorkspace();
  const [messages, setMessages] = useState<{id: string, sender: string, text: string, options?: string[]}[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAskingPlan, setIsAskingPlan] = useState(false);
  const [inferredPersona, setInferredPersona] = useState<any>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const initRef = useRef(false);

  // Initialize conversation
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      handleSend("INIT", true);
    }
  }, []);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (textOverride?: string, isInit: boolean = false) => {
    const userInput = textOverride ?? input.trim();
    if (!userInput || isLoading) return;

    if (!isInit) {
      setMessages((prev) => [...prev, {
        id: `u-${Date.now()}`,
        sender: "USER",
        text: userInput,
        options: undefined
      }]);
    }
    
    setInput("");
    setIsLoading(true);

    if (isAskingPlan && !isInit) {
      const affirmativeWords = ["yes", "y", "sure", "ok", "yeah", "yep", "proceed", "create", "plan", "ready"];
      const isAffirmative = affirmativeWords.some(w => userInput.toLowerCase().includes(w));

      if (isAffirmative && inferredPersona) {
        try {
          const personaRes = await ApiClient.post('/orchestration/interview/complete', inferredPersona);
          const activeTopic = inferredPersona.subject || personaRes.subtitle || personaRes.title || "Foundations";
          
          if (typeof window !== "undefined") {
            localStorage.setItem('atlas_persona', JSON.stringify(personaRes));
            localStorage.setItem('atlas_active_context', activeTopic);
          }

          try {
            const courseSubject = inferredPersona.subject || personaRes.subtitle || "My Learning Path";
            await createWorkspace({
              ...personaRes,
              title: courseSubject,
              personaTitle: personaRes.title,
              subject: courseSubject,
              difficulty: inferredPersona.difficulty || "Intermediate",
              activeLearningContext: activeTopic,
              progress: 0,
              progressPercent: 0.0,
              subtitle: personaRes.subtitle,
              summary: personaRes.summary,
              traits: personaRes.traits,
              metrics: personaRes.metrics,
              blueprintNodes: personaRes.blueprintNodes,
            });
          } catch (wsErr) {
            console.warn("Workspace save non-critical error:", wsErr);
          }
          router.push('/studio');
        } catch (err) {
          console.error("Interview completion error:", err);
          setIsLoading(false);
        }
        return; // Stop here, redirecting
      } else {
        setIsAskingPlan(false);
        // continue chatting with this negative response
      }
    }

    try {
      const historyStr = messages.map(m => `${m.sender}: ${m.text}`).join("\n");
      
      const res = await ApiClient.post('/orchestration/interview', { 
        message: isInit ? "Hello, let's start the onboarding interview." : userInput,
        history: historyStr || "No prior history."
      });
      
      const replyText = 
        res.replyToUser || 
        res.reply_to_user || 
        res.reply || 
        res.message || 
        res.text || 
        res.response || 
        "Hello! I am Atlas Tutor. What subject or skill would you like to master today?";
      
      setMessages((prev) => [
        ...prev, 
        {
          id: `ai-${Date.now()}`,
          sender: "AI",
          text: replyText,
          options: res.options || []
        }
      ]);

      const conf = res.internalState?.confidenceScore ?? res.internal_state?.confidenceScore ?? res.internalState?.confidence_score ?? 0;
      if (conf > 0) {
        setConfidenceScore(conf);
      }

      const statePersona = res.internalState?.currentInferredPersona ?? res.internal_state?.currentInferredPersona ?? res.internalState?.current_inferred_persona;
      if (statePersona && typeof statePersona === "object") {
        setInferredPersona((prev: any) => ({
          ...(prev || {}),
          ...statePersona
        }));
      }

      const isComplete = conf >= 80 || (res.options && res.options.some((o: string) => o.endsWith('➔')));
      
      if (isComplete && !isAskingPlan) {
        setIsAskingPlan(true);
        setMessages((prev) => [
          ...prev, 
          {
            id: `ai-plan-${Date.now()}`,
            sender: "AI",
            text: "I have gathered enough insight to craft your personalized blueprint! Ready to generate your workspace?",
            options: ["Yes, proceed ➔", "Let's refine more"]
          }
        ]);
      }

    } catch (err) {
      console.error(err);
      if (!isInit) {
        setMessages((prev) => [
          ...prev, 
          {
            id: `ai-${Date.now()}`,
            sender: "AI",
            text: "I'm having trouble connecting right now. Please try again later.",
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen w-full relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-activity-bar">
        <div className="flex items-center gap-3">
          <h1 className="font-display font-bold text-foreground">Atlas Tutor</h1>
          {inferredPersona?.subject && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
              Subject: {inferredPersona.subject}
            </span>
          )}
        </div>
        {confidenceScore > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-sans">Profiling: {confidenceScore}%</span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out" 
                style={{ width: `${Math.min(confidenceScore, 100)}%` }} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Thread */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8"
      >
        <div className="max-w-[720px] mx-auto space-y-8">
          {messages.map((msg, idx) => {
            const isAI = msg.sender === "AI";
            
            return (
              <div 
                key={msg.id} 
                className={cn(
                  "flex w-full",
                  isAI ? "justify-start" : "justify-end"
                )}
              >
                {!isAI ? (
                  // User Message (Sleek Dark Pill)
                  <div className="bg-surface rounded-2xl rounded-br-sm px-5 py-3 max-w-[85%] sm:max-w-[550px] shadow-sm">
                    <p className="text-foreground text-sm leading-relaxed">{msg.text}</p>
                  </div>
                ) : (
                  // AI Message (Unboxed Markdown)
                  <div className="max-w-[100%] sm:max-w-[85%] pr-4">
                    <div className="prose prose-invert max-w-none text-foreground text-sm leading-relaxed mb-3">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>

                    {/* AI Action Bar */}
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <button className="p-1.5 hover:bg-white/5 rounded-md transition-colors"><Copy className="w-[15px] h-[15px]" /></button>
                      <button className="p-1.5 hover:bg-white/5 rounded-md transition-colors"><ThumbsUp className="w-[15px] h-[15px]" /></button>
                      <button className="p-1.5 hover:bg-white/5 rounded-md transition-colors"><ThumbsDown className="w-[15px] h-[15px]" /></button>
                      <button className="p-1.5 hover:bg-white/5 rounded-md transition-colors"><RotateCcw className="w-[15px] h-[15px]" /></button>
                      <button className="p-1.5 hover:bg-white/5 rounded-md transition-colors"><MoreHorizontal className="w-[15px] h-[15px]" /></button>
                    </div>

                    {/* Options Chips */}
                    {msg.options && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {msg.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setInput(opt);
                              setTimeout(() => handleSend(opt), 50);
                            }}
                            className="text-xs px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-white/5 transition-colors text-foreground"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="max-w-[100%] sm:max-w-[85%] pr-4">
                <div className="text-muted-foreground text-sm italic">Thinking...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Input Bar Area */}
      <div className="p-4 bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="max-w-[720px] mx-auto">
          <div className="bg-surface border border-border rounded-full flex items-center px-2 py-1.5 shadow-lg">
            
            <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors text-muted-foreground flex-shrink-0">
              <Plus className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent border-none outline-none text-foreground text-sm px-2 min-w-0"
            />

            {input.trim().length > 0 ? (
              <button 
                onClick={() => handleSend()}
                className="w-8 h-8 ml-1 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0"
              >
                <ArrowUp className="w-4 h-4 text-background" />
              </button>
            ) : (
              <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors text-muted-foreground">
                  <Mic className="w-[18px] h-[18px]" />
                </button>
                <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity text-background">
                  <AudioLines className="w-[16px] h-[16px]" />
                </button>
              </div>
            )}
          </div>
          
          <div className="text-center mt-3">
            <span className="text-[11px] text-muted-foreground">Atlas Tutor can make mistakes. Check important info.</span>
          </div>
        </div>
      </div>

    </div>
  );
}
