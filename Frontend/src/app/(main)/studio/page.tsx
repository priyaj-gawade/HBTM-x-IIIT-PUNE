"use client";

import React, { useState, useRef, useEffect } from "react";
import YouTube from "react-youtube";
import { cn } from "@/lib/utils";
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
  ArrowUp
} from "lucide-react";
import { RoadmapExplorer } from "./roadmap-explorer";
import { ApiClient } from "@/lib/api-client";
import { MOCK_PYTHON_ROADMAP, MOCK_FLASHCARDS } from "@/lib/mock-data";

export default function StudioPage() {
  const [isScrollMode, setIsScrollMode] = useState(false);
  const [videoFraction, setVideoFraction] = useState(0.6); // 60% video, 40% canvas
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"ai" | "roadmap">("roadmap");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState("lab");
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [persona, setPersona] = useState<any>(null);
  
  // Video Player & Learning Context
  const [playerRef, setPlayerRef] = useState<any>(null);
  const [videoId, setVideoId] = useState("pnWINBJ3-yA"); // Default Python OOP video
  const [videoTitle, setVideoTitle] = useState("Python Object Oriented Programming");
  const [activeLearningContext, setActiveLearningContext] = useState("Foundations");
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
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
  }, []);

  const handleSelectActivity = async (topicTitle: string, activityType: string = "Watch Video") => {
    if (!topicTitle) return;
    setActiveLearningContext(topicTitle);
    if (typeof window !== "undefined") {
      localStorage.setItem('atlas_active_context', topicTitle);
    }

    if (activityType === "Generate Flashcards") {
      setShowFlashcards(true);
    }

    setIsLoadingVideo(true);
    try {
      const contextStr = persona?.subtitle || persona?.title || "";
      const res = await ApiClient.get(`/search/videos?topic=${encodeURIComponent(topicTitle)}&context=${encodeURIComponent(contextStr)}`);
      if (Array.isArray(res) && res.length > 0) {
        setVideoId(res[0].id);
        setVideoTitle(res[0].title || topicTitle);
      }
    } catch (e) {
      console.error("Failed to search videos for topic:", e);
    } finally {
      setIsLoadingVideo(false);
    }

    // Switch to Learning Lab Workspace
    setActiveWorkspaceTab("lab");
  };

  const handlePersonaGenerated = async (newPersona: any) => {
    setPersona(newPersona);
    setSidebarTab("roadmap");
    const initialTopic = newPersona.subtitle || newPersona.title || "Python Basics";
    setActiveLearningContext(initialTopic);
    
    // Auto-search initial topic video
    handleSelectActivity(initialTopic, "Watch Video");

    // Generate Roadmap based on the new Persona Subject
    setIsGeneratingRoadmap(true);
    try {
      const response = await ApiClient.post('/roadmap/generate', {
        topic: initialTopic,
        target_role: "Learner",
        experience_level: "Beginner"
      });
      if (response && response.modules) {
        setRoadmap(response.modules);
      }
    } catch (err) {
      console.error("Failed to generate roadmap from persona:", err);
    } finally {
      setIsGeneratingRoadmap(false);
    }
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
              <div className="flex flex-col items-center gap-2 text-accent-primary">
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
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <Sparkles className="w-8 h-8 mb-4 opacity-50" />
              <p className="text-sm font-medium">Start an interview with Atlas to generate your customized learning roadmap.</p>
              <button 
                onClick={() => { setSidebarTab("ai"); setActiveWorkspaceTab("lab"); }}
                className="mt-4 px-4 py-2 bg-accent-primary text-black font-bold rounded-lg hover:bg-accent-primary/90 transition-colors"
              >
                Chat with Atlas
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p className="text-sm font-bold">This tab ({activeWorkspaceTab}) is currently under construction.</p>
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
  onReady 
}: { 
  videoId: string; 
  videoTitle?: string;
  isLoading?: boolean;
  onReady: (e: any) => void;
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
    <div className="w-full h-full relative bg-black flex flex-col group">
      {isLoading && (
        <div className="absolute inset-0 bg-black/75 z-20 flex flex-col items-center justify-center gap-2 text-accent-primary backdrop-blur-xs">
          <Sparkles className="w-6 h-6 animate-pulse" />
          <span className="text-xs font-bold">Loading YouTube Lecture...</span>
        </div>
      )}
      <YouTube 
        videoId={videoId} 
        opts={opts} 
        onReady={onReady} 
        className="w-full h-full absolute inset-0"
        iframeClassName="w-full h-full"
      />
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
