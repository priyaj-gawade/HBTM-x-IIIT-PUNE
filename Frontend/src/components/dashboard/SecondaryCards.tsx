import React from "react";
import { AlertCircle, Code, History, PlayCircle, CheckCircle, Circle, ArrowRight } from "lucide-react";

export function NeedsAttentionCard({ insights = [] }: { insights?: any[] }) {
  const defaultItems = [
    { title: "Module Quiz Pending", subtitle: "Data Science Basics", type: "warning", icon: AlertCircle, color: "text-[#F59E0B]" },
    { title: "Review Suggested", subtitle: "Pandas DataFrames", type: "history", icon: History, color: "text-[#878787]" }
  ];

  const displayItems = insights.length > 0 ? insights.map((insight, idx) => ({
    title: insight.category === "warning" ? "Needs Attention" : "Insight",
    subtitle: insight.text,
    type: insight.category,
    icon: insight.category === "warning" ? AlertCircle : CheckCircle,
    color: insight.category === "warning" ? "text-[#F59E0B]" : "text-[#10B981]"
  })) : defaultItems;

  return (
    <div className="bg-card rounded-2xl p-8 h-full border-none flex flex-col">
      <h2 className="font-display text-xl font-bold text-foreground mb-8">
        Needs Attention
      </h2>
      <div className="flex flex-col gap-6 mt-auto">
        {displayItems.slice(0, 3).map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-4">
              <Icon className={`w-6 h-6 ${item.color}`} />
              <div className="flex-1">
                <h3 className="font-sans text-base font-bold text-foreground">{item.title}</h3>
                <p className="font-sans text-sm text-muted-foreground">{item.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RoadmapPreviewCard({ progress }: { progress?: any }) {
  // If progress is provided from the backend, we can dynamically build the nodes. 
  // For now, if no progress nodes are passed, use the fallback.
  const nodes = progress?.nodes || [
    { title: "Python Basics", status: "completed", icon: CheckCircle, color: "text-[#10B981]" },
    { title: "Data Analysis", status: "active", icon: PlayCircle, color: "text-ring" },
    { title: "Machine Learning", status: "locked", icon: Circle, color: "text-[#6B6B6B]" },
  ];

  return (
    <div className="bg-card rounded-2xl p-8 h-full border-none flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-display text-xl font-bold text-foreground">Learning Roadmap</h2>
        <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-lg transition-colors group">
          <span className="font-sans text-[13px] font-bold text-ring">Open Full Roadmap</span>
          <ArrowRight className="w-4 h-4 text-ring group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="h-[90px] flex items-start overflow-x-auto mt-auto no-scrollbar">
        {nodes.map((node: any, idx: number) => {
          const Icon = node.icon || Circle;
          return (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center min-w-[80px] max-w-[120px]">
                <Icon className={`w-8 h-8 ${node.color} mb-2`} />
                <span className={`font-sans text-[13px] text-center ${node.status === 'active' ? 'font-bold text-foreground' : node.status === 'locked' ? 'text-[#6B6B6B]' : 'text-foreground'}`}>
                  {node.title}
                </span>
              </div>
              {idx < nodes.length - 1 && (
                <div className="w-8 h-[2px] bg-[#333333] mt-4 mx-2" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
