import React from "react";

export function GreetingHeroCard({ userName = "User" }: { userName?: string }) {
  return (
    <div className="relative bg-card rounded-2xl px-6 py-4 flex flex-row items-stretch overflow-hidden">
      
      {/* Background radial gradient simulating GreetingBackgroundPainter */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-[17%] -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/15 blur-[64px]" />
        
        {/* Simulating the random particle dots */}
        <div className="absolute w-1 h-1 rounded-full bg-foreground/10 top-[20%] left-[10%]" />
        <div className="absolute w-1 h-1 rounded-full bg-foreground/10 top-[60%] left-[25%]" />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-foreground/10 top-[40%] left-[5%]" />
        <div className="absolute w-1 h-1 rounded-full bg-foreground/10 top-[80%] left-[15%]" />
      </div>

      {/* Mascot Section (35%) */}
      <div className="w-[35%] h-[120px] flex items-end justify-center gap-2 relative z-10">
        <div className="w-[80px] h-[80px] bg-secondary rounded-[40px] cursor-pointer hover:scale-105 transition-transform" title="Companion" />
        <div className="w-[100px] h-[100px] bg-secondary rounded-[50px] cursor-pointer hover:scale-105 transition-transform" title="Mentor" />
      </div>

      <div className="w-6" />

      {/* Greeting Section (65%) */}
      <div className="w-[65%] flex flex-col justify-center relative z-10">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Good Evening, {userName}
        </h1>
        <div className="h-2" />
        <p className="font-sans text-sm text-muted-foreground leading-relaxed">
          You've completed 3 modules today. Ready for the next challenge?
        </p>
      </div>

    </div>
  );
}
