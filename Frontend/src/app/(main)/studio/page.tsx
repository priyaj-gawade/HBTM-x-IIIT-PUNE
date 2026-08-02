"use client";

import React, { useState, useRef, useEffect } from "react";
import YouTube from "react-youtube";
import { cn } from "@/lib/utils";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { 
  Undo2, 
  FoldVertical, 
  UnfoldVertical,
  PlayCircle,
  Settings,
  Maximize2,
  Volume2,
  Sparkles,
  Waypoints,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  LayoutGrid,
  Share2,
  UserCircle,
  Grid3x3,
  Layers,
  FlaskConical,
  X,
  Plus,
  ArrowUp,
  Play
} from "lucide-react";
import { RoadmapExplorer } from "./roadmap-explorer";
import { InteractiveCanvas } from "@/components/canvas/interactive-canvas";
import { ApiClient } from "@/lib/api-client";
import { MOCK_PYTHON_ROADMAP, MOCK_FLASHCARDS } from "@/lib/mock-data";
import { useWorkspace } from "@/lib/workspace-context";

export default function StudioPage() {
  const { 
    activeWorkspace, 
    activeWorkspaceId, 
    updateProgress, 
    updateActiveContext,
    saveWorkspace 
  } = useWorkspace();

  const [isScrollMode, setIsScrollMode] = useState(false);
  const [videoFraction, setVideoFraction] = useState(0.6); // 60% video, 40% canvas
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"ai" | "roadmap">("roadmap");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState("lab");
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [persona, setPersona] = useState<any>(null);
  
  // Video Player & Learning Context - 100% Dynamic, no hardcoded video IDs
  const [playerRef, setPlayerRef] = useState<any>(null);
  const [videoId, setVideoId] = useState<string>("");
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [activeLearningContext, setActiveLearningContext] = useState<string>("");
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  // Helper to fetch and assign video dynamically for a topic
  const fetchTopicVideo = async (topicTitle: string, contextStr: string = "") => {
    if (!topicTitle) return;
    setIsLoadingVideo(true);
    try {
      const res = await ApiClient.get(`/search/videos?topic=${encodeURIComponent(topicTitle)}&context=${encodeURIComponent(contextStr)}`);
      if (Array.isArray(res) && res.length > 0) {
        const vid = res[0].id;
        const vTitle = res[0].title || topicTitle;
        setVideoId(vid);
        setVideoTitle(vTitle);
        setActiveLearningContext(topicTitle);
        if (activeWorkspaceId) {
          updateActiveContext(topicTitle, vid, vTitle);
        }
      }
    } catch (e) {
      console.error("Failed to search video for topic:", e);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // Synchronize from active workspace
  useEffect(() => {
    if (activeWorkspace) {
      setPersona(activeWorkspace);
      if (activeWorkspace.activeLearningContext) {
        setActiveLearningContext(activeWorkspace.activeLearningContext);
      } else if (activeWorkspace.subtitle || activeWorkspace.title) {
        setActiveLearningContext(activeWorkspace.subtitle || activeWorkspace.title);
      }

      if (activeWorkspace.videoId) {
        setVideoId(activeWorkspace.videoId);
      } else {
        setVideoId("");
      }

      if (activeWorkspace.videoTitle) {
        setVideoTitle(activeWorkspace.videoTitle);
      } else {
        setVideoTitle("");
      }

      if (activeWorkspace.roadmap && Array.isArray(activeWorkspace.roadmap) && activeWorkspace.roadmap.length > 0) {
        setRoadmap(activeWorkspace.roadmap);
        // If workspace doesn't have a saved video yet, search dynamically for the first roadmap activity
        if (!activeWorkspace.videoId) {
          const firstAct = activeWorkspace.roadmap[0]?.sections?.[0]?.activities?.[0]?.title 
            || activeWorkspace.title 
            || activeWorkspace.subject;
          if (firstAct) {
            fetchTopicVideo(firstAct, activeWorkspace.title || activeWorkspace.subject || "");
          }
        }
      } else {
        const topicToGenerate = activeWorkspace.subtitle || activeWorkspace.title || activeWorkspace.subject || "Software Engineering";
        generateRoadmapForTopic(topicToGenerate);
      }
    } else if (typeof window !== "undefined") {
      const saved = localStorage.getItem('atlas_persona');
      const savedContext = localStorage.getItem('atlas_active_context');
      if (savedContext) {
        setActiveLearningContext(savedContext);
      }
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          handlePersonaGenerated(parsed);
        } catch (e) {
          console.error("Failed to parse saved persona", e);
        }
      }
    }
  }, [activeWorkspaceId]);

  const generateRoadmapForTopic = async (topic: string) => {
    setIsGeneratingRoadmap(true);
    try {
      const response = await ApiClient.post('/roadmap/generate', {
        topic: topic,
        target_role: "Learner",
        experience_level: "Beginner"
      });
      if (response && response.modules) {
        setRoadmap(response.modules);
        if (activeWorkspaceId) {
          saveWorkspace({ roadmap: response.modules });
        }
        // Auto-load video for first activity in the generated roadmap if none is loaded
        const firstAct = response.modules[0]?.sections?.[0]?.activities?.[0]?.title;
        if (firstAct && !videoId) {
          fetchTopicVideo(firstAct, topic);
        }
      }
    } catch (err) {
      console.error("Failed to generate roadmap:", err);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleSelectActivity = async (topicTitle: string, activityType: string = "Watch Video") => {
    if (!topicTitle) return;
    setActiveLearningContext(topicTitle);
    
    if (activityType === "Generate Flashcards") {
      setShowFlashcards(true);
    }

    setIsLoadingVideo(true);
    let matchedVideoId = "";
    let matchedVideoTitle = topicTitle;

    try {
      const contextStr = persona?.subtitle || persona?.title || "";
      const res = await ApiClient.get(`/search/videos?topic=${encodeURIComponent(topicTitle)}&context=${encodeURIComponent(contextStr)}`);
      if (Array.isArray(res) && res.length > 0) {
        matchedVideoId = res[0].id;
        matchedVideoTitle = res[0].title || topicTitle;
        setVideoId(matchedVideoId);
        setVideoTitle(matchedVideoTitle);
      }
    } catch (e) {
      console.error("Failed to search videos for topic:", e);
    } finally {
      setIsLoadingVideo(false);
    }

    // Persist active context and video to workspace state & database
    if (matchedVideoId) {
      updateActiveContext(topicTitle, matchedVideoId, matchedVideoTitle);
    } else {
      updateActiveContext(topicTitle);
    }

    // Switch to Learning Lab Workspace
    setActiveWorkspaceTab("lab");
  };

  const handleToggleActivityComplete = (activityId: string, completed: boolean) => {
    let totalActs = 0;
    let completedActs = 0;

    const updatedRoadmap = roadmap.map((module) => {
      let moduleTotal = 0;
      let moduleCompleted = 0;

      const updatedSections = module.sections?.map((section: any) => {
        const updatedActivities = section.activities?.map((act: any) => {
          totalActs++;
          moduleTotal++;
          const isActCompleted = act.id === activityId ? completed : act.status === 'Completed';
          if (isActCompleted) {
            completedActs++;
            moduleCompleted++;
          }
          return {
            ...act,
            status: isActCompleted ? 'Completed' : 'Not Started'
          };
        });
        return {
          ...section,
          activities: updatedActivities
        };
      });

      const moduleProgressPercent = moduleTotal > 0 ? moduleCompleted / moduleTotal : 0;

      return {
        ...module,
        progressPercent: moduleProgressPercent,
        sections: updatedSections
      };
    });

    setRoadmap(updatedRoadmap);

    const overallPct = totalActs > 0 ? Math.round((completedActs / totalActs) * 100) : 0;
    updateProgress(overallPct);
    saveWorkspace({ roadmap: updatedRoadmap });
  };

  const handlePersonaGenerated = async (newPersona: any) => {
    setPersona(newPersona);
    setSidebarTab("roadmap");
    const initialTopic = newPersona.subtitle || newPersona.title || "Python Basics";
    setActiveLearningContext(initialTopic);
    
    // Auto-search initial topic video
    handleSelectActivity(initialTopic, "Watch Video");

    // Generate Roadmap based on the new Persona Subject
    generateRoadmapForTopic(initialTopic);
  };

  const handleVerticalDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMove = (moveEvent: MouseEvent) => {
      // Very basic mock calculation for demo purposes
      // In a real app, you'd use container bounds. Here we just delta.
      setVideoFraction((prev) => Math.min(Math.max(prev + (moveEvent.movementY / 800), 0.3), 0.8));
    };
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const handleHorizontalDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMove = (moveEvent: MouseEvent) => {
      setSidebarWidth((prev) => Math.min(Math.max(prev - moveEvent.movementX, 260), 600));
    };
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen w-full relative bg-canvas">
      {/* Top Workspace Tab Bar (Chrome/Antigravity Style) */}
      <div className="flex items-center gap-1 px-2 pt-2 bg-activity-bar border-b border-border/50 overflow-x-auto no-scrollbar">
        {[
          { id: 'roadmap', title: 'Learning Roadmap', icon: Waypoints },
          { id: 'mind_map', title: 'Subject Mind Map', icon: Share2 },
          { id: 'persona', title: 'Persona Profile', icon: UserCircle },
          { id: 'canvas', title: 'Infinite Canvas', icon: Grid3x3 },
          { id: 'flashcard_canvas', title: 'Flashcard Canvas', icon: Layers },
          { id: 'lab', title: 'Learning Lab Workspace', icon: FlaskConical },
        ].map((tab) => {
          const isActive = activeWorkspaceTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveWorkspaceTab(tab.id)}
              className={cn(
                "group flex items-center gap-2 px-4 py-2 min-w-[180px] max-w-[220px] rounded-t-xl border-t border-x transition-colors relative shrink-0",
                isActive 
                  ? "bg-canvas border-border/50 z-10" 
                  : "bg-activity-bar border-transparent hover:bg-surface text-muted-foreground hover:text-foreground"
              )}
            >
              <IconComponent className={cn("w-4 h-4 shrink-0", isActive ? "text-accent-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="text-[11px] font-bold truncate flex-1 text-left">{tab.title}</span>
              {isActive && (
                <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-canvas z-20" />
              )}
            </button>
          );
        })}
      </div>

      {activeWorkspaceTab === "lab" ? (
        <>
          {/* Workspace Header */}
      <div className="flex items-center px-4 py-3 bg-activity-bar border-b border-border/50">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-accent-primary hover:bg-accent-primary/10 transition-colors text-xs font-bold mr-4">
          <Undo2 className="w-3.5 h-3.5" />
          Back to Mind Map
        </button>

        <h1 className="font-display font-bold text-[15px] text-foreground">Learning Lab Workspace</h1>
        
        <div className="ml-3 px-2.5 py-1 rounded-full bg-accent-emerald/15 text-accent-emerald text-[11px] font-bold border border-accent-emerald/30 flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
          Active: {activeLearningContext}
        </div>

        {videoTitle && (
          <div className="ml-3 hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border/60 text-muted-foreground text-[11px] max-w-sm truncate">
            <PlayCircle className="w-3 h-3 text-accent-primary shrink-0" />
            <span className="truncate">{videoTitle}</span>
          </div>
        )}

        <div className="flex-1" />

        <button 
          onClick={() => setIsScrollMode(!isScrollMode)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-xs font-bold",
            isScrollMode 
              ? "bg-accent-primary/20 border-accent-primary text-accent-primary"
              : "bg-canvas border-border/50 text-muted-foreground hover:border-border"
          )}
        >
          {isScrollMode ? <FoldVertical className="w-3.5 h-3.5" /> : <UnfoldVertical className="w-3.5 h-3.5" />}
          {isScrollMode ? "Split Mode" : "Scroll Mode"}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT STAGE */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-canvas">
          {isScrollMode ? (
            // SCROLL MODE
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="h-[400px] sm:h-[50vh] rounded-xl border border-border overflow-hidden shrink-0 relative">
                <VideoPlayer 
                  videoId={videoId} 
                  videoTitle={videoTitle} 
                  isLoading={isLoadingVideo} 
                  onReady={(e) => setPlayerRef(e.target)} 
                />
              </div>
              <div className="h-[550px] sm:h-[60vh] rounded-xl border border-border overflow-hidden shrink-0">
                {showFlashcards ? (
                  <FlashcardDeckMock 
                    toggle={() => setShowFlashcards(false)} 
                    topic={activeLearningContext || persona?.subtitle || persona?.title || persona?.subject || "Software Engineering"} 
                    videoId={videoId} 
                    playerRef={playerRef} 
                  />
                ) : (
                  <CanvasMock 
                    toggle={() => setShowFlashcards(true)} 
                    topic={activeLearningContext || persona?.subtitle || persona?.title || persona?.subject || "Software Engineering"} 
                  />
                )}
              </div>
            </div>
          ) : (
            // SPLIT MODE
            <div className="flex-1 flex flex-col p-4 h-full">
              <div 
                style={{ flex: videoFraction * 100 }} 
                className="rounded-xl border border-border overflow-hidden min-h-[150px] relative"
              >
                <VideoPlayer 
                  videoId={videoId} 
                  videoTitle={videoTitle} 
                  isLoading={isLoadingVideo} 
                  onReady={(e) => setPlayerRef(e.target)} 
                />
              </div>

              {/* Horizontal Resizer (Vertical Drag) */}
              <div 
                className="h-2 my-1 cursor-row-resize flex items-center justify-center group"
                onMouseDown={handleVerticalDrag}
              >
                <div className="h-px w-full bg-border/50 group-hover:bg-accent-primary transition-colors" />
              </div>

              <div 
                style={{ flex: (1 - videoFraction) * 100 }} 
                className="rounded-xl border border-border overflow-hidden min-h-[150px]"
              >
                {showFlashcards ? (
                  <FlashcardDeckMock 
                    toggle={() => setShowFlashcards(false)} 
                    topic={activeLearningContext || persona?.subtitle || persona?.title || persona?.subject || "Software Engineering"} 
                    videoId={videoId} 
                    playerRef={playerRef} 
                  />
                ) : (
                  <CanvasMock 
                    toggle={() => setShowFlashcards(true)} 
                    topic={activeLearningContext || persona?.subtitle || persona?.title || persona?.subject || "Software Engineering"} 
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* VERTICAL SPLITTER (Horizontal Drag) */}
        <div 
          className="w-1.5 cursor-col-resize bg-activity-bar flex items-center justify-center group shrink-0"
          onMouseDown={handleHorizontalDrag}
        >
          <div className="w-0.5 h-8 bg-border group-hover:bg-accent-primary transition-colors rounded-full" />
        </div>

        {/* RIGHT SIDEBAR */}
        <div 
          style={{ width: sidebarWidth }} 
          className="bg-sidebar shrink-0 flex flex-col border-l border-border/50"
        >
          {/* Sidebar Tabs */}
          <div className="flex p-2.5 bg-activity-bar border-b border-border/50 gap-2">
            <button 
              onClick={() => setSidebarTab("ai")}
              className={cn(
                "flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg border transition-colors text-[13px]",
                sidebarTab === "ai" 
                  ? "bg-surface border-fg-accent text-foreground font-bold"
                  : "border-transparent text-muted-foreground font-medium hover:bg-surface/50"
              )}
            >
              <Sparkles className={cn("w-4 h-4", sidebarTab === "ai" ? "text-fg-accent" : "text-muted-foreground")} />
              Atlas
            </button>
            <button 
              onClick={() => setSidebarTab("roadmap")}
              className={cn(
                "flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg border transition-colors text-[13px]",
                sidebarTab === "roadmap" 
                  ? "bg-surface border-fg-accent text-foreground font-bold"
                  : "border-transparent text-muted-foreground font-medium hover:bg-surface/50"
              )}
            >
              <Waypoints className={cn("w-4 h-4", sidebarTab === "roadmap" ? "text-fg-accent" : "text-muted-foreground")} />
              Roadmap
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sidebarTab === "ai" ? <SidebarAIMock onPersonaGenerated={handlePersonaGenerated} playerRef={playerRef} videoId={videoId} /> : (
              <div className="flex flex-col h-full overflow-hidden w-full relative">
                {isGeneratingRoadmap && (
                  <div className="absolute inset-0 bg-canvas/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-accent-primary">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                      <span className="text-xs font-bold">Generating...</span>
                    </div>
                  </div>
                )}
                {roadmap.length > 0 ? (
                  <RoadmapExplorer 
                    roadmap={roadmap} 
                    activeLearningContext={activeLearningContext}
                    onSelectActivity={handleSelectActivity}
                    onToggleComplete={handleToggleActivityComplete}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                    <Sparkles className="w-8 h-8 mb-4 opacity-50" />
                    <p className="text-sm">Start an interview with Atlas to generate your customized learning roadmap.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
          </>
      ) : activeWorkspaceTab === "roadmap" ? (
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {isGeneratingRoadmap && (
            <div className="absolute inset-0 bg-canvas/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-cyan-400">
                <Sparkles className="w-8 h-8 animate-pulse" />
                <span className="text-sm font-bold">Generating Roadmap...</span>
              </div>
            </div>
          )}
          {roadmap.length > 0 ? (
            <RoadmapExplorer 
              roadmap={roadmap} 
              activeLearningContext={activeLearningContext}
              onSelectActivity={handleSelectActivity}
              onToggleComplete={handleToggleActivityComplete}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <Sparkles className="w-8 h-8 mb-4 opacity-50" />
              <p className="text-sm font-medium">Start an interview with Atlas to generate your customized learning roadmap.</p>
              <button 
                onClick={() => { setSidebarTab("ai"); setActiveWorkspaceTab("lab"); }}
                className="mt-4 px-4 py-2 bg-cyan-400 text-black font-bold rounded-lg hover:bg-cyan-300 transition-colors"
              >
                Chat with Atlas
              </button>
            </div>
          )}
        </div>
      ) : activeWorkspaceTab === "persona" ? (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full">
          <div className="bg-[#181818] border border-border/60 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center justify-between pb-6 border-b border-border/50">
              <div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                  Cognitive Persona Profile
                </span>
                <h2 className="text-2xl font-bold text-foreground mt-2">
                  {persona?.title || activeWorkspace?.title || "The Applied Visionary"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {persona?.subtitle || activeWorkspace?.subtitle || "Adaptive Learner"}
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(56,189,248,0.15)]">
                🧠
              </div>
            </div>

            {/* Summary */}
            <div className="my-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Pedagogical Summary</h3>
              <p className="text-sm text-foreground/90 leading-relaxed bg-[#121212] p-4 rounded-xl border border-white/5">
                {persona?.summary || activeWorkspace?.summary || "Tailored curriculum focusing on architectural intuition, code synthesis, and project-based mastery."}
              </p>
            </div>

            {/* Traits */}
            {persona?.traits && persona.traits.length > 0 && (
              <div className="my-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Cognitive Traits</h3>
                <div className="flex flex-wrap gap-2">
                  {persona.traits.map((t: string, idx: number) => (
                    <span key={idx} className="px-3 py-1.5 rounded-lg bg-surface border border-white/10 text-xs font-medium text-cyan-300">
                      ✨ {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics */}
            {persona?.metrics && (
              <div className="mt-6 pt-6 border-t border-border/50 flex flex-col gap-6">
                
                {/* Card 1: Spider Web Graph */}
                <div className="bg-[#141414] p-6 rounded-xl border border-white/5 shadow-inner">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Cognitive Radar</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                        Object.entries(persona.metrics).map(([key, val]: [string, any]) => ({
                          subject: key.replace(/_/g, ' ').toUpperCase(),
                          value: Number(val?.score ?? val),
                          fullMark: 100
                        }))
                      }>
                        <PolarGrid stroke="#333" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                        <Radar
                          name="Persona"
                          dataKey="value"
                          stroke="#22d3ee"
                          fill="#22d3ee"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Card 2: Horizontal Percentage Lines */}
                <div className="bg-[#141414] p-6 rounded-xl border border-white/5 shadow-inner flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Detailed Breakdown</h3>
                  {Object.entries(persona.metrics).map(([key, val]: [string, any], idx) => {
                    const score = val?.score ?? val;
                    const meaning = val?.meaning ?? "";
                    return (
                    <div key={idx} className="flex flex-col gap-1.5 mb-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground">{key.replace(/_/g, ' ').toUpperCase()}</span>
                        <span className="font-bold text-cyan-400">{String(score)}%</span>
                      </div>
                      {meaning && (
                        <p className="text-[10px] text-muted-foreground italic mb-1">{meaning}</p>
                      )}
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-cyan-400 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${Number(score)}%` }} 
                        />
                      </div>
                    </div>
                  )})}
                </div>

              </div>
            )}
          </div>
        </div>
      ) : activeWorkspaceTab === "flashcard_canvas" ? (
        <div className="flex-1 h-full overflow-hidden p-4">
          <div className="h-full rounded-xl border border-border overflow-hidden">
            <FlashcardDeckMock 
              toggle={() => setActiveWorkspaceTab("mind_map")} 
              topic={activeLearningContext || persona?.subtitle || persona?.title || persona?.subject || "Software Engineering"} 
              videoId={videoId} 
              playerRef={playerRef} 
            />
          </div>
        </div>
      ) : activeWorkspaceTab === "canvas" ? (
        <InteractiveCanvas 
          toggle={() => setActiveWorkspaceTab("video")} 
          topic={activeLearningContext || persona?.subtitle || persona?.title || persona?.subject || "Software Engineering"} 
          videoId={videoId} 
          playerRef={playerRef} 
        />
      ) : activeWorkspaceTab === "mind_map" ? (
        <div className="flex-1 h-full overflow-hidden p-4">
          <div className="h-full rounded-xl border border-border overflow-hidden">
            <CanvasMock 
              toggle={() => setActiveWorkspaceTab("flashcard_canvas")} 
              topic={activeLearningContext || persona?.subtitle || persona?.title || persona?.subject || "Software Engineering"} 
            />
          </div>
        </div>
      ) : activeWorkspaceTab === "roadmap" ? (
        <div className="flex-1 h-full overflow-y-auto p-6 max-w-5xl mx-auto w-full">
          <RoadmapExplorer 
            roadmap={roadmap} 
            onSelectActivity={(topicTitle, activityType) => handleSelectActivity(topicTitle, activityType)} 
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
          <Layers className="w-10 h-10 mb-3 opacity-40 text-accent-primary" />
          <p className="text-sm font-semibold">Select a tab from the top bar to inspect curriculum components.</p>
        </div>
      )}
    </div>
  );
}

// --- MOCK COMPONENTS ---

function VideoPlayer({ 
  videoId, 
  videoTitle,
  isLoading,
  onReady,
  onEnded
}: { 
  videoId: string; 
  videoTitle?: string;
  isLoading?: boolean;
  onReady: (e: any) => void;
  onEnded?: () => void;
}) {
  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className="w-full h-full relative bg-black flex flex-col items-center justify-center group overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center gap-3 text-cyan-400 backdrop-blur-xs">
          <Sparkles className="w-6 h-6 animate-pulse" />
          <span className="text-xs font-semibold text-foreground">Searching YouTube Lecture...</span>
        </div>
      )}
      {videoId ? (
        <YouTube 
          videoId={videoId} 
          opts={opts} 
          onReady={onReady} 
          onEnd={onEnded}
          className="w-full h-full absolute inset-0"
          iframeClassName="w-full h-full"
        />
      ) : (
        !isLoading && (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm gap-3 z-10">
            <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-muted-foreground shadow-sm">
              <Play className="w-5 h-5 ml-0.5 text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No Video Loaded</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Click any video topic in the <span className="text-cyan-400 font-medium">Roadmap</span> to stream the lecture tutorial.
            </p>
          </div>
        )
      )}
    </div>
  );
}

function CanvasMock({ toggle, topic }: { toggle: () => void; topic?: string }) {
  const [mindmap, setMindmap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeNode, setActiveNode] = useState<any>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, {cx: number, cy: number}>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current || !mindmap?.nodes) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPos: Record<string, {cx: number, cy: number}> = {};
      mindmap.nodes.forEach((n: any) => {
        const el = document.getElementById(`node-${n.id}`);
        if (el) {
          const elRect = el.getBoundingClientRect();
          newPos[n.id] = {
            cx: elRect.left - rect.left + elRect.width / 2 + containerRef.current!.scrollLeft,
            cy: elRect.top - rect.top + elRect.height / 2 + containerRef.current!.scrollTop,
          };
        }
      });
      setNodePositions(newPos);
    };
    
    // Update after rendering
    setTimeout(updatePositions, 100);
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [mindmap, activeNode]);

  useEffect(() => {
    if (!topic) return;
    const fetchMindmap = async () => {
      setIsLoading(true);
      try {
        const res = await ApiClient.post('/mindmap/generate', { subject: topic });
        if (res && res.nodes) {
          setMindmap(res);
        }
      } catch (err) {
        console.error("Failed to generate mindmap:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMindmap();
  }, [topic]);

  // Group nodes by tier for structured DAG flowchart layout
  const nodesByTier: Record<number, any[]> = {};
  if (mindmap?.nodes) {
    mindmap.nodes.forEach((n: any) => {
      const t = n.tier ?? 0;
      if (!nodesByTier[t]) nodesByTier[t] = [];
      nodesByTier[t].push(n);
    });
  }

  const tiers = Object.keys(nodesByTier).map(Number).sort((a, b) => a - b);

  return (
    <div className="w-full h-full bg-canvas relative flex flex-col overflow-hidden" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button onClick={toggle} className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-bold hover:bg-white/5 flex items-center gap-2 shadow">
          <FoldVertical className="w-3.5 h-3.5" /> View Flashcards
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-accent-primary">
          <Sparkles className="w-8 h-8 animate-pulse" />
          <span className="text-sm font-bold">Generating Mindmap DAG for {topic}...</span>
        </div>
      ) : !mindmap || !mindmap.nodes || mindmap.nodes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
          <Waypoints className="w-10 h-10 mb-3 opacity-50" />
          <p className="text-sm">Select a topic or interview concept to render its interactive mindmap graph.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-6 relative flex" ref={containerRef}>
          <div className="flex-1 relative min-w-max">
            {/* SVG Connections Layer */}
            {mindmap.edges && mindmap.edges.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ minWidth: '100%', minHeight: '100%' }}>
                {mindmap.edges.map((edge: any, idx: number) => {
                  const sourcePos = nodePositions[edge.source];
                  const targetPos = nodePositions[edge.target];
                  if (!sourcePos || !targetPos) return null;
                  
                  // Curved path
                  const mx = (sourcePos.cx + targetPos.cx) / 2;
                  const path = `M ${sourcePos.cx} ${sourcePos.cy} C ${mx} ${sourcePos.cy}, ${mx} ${targetPos.cy}, ${targetPos.cx} ${targetPos.cy}`;
                  
                  return (
                    <path
                      key={idx}
                      d={path}
                      fill="none"
                      stroke={activeNode && (activeNode.id === edge.source || activeNode.id === edge.target) ? "#ffd43b" : "rgba(255,255,255,0.15)"}
                      strokeWidth={activeNode && (activeNode.id === edge.source || activeNode.id === edge.target) ? 3 : 2}
                      strokeDasharray={edge.isDashed ? "5,5" : "0"}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
            )}

            <div className="mb-4 relative z-10">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Waypoints className="w-4 h-4 text-accent-primary" />
                {mindmap.subjectTitle || topic}
              </h3>
              <p className="text-xs text-muted-foreground">Interactive Knowledge Graph DAG • {mindmap.nodes.length} Concept Nodes</p>
            </div>

            <div className="flex flex-row gap-12 min-w-max items-start py-4 relative z-10">
              {tiers.map((tierNum) => (
                <div key={tierNum} className="flex flex-col gap-4 w-56 shrink-0">
                <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground border-b border-border/40 pb-1">
                  Tier {tierNum}
                </div>
                {nodesByTier[tierNum].map((node: any) => {
                  const isSelected = activeNode?.id === node.id;
                  const typeColors: Record<string, string> = {
                    section: "border-accent-emerald bg-accent-emerald/10 text-accent-emerald",
                    topic: "border-accent-primary bg-accent-primary/10 text-accent-primary",
                    subtopic: "border-border bg-surface text-foreground",
                    quiz: "border-accent-rose bg-accent-rose/10 text-accent-rose",
                    project: "border-amber-500 bg-amber-500/10 text-amber-500"
                  };
                  const badgeClass = typeColors[node.type] || typeColors.topic;

                  return (
                    <div
                      key={node.id}
                      id={`node-${node.id}`}
                      onClick={() => setActiveNode(node)}
                      className={cn(
                        "p-3.5 rounded-xl border-2 bg-surface cursor-pointer shadow-md transition-all hover:scale-[1.02]",
                        isSelected ? "border-accent-primary ring-2 ring-accent-primary/20" : "border-border/70 hover:border-border"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border", badgeClass)}>
                          {node.type}
                        </span>
                        {node.estimatedHours && (
                          <span className="text-[10px] text-muted-foreground font-mono">{node.estimatedHours}h</span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-foreground line-clamp-2">{node.label}</h4>
                      {node.description && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{node.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            </div>
          </div>
          
          {/* Active Node Details Panel */}
          {activeNode && (
            <div className="w-80 ml-6 shrink-0 bg-surface border border-border rounded-xl shadow-lg p-5 flex flex-col sticky top-0 h-max">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-foreground">{activeNode.label}</h3>
                <button onClick={() => setActiveNode(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-accent-primary bg-accent-primary/10 text-accent-primary">
                  {activeNode.type}
                </span>
                {activeNode.estimatedHours && (
                  <span className="text-xs text-muted-foreground font-mono bg-canvas px-2 py-0.5 rounded border border-border">
                    {activeNode.estimatedHours}h
                  </span>
                )}
              </div>

              {activeNode.description && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Description</h4>
                  <p className="text-sm text-foreground leading-relaxed">{activeNode.description}</p>
                </div>
              )}
              
              <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-border">
                {activeNode.activityType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Activity:</span>
                    <span className="font-medium text-foreground">{activeNode.activityType}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-emerald-400">Ready</span>
                </div>
                <button className="w-full mt-4 bg-accent-primary text-black font-bold py-2 rounded-lg hover:opacity-90 transition-opacity">
                  Start Learning
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FlashcardDeckMock({ toggle, topic, videoId, playerRef }: { toggle: () => void, topic?: string, videoId?: string, playerRef?: any }) {
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  React.useEffect(() => {
    if (!topic) return;
    const fetchFlashcards = async () => {
      setIsGenerating(true);
      setIsFlipped(false);
      try {
        let currentTime = undefined;
        if (playerRef) {
          try {
            currentTime = await playerRef.getCurrentTime();
          } catch (e) {}
        }
        
        const response = await ApiClient.post('/orchestration/flashcards', {
          topic: topic,
          count: 5,
          video_id: videoId,
          video_timestamp: currentTime ? Math.round(currentTime) : undefined
        });
        if (response && response.flashcards && Array.isArray(response.flashcards)) {
          setFlashcards(response.flashcards);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.error("Failed to fetch flashcards:", err);
      } finally {
        setIsGenerating(false);
      }
    };
    fetchFlashcards();
  }, [topic]);

  const currentCard = flashcards[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  return (
    <div className="w-full h-full bg-surface relative flex flex-col items-center justify-center p-8">
      <button onClick={toggle} className="absolute top-4 right-4 px-3 py-1.5 bg-canvas border border-border rounded-lg text-xs font-bold hover:bg-white/5 flex items-center gap-2 z-20 shadow">
        <LayoutGrid className="w-3.5 h-3.5" /> View Mindmap
      </button>

      {isGenerating ? (
        <div className="flex flex-col items-center gap-2 text-accent-primary">
          <Sparkles className="w-8 h-8 animate-pulse" />
          <span className="text-sm font-bold">Generating Flashcards...</span>
        </div>
      ) : flashcards.length === 0 ? (
        <div className="flex flex-col items-center text-muted-foreground max-w-sm text-center">
          <Sparkles className="w-8 h-8 mb-4 opacity-50" />
          <p className="text-sm">No flashcards generated yet for "{topic}".</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full max-w-[420px]">
          <div className="text-xs font-mono text-muted-foreground">
            Card {currentIndex + 1} of {flashcards.length} • Click card to flip
          </div>

          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative w-full h-[240px] cursor-pointer group"
          >
            {/* Stack layers background */}
            <div className="absolute inset-0 translate-y-3 scale-95 bg-elevated rounded-2xl border border-border/50 shadow" />
            <div className="absolute inset-0 translate-y-1.5 scale-[0.98] bg-elevated rounded-2xl border border-border shadow" />
            
            {/* Card Content */}
            <div 
              className={cn(
                "absolute inset-0 bg-canvas rounded-2xl border-2 border-border shadow-xl flex flex-col p-6 items-center justify-center text-center transition-all duration-300 hover:border-accent-primary",
                isFlipped ? "bg-accent-primary/5 border-accent-primary" : ""
              )}
            >
              <span className="text-accent-primary text-[10px] font-bold tracking-widest uppercase mb-3 px-2 py-0.5 bg-accent-primary/10 rounded-md">
                {isFlipped ? "Answer (Back)" : "Question (Front)"}
              </span>
              <h2 className="text-base font-semibold text-foreground px-4 leading-relaxed">
                {isFlipped ? currentCard?.back : currentCard?.front}
              </h2>
              <span className="text-[10px] text-muted-foreground mt-4 opacity-70">
                (Click card to reveal {isFlipped ? "front" : "back"})
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-2 z-30">
            <button 
              onClick={handlePrev}
              className="px-4 py-2 bg-canvas border border-border rounded-xl text-xs font-bold hover:bg-white/5 transition-colors"
            >
              Previous
            </button>
            <button 
              onClick={handleNext}
              className="px-4 py-2 bg-accent-primary text-black rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Next Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarAIMock({ 
  onPersonaGenerated, 
  playerRef, 
  videoId 
}: { 
  onPersonaGenerated?: (persona: any) => void,
  playerRef?: any,
  videoId?: string
}) {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string, type?: 'explain'}[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [historyStr, setHistoryStr] = useState("No prior history.");
  const [internalState, setInternalState] = useState<any>(null);

  const sendRequest = async (userMsg: string, isExplainer: boolean = false) => {
    if (isLoading) return;
    setMessages(prev => [...prev, { role: 'user', content: userMsg, type: isExplainer ? 'explain' : undefined }]);
    setIsLoading(true);
    setOptions([]);

    try {
      if (isExplainer && playerRef && videoId) {
        // AI Video Transcript Explainer Feature
        let currentTime = 0;
        try {
           currentTime = await playerRef.getCurrentTime();
           // Pause the video while AI explains
           playerRef.pauseVideo();
        } catch (e) { console.error("Could not get time", e); }

        const res = await ApiClient.post('/orchestration/canvas-explain', {
           video_id: videoId,
           video_timestamp: Math.round(currentTime),
           question: userMsg
        });
        setMessages(prev => [...prev, { role: 'assistant', content: res.explanation, type: 'explain' }]);
      } else {
        // Standard Interview Profile
        const res = await ApiClient.post('/orchestration/interview', { 
          message: userMsg,
          history: historyStr
        });
        setMessages(prev => [...prev, { role: 'assistant', content: res.replyToUser }]);
        setOptions(res.options || []);
        setInternalState(res.internalState);
        
        setHistoryStr(prev => `${prev}\nUser: ${userMsg}\nAtlas: ${res.replyToUser}`);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput("");
    sendRequest(msg);
  };

  const handleOptionClick = async (opt: string) => {
    if (opt.endsWith('➔') && internalState?.confidenceScore >= 80) {
      setIsLoading(true);
      setMessages(prev => [...prev, { role: 'user', content: opt }, { role: 'assistant', content: "Generating your personalized curriculum..." }]);
      setOptions([]);
      
      try {
        const personaRes = await ApiClient.post('/orchestration/interview/complete', internalState.currentInferredPersona);
        if (onPersonaGenerated) {
          onPersonaGenerated(personaRes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    } else {
      sendRequest(opt);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 p-4 flex flex-col pb-24 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Sparkles className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
            <h3 className="text-sm font-bold text-foreground">Atlas is Listening</h3>
            <p className="text-xs text-muted-foreground mt-1">This is an embedded instance of the Micro-Interview chat. Ask me anything.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "px-4 py-2 rounded-2xl max-w-[85%] text-[13px] leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-accent-primary text-black font-medium"
                    : "bg-surface border border-border text-foreground",
                  msg.type === 'explain' && msg.role === 'assistant' && "border-accent-emerald/50 bg-accent-emerald/5"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {!isLoading && options.length > 0 && (
              <div className="flex flex-col gap-2 w-full pl-2">
                {options.map((opt, i) => (
                  <button 
                    key={i}
                    onClick={() => handleOptionClick(opt)}
                    className={cn(
                      "self-start text-[12px] px-3 py-1.5 rounded-full border transition-colors font-medium max-w-[85%] text-left",
                      opt.endsWith('➔') 
                        ? "bg-accent-emerald/10 border-accent-emerald/50 text-accent-emerald hover:bg-accent-emerald hover:text-black"
                        : "bg-canvas border-border/50 text-muted-foreground hover:border-fg-accent hover:text-foreground"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="px-4 py-2 rounded-2xl bg-surface border border-border text-muted-foreground text-[13px]">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-sidebar border-t border-border/50">
        <div className="flex items-center gap-2 bg-surface border border-border/50 rounded-full px-4 py-2 focus-within:border-accent-primary transition-colors">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="w-4 h-4" />
          </button>
          <input 
            type="text" 
            placeholder="Ask Atlas (or about video)..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button 
            onClick={() => {
               if (!input.trim()) return;
               const msg = input.trim();
               setInput("");
               sendRequest(msg, true); // True = Explainer Mode
            }}
            disabled={isLoading || !input.trim()}
            title="Ask about current video timestamp"
            className="w-6 h-6 rounded-full bg-accent-emerald disabled:bg-surface disabled:text-muted-foreground flex items-center justify-center text-black shrink-0 transition-colors mr-1"
          >
            <PlayCircle className="w-3.5 h-3.5 font-bold" />
          </button>
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            title="Standard Interview"
            className="w-6 h-6 rounded-full bg-accent-primary disabled:bg-surface disabled:text-muted-foreground flex items-center justify-center text-black shrink-0 transition-colors"
          >
            <ArrowUp className="w-3.5 h-3.5 font-bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

// function SidebarRoadmapMock() { ... } // Replaced inline
