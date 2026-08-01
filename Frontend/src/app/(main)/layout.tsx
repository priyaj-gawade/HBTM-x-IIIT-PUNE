import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { WorkspaceProvider } from "@/lib/workspace-context";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen bg-[#0D0D0D] text-[#ECECEC] font-sans">
        <Sidebar />
        <main className="flex-1 relative overflow-hidden">
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}

