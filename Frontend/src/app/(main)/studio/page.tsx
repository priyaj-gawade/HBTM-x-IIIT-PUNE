"use client";

import React, { useState } from "react";
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
import { MOCK_ROADMAP, MOCK_FLASHCARDS, MOCK_PYTHON_ROADMAP } from "@/lib/mock-data";
import { RoadmapExplorer } from "./roadmap-explorer";

export default function StudioPage() {
  const [isScrollMode, setIsScrollMode] = useState(false);
  const [videoFraction, setVideoFraction] = useState(0.6); // 60% video, 40% canvas
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"ai" | "roadmap">("roadmap");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState("lab");
  const [roadmap, setRoadmap] = useState<any[]>(MOCK_PYTHON_ROADMAP);

  React.useEffect(() => {
    fetch("http://localhost:8000/api/v1/mindmap/00000000-0000-0000-0000-000000000000")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map((node: any) => ({
             id: node.id,
             title: node.title,
             description: node.description || "",
             sections: []
          }));
          setRoadmap(mapped);
        }
      })
      .catch(console.error);
  }, []);

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
        
        <div className="ml-3 px-2 py-1 rounded bg-accent-emerald/15 text-accent-emerald text-[11px] font-bold">
          Active: Linked Lists
        </div>

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
              <div className="h-[400px] sm:h-[50vh] rounded-xl border border-border overflow-hidden shrink-0">
                <VideoPlayerMock />
              </div>
              <div className="h-[550px] sm:h-[60vh] rounded-xl border border-border overflow-hidden shrink-0">
                {showFlashcards ? <FlashcardDeckMock toggle={() => setShowFlashcards(false)} /> : <CanvasMock toggle={() => setShowFlashcards(true)} />}
              </div>
            </div>
          ) : (
            // SPLIT MODE
            <div className="flex-1 flex flex-col p-4 h-full">
              <div 
                style={{ flex: videoFraction * 100 }} 
                className="rounded-xl border border-border overflow-hidden min-h-[150px]"
              >
                <VideoPlayerMock />
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
                {showFlashcards ? <FlashcardDeckMock toggle={() => setShowFlashcards(false)} /> : <CanvasMock toggle={() => setShowFlashcards(true)} />}
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
              Oreo AI
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
            {sidebarTab === "ai" ? <SidebarAIMock /> : <SidebarRoadmapMock roadmap={roadmap} />}
          </div>
        </div>
      </div>
          </>
      ) : activeWorkspaceTab === "roadmap" ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <RoadmapExplorer roadmap={roadmap} />
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

function VideoPlayerMock() {
  return (
    <div className="w-full h-full relative bg-black flex flex-col">
      <div className="absolute inset-0 flex items-center justify-center">
        <PlayCircle className="w-16 h-16 text-white/50 hover:text-white transition-colors cursor-pointer shadow-xl rounded-full" />
      </div>
      <div className="mt-auto bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center gap-4 text-white">
          <PlayCircle className="w-5 h-5 cursor-pointer" />
          <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer">
            <div className="w-[30%] h-full bg-accent-primary" />
          </div>
          <span className="text-xs font-mono">03:42 / 12:00</span>
          <Volume2 className="w-4 h-4 cursor-pointer" />
          <Settings className="w-4 h-4 cursor-pointer" />
          <Maximize2 className="w-4 h-4 cursor-pointer" />
        </div>
        <h3 className="text-sm font-bold text-white mt-3">Linked Lists: Insertion and Deletion Walkthrough</h3>
      </div>
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

function FlashcardDeckMock({ toggle }: { toggle: () => void }) {
  return (
    <div className="w-full h-full bg-surface relative flex flex-col items-center justify-center p-8">
      <button onClick={toggle} className="absolute top-4 right-4 px-3 py-1.5 bg-canvas border border-border rounded-lg text-xs font-bold hover:bg-white/5 flex items-center gap-2">
        <LayoutGrid className="w-3.5 h-3.5" /> View Mindmap
      </button>

      <div className="relative w-full max-w-[400px] h-[250px]">
        {/* Stack effect */}
        <div className="absolute inset-0 translate-y-4 scale-90 bg-elevated rounded-2xl border border-border/50" />
        <div className="absolute inset-0 translate-y-2 scale-95 bg-elevated rounded-2xl border border-border" />
        <div className="absolute inset-0 bg-canvas rounded-2xl border-2 border-border shadow-xl flex flex-col p-6 items-center justify-center text-center cursor-pointer hover:border-accent-primary transition-colors">
          <span className="text-accent-primary text-xs font-bold tracking-widest uppercase mb-4">Front</span>
          <h2 className="text-xl font-bold text-foreground">{MOCK_FLASHCARDS[0].front}</h2>
          <p className="text-xs text-muted-foreground mt-6">Tap to flip</p>
        </div>
      </div>
    </div>
  );
}

function SidebarAIMock() {
  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 p-4 flex flex-col items-center justify-center text-center pb-24">
        <Sparkles className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
        <h3 className="text-sm font-bold text-foreground">Oreo AI is Listening</h3>
        <p className="text-xs text-muted-foreground mt-1">This is an embedded instance of the Micro-Interview chat. Drag flashcards or canvas nodes here to ask questions about them.</p>
      </div>

      {/* Input Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-sidebar border-t border-border/50">
        <div className="flex items-center gap-2 bg-surface border border-border/50 rounded-full px-4 py-2">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="w-4 h-4" />
          </button>
          <input 
            type="text" 
            placeholder="Ask Oreo AI..." 
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button className="w-6 h-6 rounded-full bg-accent-primary flex items-center justify-center text-black shrink-0">
            <ArrowUp className="w-3.5 h-3.5 font-bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SidebarRoadmapMock({ roadmap }: { roadmap: any[] }) {
  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      <RoadmapExplorer roadmap={roadmap} />
    </div>
  );
}
