"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ApiClient } from "@/lib/api-client";
import { MOCK_WORKSPACES } from "@/lib/mock-data";

export interface WorkspaceItem {
  id: string;
  title: string;
  subject?: string;
  difficulty?: string;
  progress?: number;          // 0 to 100
  progressPercent?: number;   // 0.0 to 1.0
  activeLearningContext?: string;
  subtitle?: string;
  summary?: string;
  traits?: string[];
  metrics?: Record<string, number>;
  blueprintNodes?: any[];
  roadmap?: any[];
  mindmap?: any;
  flashcards?: any[];
  videoId?: string;
  videoTitle?: string;
  activeTabId?: string;
  lastOpened?: string;
  createdAt?: string;
  [key: string]: any;
}

interface WorkspaceContextType {
  workspaces: WorkspaceItem[];
  activeWorkspace: WorkspaceItem | null;
  activeWorkspaceId: string | null;
  isLoading: boolean;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  loadWorkspaces: () => Promise<WorkspaceItem[]>;
  selectWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (payload: Partial<WorkspaceItem>) => Promise<WorkspaceItem>;
  saveWorkspace: (payload: Partial<WorkspaceItem>) => Promise<WorkspaceItem | null>;
  updateProgress: (progressPercent: number) => Promise<void>;
  updateActiveContext: (topic: string, videoId?: string, videoTitle?: string) => Promise<void>;
  updateActiveTab: (tabId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  const loadWorkspaces = useCallback(async (): Promise<WorkspaceItem[]> => {
    try {
      setIsLoading(true);
      const data = await ApiClient.get<WorkspaceItem[]>("/workspaces");
      const list = Array.isArray(data) ? data : [];
      setWorkspaces(list);
      
      // If no active workspace is selected, restore from localStorage or default to latest
      if (typeof window !== "undefined") {
        const savedId = localStorage.getItem("atlas_active_workspace_id");
        if (savedId && list.some(w => w.id === savedId)) {
          setActiveWorkspaceId(savedId);
        } else if (list.length > 0) {
          setActiveWorkspaceId(list[0].id);
          localStorage.setItem("atlas_active_workspace_id", list[0].id);
        } else {
          setActiveWorkspaceId(null);
        }
      }
      return list;
    } catch (err) {
      console.warn("Failed to load workspaces from backend:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const activeWorkspace = React.useMemo(() => {
    if (!activeWorkspaceId || workspaces.length === 0) return workspaces[0] || null;
    return workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || null;
  }, [activeWorkspaceId, workspaces]);

  const selectWorkspace = useCallback(async (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    if (typeof window !== "undefined") {
      localStorage.setItem("atlas_active_workspace_id", workspaceId);
    }

    const target = workspaces.find((w) => w.id === workspaceId);
    if (target) {
      // Synchronize localStorage context tokens for child components
      if (typeof window !== "undefined") {
        if (target.activeLearningContext) {
          localStorage.setItem("atlas_active_context", target.activeLearningContext);
        }
        localStorage.setItem("atlas_persona", JSON.stringify(target));
      }

      // Touch lastOpened on backend
      try {
        await ApiClient.put(`/workspaces/${workspaceId}`, {
          data: {
            ...target,
            lastOpened: new Date().toISOString(),
          }
        });
      } catch (e) {
        console.warn("Could not touch workspace timestamp:", e);
      }
    }
  }, [workspaces]);

  const createWorkspace = useCallback(async (payload: Partial<WorkspaceItem>): Promise<WorkspaceItem> => {
    const wsId = payload.id || `ws_${Date.now()}`;
    const newWs: WorkspaceItem = {
      id: wsId,
      title: payload.title || "New Workspace",
      subject: payload.subject || "General",
      difficulty: payload.difficulty || "Intermediate",
      progress: payload.progress || 0,
      progressPercent: payload.progressPercent || 0.0,
      activeLearningContext: payload.activeLearningContext || "Foundations",
      lastOpened: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      activeTabId: payload.activeTabId || "lab",
      ...payload,
    };

    try {
      const res = await ApiClient.post<WorkspaceItem>("/workspaces", {
        id: wsId,
        title: newWs.title,
        data: newWs,
      });
      const created = res || newWs;
      setWorkspaces((prev) => [created, ...prev.filter((w) => w.id !== wsId)]);
      setActiveWorkspaceId(wsId);
      if (typeof window !== "undefined") {
        localStorage.setItem("atlas_active_workspace_id", wsId);
        localStorage.setItem("atlas_persona", JSON.stringify(created));
        if (created.activeLearningContext) {
          localStorage.setItem("atlas_active_context", created.activeLearningContext);
        }
      }
      return created;
    } catch (err) {
      console.warn("Error persisting workspace to DB, saving locally:", err);
      setWorkspaces((prev) => [newWs, ...prev.filter((w) => w.id !== wsId)]);
      setActiveWorkspaceId(wsId);
      return newWs;
    }
  }, []);

  const saveWorkspace = useCallback(async (payload: Partial<WorkspaceItem>): Promise<WorkspaceItem | null> => {
    const targetId = payload.id || activeWorkspaceId;
    if (!targetId) return null;

    const existing = workspaces.find((w) => w.id === targetId);
    const updated: WorkspaceItem = {
      ...(existing || {}),
      ...payload,
      id: targetId,
      title: payload.title || existing?.title || "Workspace",
      lastOpened: new Date().toISOString(),
    };

    setWorkspaces((prev) =>
      prev.map((w) => (w.id === targetId ? updated : w))
    );

    try {
      await ApiClient.put(`/workspaces/${targetId}`, {
        title: updated.title,
        data: updated,
      });
    } catch (err) {
      console.warn("Failed to auto-save workspace to DB:", err);
    }

    return updated;
  }, [activeWorkspaceId, workspaces]);

  const updateProgress = useCallback(async (progressPercent: number) => {
    if (!activeWorkspaceId) return;
    const clampedPct = Math.min(Math.max(progressPercent, 0.0), 1.0);
    const progressInt = Math.round(clampedPct * 100);

    await saveWorkspace({
      id: activeWorkspaceId,
      progressPercent: clampedPct,
      progress: progressInt,
    });
  }, [activeWorkspaceId, saveWorkspace]);

  const updateActiveContext = useCallback(async (topic: string, videoId?: string, videoTitle?: string) => {
    if (!activeWorkspaceId) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("atlas_active_context", topic);
    }
    await saveWorkspace({
      id: activeWorkspaceId,
      activeLearningContext: topic,
      ...(videoId ? { videoId } : {}),
      ...(videoTitle ? { videoTitle } : {}),
    });
  }, [activeWorkspaceId, saveWorkspace]);

  const updateActiveTab = useCallback(async (tabId: string) => {
    if (!activeWorkspaceId) return;
    await saveWorkspace({
      id: activeWorkspaceId,
      activeTabId: tabId,
    });
  }, [activeWorkspaceId, saveWorkspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        isLoading,
        isPanelOpen,
        setIsPanelOpen,
        loadWorkspaces,
        selectWorkspace,
        createWorkspace,
        saveWorkspace,
        updateProgress,
        updateActiveContext,
        updateActiveTab,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
