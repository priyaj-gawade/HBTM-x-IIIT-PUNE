import React from "react";
import { cn } from "@/lib/utils";
import { CourseCatalogEntry } from "@/lib/mock-data";
import { Clock, Tag } from "lucide-react";

interface CourseCardProps {
  course: CourseCatalogEntry;
  onClick: () => void;
}

export function CourseCard({ course, onClick }: CourseCardProps) {
  return (
    <div 
      onClick={onClick}
      className="group flex flex-col rounded-xl overflow-hidden border border-border/50 bg-surface cursor-pointer hover:border-accent-primary transition-all shadow-sm hover:shadow-md"
    >
      {/* Mock Thumbnail / Gradient Header */}
      <div className="h-32 w-full bg-gradient-to-br from-sidebar to-canvas relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-primary to-transparent" />
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-bold text-white">{course.estimatedHours}h</span>
        </div>
      </div>

      <div className="p-4 md:p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-accent-primary">
            {course.category}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground">•</span>
          <span className={cn(
            "text-[10px] uppercase tracking-wider font-bold",
            course.difficulty === 'Beginner' && "text-accent-emerald",
            course.difficulty === 'Intermediate' && "text-blue-400",
            course.difficulty === 'Expert' && "text-purple-400",
            course.difficulty === 'Hard' && "text-orange-400",
          )}>
            {course.difficulty}
          </span>
        </div>

        <h3 className="text-sm md:text-base font-bold text-foreground mb-3 line-clamp-2 group-hover:text-accent-primary transition-colors">
          {course.title}
        </h3>

        <div className="mt-auto flex items-center gap-2 flex-wrap">
          {course.tags.slice(0, 3).map(tag => (
            <div key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-canvas border border-border/50 text-[10px] text-muted-foreground">
              <Tag className="w-2.5 h-2.5 opacity-50" />
              {tag}
            </div>
          ))}
          {course.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{course.tags.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
}
