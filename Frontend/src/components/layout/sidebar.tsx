"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Radar, 
  ClipboardList, 
  Compass, 
  Box,
  Library,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_WORKSPACES } from "@/lib/mock-data";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: MessageSquare, label: "Interview", href: "/interview" },
  { icon: Radar, label: "Studio", href: "/studio" },
  { icon: ClipboardList, label: "Quizzes", href: "/quizzes" },
  { icon: Compass, label: "Hub", href: "/hub" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex z-50">
      {/* Left Vertical Activity Bar */}
      <div className="w-[56px] bg-[#141414] border-r border-[#333333] flex flex-col items-center py-4 relative z-20">
        
        {/* Brand Icon */}
        <div className="w-[34px] h-[34px] bg-[#2F2F2F] rounded-[10px] border border-[#333333] flex items-center justify-center mb-4">
          <span className="text-white">✨</span>
        </div>

        {/* Learning Spaces Explorer Icon */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-[44px] h-[44px] rounded-[10px] flex items-center justify-center mb-2 transition-colors",
            isOpen ? "bg-white/15 border border-white/40" : "hover:bg-[#2F2F2F] border border-transparent"
          )}
        >
          <Library className={cn("w-[22px] h-[22px]", isOpen ? "text-white" : "text-[#878787]")} />
        </button>
        
        <div className="w-8 h-[1px] bg-[#333333] mb-2" />

        {/* Nav Icons */}
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "relative w-[44px] h-[44px] my-1 rounded-[10px] flex items-center justify-center transition-colors group",
                isActive ? "bg-white/15 border border-white/40" : "hover:bg-[#2F2F2F] border border-transparent"
              )}
              title={item.label}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-white rounded-md shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
              )}
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-[#878787] group-hover:text-[#ECECEC]")} />
            </Link>
          );
        })}

        <div className="flex-1" />

        {/* Auto-save indicator */}
        <div className="flex items-center gap-1 mb-4" title="Auto-Save: OK">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span className="text-[10px] font-bold text-[#878787]">✓</span>
        </div>

        {/* Profile Avatar */}
        <Link href="/settings" className="w-[30px] h-[30px] rounded-full bg-[#D97706] flex items-center justify-center">
          <span className="text-white text-[11px] font-bold">PG</span>
        </Link>
      </div>

      {/* Slide-out Panel Overlay */}
      {isOpen && (
        <div className="w-[300px] h-full bg-[#171717] border-r border-[#333333] fixed left-[56px] top-0 bottom-0 z-10 shadow-2xl flex flex-col">
          
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h2 className="text-foreground font-bold text-sm font-display">Learning Spaces</h2>
            <button 
              className="w-6 h-6 rounded-md bg-transparent hover:bg-white/10 flex items-center justify-center transition-colors group"
              title="New Workspace"
            >
              <Plus className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {MOCK_WORKSPACES.map((workspace) => (
              <div 
                key={workspace.id}
                className="group flex flex-col p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-sans text-[11px] text-muted-foreground">{workspace.difficulty}</span>
                  <span className="font-sans text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {workspace.lastAccessed}
                  </span>
                </div>
                <h3 className="font-sans text-[13px] font-semibold text-foreground mb-1 group-hover:text-ring transition-colors">
                  {workspace.title}
                </h3>
                <div className="w-full bg-secondary h-[3px] rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-ring h-full transition-all"
                    style={{ width: `${workspace.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
