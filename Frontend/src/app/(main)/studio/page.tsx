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
                    topic={activeLearningContext || persona?.subtitle || "Python Memory Management"} 
                    videoId={videoId} 
                    playerRef={playerRef} 
                  />
                ) : (
                  <CanvasMock toggle={() => setShowFlashcards(true)} />
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
                    topic={activeLearningContext || persona?.subtitle || "Python Memory Management"} 
                    videoId={videoId} 
                    playerRef={playerRef} 
                  />
                ) : (
                  <CanvasMock toggle={() => setShowFlashcards(true)} />
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
                          value: Number(val),
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
                  {Object.entries(persona.metrics).map(([key, val]: [string, any], idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground">{key.replace(/_/g, ' ').toUpperCase()}</span>
                        <span className="font-bold text-cyan-400">{String(val)}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-cyan-400 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${Number(val)}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>
      ) : activeWorkspaceTab === "mind_map" ? (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-400" />
                Knowledge Graph & Blueprint Nodes
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Interactive conceptual nodes generated for your custom track. Click any node to load its lecture into the Learning Lab.
              </p>
            </div>
            <button 
              onClick={() => setActiveWorkspaceTab("lab")}
              className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-bold transition"
            >
              Open Learning Lab ➔
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(persona?.blueprintNodes || (roadmap.length > 0 ? roadmap.flatMap(m => m.sections || []) : [
              { title: "Core Fundamentals", description: "Variables, syntax structures, and semantic primitives." },
              { title: "Object-Oriented Design", description: "Classes, abstraction, polymorphism, and composition." },
              { title: "Memory Architecture", description: "Pointers, reference counts, and garbage collection models." },
              { title: "Async Concurrency", description: "Event loops, coroutines, thread pools, and race conditions." },
              { title: "Data Pipelines", description: "Stream processing, vectorized queries, and persistence layers." },
              { title: "Applied Systems Design", description: "Distributed caching, RPC architectures, and latency optimization." }
            ])).map((node: any, idx: number) => {
              const nodeTitle = typeof node === "string" ? node : (node.title || node.name || `Concept #${idx+1}`);
              const nodeDesc = node.description || node.summary || "Interactive curriculum component with targeted multimedia lectures.";
              const isNodeActive = activeLearningContext.toLowerCase().includes(nodeTitle.toLowerCase());

              return (
                <div 
                  key={idx}
                  onClick={() => handleSelectActivity(nodeTitle, "Watch Video")}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all duration-200 group flex flex-col justify-between select-none",
                    isNodeActive 
                      ? "bg-[#1F2937]/50 border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]" 
                      : "bg-[#181818] border-border/60 hover:border-cyan-500/40 hover:bg-[#202020]"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/5">
                        Node #{idx + 1}
                      </span>
                      <PlayCircle className={cn("w-4 h-4 transition-transform group-hover:scale-110", isNodeActive ? "text-cyan-400" : "text-muted-foreground group-hover:text-cyan-400")} />
                    </div>
                    <h3 className={cn("text-sm font-bold transition-colors", isNodeActive ? "text-cyan-300" : "text-foreground group-hover:text-white")}>
                      {nodeTitle}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {nodeDesc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-cyan-400 font-semibold group-hover:underline">Launch Lecture</span>
                    <span className="text-muted-foreground">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p className="text-sm font-bold">This tab ({activeWorkspaceTab}) is active.</p>
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

function CanvasMock({ toggle }: { toggle: () => void }) {
  return (
    <div className="w-full h-full bg-canvas relative" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      <button onClick={toggle} className="absolute top-4 right-4 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-bold hover:bg-white/5 flex items-center gap-2">
        <FoldVertical className="w-3.5 h-3.5" /> View Flashcards
      </button>
      
      {/* Mock Nodes */}
      <div className="absolute top-20 left-20 bg-surface border-2 border-accent-rose rounded-xl p-4 w-48 shadow-lg">
        <h4 className="font-bold text-sm text-foreground">Singly Linked List</h4>
        <p className="text-xs text-muted-foreground mt-1">Each node points to the next.</p>
      </div>
      <div className="absolute top-48 left-64 bg-surface border-2 border-accent-emerald rounded-xl p-4 w-48 shadow-lg">
        <h4 className="font-bold text-sm text-foreground">Doubly Linked List</h4>
        <p className="text-xs text-muted-foreground mt-1">Nodes point to both next and prev.</p>
      </div>
      
      {/* Mock line connecting them */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full">
        <path d="M 272 138 C 300 138, 300 214, 336 214" fill="transparent" stroke="#333" strokeWidth="2" />
      </svg>
    </div>
  );
}

function FlashcardDeckMock({ toggle, topic, videoId, playerRef }: { toggle: () => void, topic?: string, videoId?: string, playerRef?: any }) {
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  React.useEffect(() => {
    if (!topic) return;
    const fetchFlashcards = async () => {
      setIsGenerating(true);
      try {
        let currentTime = undefined;
        if (playerRef) {
          try {
            currentTime = await playerRef.getCurrentTime();
          } catch (e) {}
        }
        
        const response = await ApiClient.post('/orchestration/flashcards', {
          topic: topic,
          count: 3,
          video_id: videoId,
          video_timestamp: currentTime ? Math.round(currentTime) : undefined
        });
        if (response.flashcards) {
          setFlashcards(response.flashcards);
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
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  return (
    <div className="w-full h-full bg-surface relative flex flex-col items-center justify-center p-8">
      <button onClick={toggle} className="absolute top-4 right-4 px-3 py-1.5 bg-canvas border border-border rounded-lg text-xs font-bold hover:bg-white/5 flex items-center gap-2 z-20">
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
          <p className="text-sm">Complete your Atlas interview to generate personalized flashcards for this topic.</p>
        </div>
      ) : (
        <div className="relative w-full max-w-[400px] h-[250px] group">
          {/* Stack effect */}
          <div className="absolute inset-0 translate-y-4 scale-90 bg-elevated rounded-2xl border border-border/50" />
          <div className="absolute inset-0 translate-y-2 scale-95 bg-elevated rounded-2xl border border-border" />
          <div 
            className="absolute inset-0 bg-canvas rounded-2xl border-2 border-border shadow-xl flex flex-col p-6 items-center justify-center text-center cursor-pointer hover:border-accent-primary transition-colors"
          >
            <span className="text-accent-primary text-xs font-bold tracking-widest uppercase mb-4">Front</span>
            <h2 className="text-xl font-bold text-foreground">{currentCard?.front}</h2>
            
            {/* The back of the card on hover */}
            <div className="absolute inset-0 bg-canvas rounded-2xl p-6 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-center transition-opacity duration-300">
               <span className="text-accent-primary text-xs font-bold tracking-widest uppercase mb-4">Back</span>
               <h2 className="text-sm font-medium text-muted-foreground">{currentCard?.back}</h2>
            </div>
            
            <button 
              onClick={handleNext}
              className="absolute bottom-4 right-4 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-bold hover:bg-white/5 z-30"
            >
              Next
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
