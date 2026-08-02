"use client";

import React, { useRef, useState, useEffect, MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { ApiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowLeft, Send, BrainCircuit, MessageSquare, MousePointer2, Pen, Eraser, Undo2, Redo2, Trash2 } from "lucide-react";

type Point = { x: number; y: number };
type DrawingPath = { points: Point[]; color: string; width: number };
type DrawMode = 'select' | 'pen' | 'eraser';

export function InteractiveCanvas({ toggle, videoId, topic, playerRef }: { toggle: () => void, videoId?: string, topic?: string, playerRef?: any }) {
  // Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [drawMode, setDrawMode] = useState<DrawMode>('select');
  const [penColor, setPenColor] = useState<string>('#3b82f6'); // blue
  const [penWidth, setPenWidth] = useState<number>(3);
  const [penOpacity, setPenOpacity] = useState<number>(1.0);
  const [eraserRadius, setEraserRadius] = useState<number>(16);
  
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [undoStack, setUndoStack] = useState<DrawingPath[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Viewport State (Zoom/Pan)
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef<Point | null>(null);

  // Chat State
  const [messages, setMessages] = useState<{ role: 'user' | 'ai' | 'system' | 'error', content: string }[]>([
    { role: 'system', content: 'Connected to AI Tutor Backend. Ask a doubt to visualize!' }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#a855f7', '#ffffff'];

  // --- Render Loop ---
  useEffect(() => {
    renderCanvas();
  }, [paths, currentStroke, scale, offset]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        renderCanvas();
      }
    };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCanvasPoint = (e: ReactMouseEvent | globalThis.MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale
    };
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const renderCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;

    // Clear background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw Grid
    const invScale = 1 / scale;
    const startX = -offset.x * invScale;
    const startY = -offset.y * invScale;
    const endX = startX + w * invScale;
    const endY = startY + h * invScale;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1 * invScale;
    const step = 40;
    
    ctx.beginPath();
    for (let x = Math.floor(startX / step) * step; x < endX; x += step) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = Math.floor(startY / step) * step; y < endY; y += step) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Draw saved paths
    paths.forEach(path => {
      if (path.points.length === 0) return;
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    });

    // Draw current stroke
    if (currentStroke.length > 0 && drawMode === 'pen') {
      ctx.strokeStyle = hexToRgba(penColor, penOpacity);
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
    }
    
    ctx.restore();
  };

  // --- Interaction Handlers ---
  const handlePointerDown = (e: ReactMouseEvent) => {
    if (drawMode === 'select') {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    
    const pt = getCanvasPoint(e);
    if (drawMode === 'pen') {
      setIsDrawing(true);
      setCurrentStroke([pt]);
      setUndoStack([]);
    } else if (drawMode === 'eraser') {
      setIsDrawing(true);
      eraseAtPoint(pt);
    }
  };

  const handlePointerMove = (e: ReactMouseEvent) => {
    if (isPanning && lastMousePos.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isDrawing) return;
    const pt = getCanvasPoint(e);

    if (drawMode === 'pen') {
      setCurrentStroke(prev => [...prev, pt]);
    } else if (drawMode === 'eraser') {
      eraseAtPoint(pt);
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      lastMousePos.current = null;
      return;
    }

    if (isDrawing && drawMode === 'pen' && currentStroke.length > 0) {
      setPaths(prev => [...prev, {
        points: currentStroke,
        color: hexToRgba(penColor, penOpacity),
        width: penWidth
      }]);
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const newScale = Math.min(Math.max(0.2, scale - e.deltaY * zoomSensitivity), 5);
      
      // Zoom towards mouse pointer
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        const sx = (mx - offset.x) / scale;
        const sy = (my - offset.y) / scale;
        
        setOffset({
          x: mx - sx * newScale,
          y: my - sy * newScale
        });
      }
      setScale(newScale);
    } else {
      // Pan
      setOffset(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const eraseAtPoint = (pt: Point) => {
    setPaths(prev => {
      const remaining: DrawingPath[] = [];
      const erased: DrawingPath[] = [];
      
      prev.forEach(path => {
        let hit = false;
        for (const p of path.points) {
          const dist = Math.sqrt(Math.pow(p.x - pt.x, 2) + Math.pow(p.y - pt.y, 2));
          if (dist <= eraserRadius / scale) {
            hit = true;
            break;
          }
        }
        if (hit) erased.push(path);
        else remaining.push(path);
      });
      
      if (erased.length > 0) {
        setUndoStack(u => [...u, ...erased]);
      }
      return remaining;
    });
  };

  const handleUndo = () => {
    if (paths.length === 0) return;
    setPaths(prev => {
      const newPaths = [...prev];
      const last = newPaths.pop();
      if (last) setUndoStack(u => [...u, last]);
      return newPaths;
    });
  };

  const handleRedo = () => {
    if (undoStack.length === 0) return;
    setUndoStack(prev => {
      const newStack = [...prev];
      const next = newStack.pop();
      if (next) setPaths(p => [...p, next]);
      return newStack;
    });
  };

  const handleClear = () => {
    if (paths.length > 0) {
      setUndoStack(prev => [...prev, ...paths.reverse()]);
      setPaths([]);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paths, undoStack]);

  // --- AI Chat Handlers ---
  const handleAsk = async (e?: React.FormEvent, presetInput?: string) => {
    if (e) e.preventDefault();
    const doubt = presetInput || input.trim();
    if (!doubt) return;

    setMessages(prev => [...prev, { role: 'user', content: doubt }]);
    if (!presetInput) setInput("");
    setIsTyping(true);

    try {
      let currentTime = 0;
      if (playerRef?.current?.getCurrentTime) {
        try { currentTime = await playerRef.current.getCurrentTime(); } catch (err) {}
      }

      const response = await ApiClient.post('/orchestration/canvas-explain', {
        question: doubt,
        video_id: videoId || "unknown",
        video_timestamp: Math.round(currentTime),
        language: "English"
      });

      let text = response.explanation || JSON.stringify(response);
      setMessages(prev => [...prev, { role: 'ai', content: text }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'error', content: err.message || "Failed to get explanation" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-background">
      {/* Top Toolbar */}
      <div className="h-14 bg-surface border-b border-border flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={toggle} className="px-3 py-1.5 bg-canvas border border-border rounded-lg text-xs font-bold hover:bg-white/5 flex items-center gap-2 shadow text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Exit
          </button>
          
          <div className="w-px h-6 bg-border mx-2" />
          
          {/* Modes */}
          <div className="flex bg-canvas rounded-lg border border-border p-1 gap-1">
            <button onClick={() => setDrawMode('select')} className={cn("p-1.5 rounded-md", drawMode === 'select' ? "bg-accent-primary/20 text-accent-primary" : "text-muted-foreground hover:text-foreground")}>
              <MousePointer2 className="w-4 h-4" />
            </button>
            <button onClick={() => setDrawMode('pen')} className={cn("p-1.5 rounded-md", drawMode === 'pen' ? "bg-accent-primary/20 text-accent-primary" : "text-muted-foreground hover:text-foreground")}>
              <Pen className="w-4 h-4" />
            </button>
            <button onClick={() => setDrawMode('eraser')} className={cn("p-1.5 rounded-md", drawMode === 'eraser' ? "bg-accent-primary/20 text-accent-primary" : "text-muted-foreground hover:text-foreground")}>
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Context Tools (Colors / Eraser Size) */}
          {drawMode === 'pen' && (
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {colors.map(c => (
                  <button 
                    key={c}
                    onClick={() => setPenColor(c)}
                    className={cn("w-5 h-5 rounded-full border-2", penColor === c ? "border-white scale-110" : "border-border hover:scale-105")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="w-px h-4 bg-border mx-1" />
              <input type="range" min="1" max="20" value={penWidth} onChange={e => setPenWidth(Number(e.target.value))} className="w-20 accent-accent-primary" />
              <input type="range" min="0.1" max="1" step="0.1" value={penOpacity} onChange={e => setPenOpacity(Number(e.target.value))} className="w-20 accent-accent-emerald" />
            </div>
          )}
          {drawMode === 'eraser' && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Size</span>
              <input type="range" min="8" max="60" value={eraserRadius} onChange={e => setEraserRadius(Number(e.target.value))} className="w-24 accent-accent-rose" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={handleUndo} disabled={paths.length === 0} className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={handleRedo} disabled={undoStack.length === 0} className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30">
            <Redo2 className="w-4 h-4" />
          </button>
          <button onClick={handleClear} disabled={paths.length === 0} className="p-2 text-accent-rose/80 hover:text-accent-rose disabled:opacity-30 ml-2">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Canvas Area */}
        <div 
          className="flex-1 relative cursor-crosshair overflow-hidden" 
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ touchAction: 'none' }} />
        </div>

        {/* AI Chat Panel */}
        <div className="w-[340px] flex flex-col bg-surface border-l border-border shrink-0 z-10 shadow-xl">
          <div className="p-3 border-b border-border flex items-center gap-2 font-bold text-sm bg-canvas text-foreground">
            <BrainCircuit className="w-4 h-4 text-accent-primary" /> AI Tutor Chat
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-sm">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn(
                "p-3 rounded-xl max-w-[90%]",
                msg.role === 'user' ? "bg-accent-primary/20 border border-accent-primary/30 self-end text-accent-primary font-medium" : 
                msg.role === 'ai' ? "bg-canvas border border-border self-start text-foreground" :
                msg.role === 'error' ? "bg-accent-rose/10 border border-accent-rose/30 text-accent-rose self-center text-center text-xs" :
                "bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald self-center text-center text-xs"
              )}>
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div className="p-3 rounded-xl bg-canvas border border-border self-start text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse text-accent-primary" /> Thinking...
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border bg-canvas">
            <form onSubmit={handleAsk} className="flex items-center gap-2 relative mb-2">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about your drawing..."
                className="w-full bg-surface border border-border rounded-lg pl-3 pr-9 py-2 text-sm text-foreground focus:outline-none focus:border-accent-primary"
                disabled={isTyping}
              />
              <button type="submit" disabled={isTyping || !input.trim()} className="absolute right-1 p-1.5 text-accent-primary hover:bg-white/5 rounded-lg disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleAsk(undefined, "What does my diagram represent?")} className="text-[10px] px-2 py-1 bg-surface border border-border rounded-md hover:bg-white/5 text-muted-foreground font-semibold flex-1">Analyze Canvas</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
