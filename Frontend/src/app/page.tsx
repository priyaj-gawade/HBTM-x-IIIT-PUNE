import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, BrainCircuit, Target, Lightbulb, Compass, BarChart } from 'lucide-react';

export default function AtlasLandingPage() {
  return (
    <div className="min-h-screen bg-canvas text-foreground selection:bg-white/20 font-sans">

      {/* 1. Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-panel">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-6 h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:rotate-90 transition-transform duration-500">
              <rect x="2" y="2" width="20" height="20" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
            <span className="font-semibold text-lg tracking-tight uppercase">ATLAS</span>
          </Link>
          <div className="hidden md:flex items-center gap-12 text-sm font-medium text-muted-foreground">
            <Link href="#platform" className="hover:text-foreground transition-colors">Platform</Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="#growth-journey" className="hover:text-foreground transition-colors">Growth Journey</Link>
            <Link href="#about" className="hover:text-foreground transition-colors">About</Link>
          </div>
          <div className="hidden md:block">
            <Link href="/login" className="font-mono text-xs uppercase tracking-wider border border-white/20 px-5 py-2.5 hover:bg-white hover:text-black transition-all duration-300">
              Start Your Journey
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 px-6 overflow-hidden">
        {/* CSS Radial Grid Background */}
        <div className="absolute inset-0 z-0 opacity-40"
          style={{ backgroundImage: 'radial-gradient(circle at center, #333 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-10">
            <div className="editorial-badge mb-8 text-accent-emerald">ATLAS // YOUR PERSONAL GROWTH ASSISTANT</div>
            <h1 className="text-h1">
              Become who<br />you're capable of.
            </h1>
          </div>
          <div className="lg:col-span-8 lg:col-start-1">
            <p className="text-body max-w-2xl mb-10 text-muted-foreground">
              Atlas understands your ambitions, learns from your journey, and curates the right knowledge, habits, and experiences to help you grow with purpose—not distraction.
            </p>
            <Link href="/login" className="btn-editorial group">
              Begin Your Journey
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Section 2: Why Atlas */}
      <section id="about" className="py-32 lg:py-48 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-32">
          <div className="lg:col-span-5">
            <div className="editorial-badge mb-6">WHY ATLAS</div>
            <h2 className="text-h3 leading-tight">
              An AI that grows<br />with you.
            </h2>
          </div>
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="border-l border-white/20 pl-8 lg:pl-12">
              <p className="text-body text-foreground mb-6">
                Atlas doesn't recommend content based on trends.
              </p>
              <p className="text-body">
                It understands your goals, learns from your reflections, and continuously adapts your journey to help you become who you want to be.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section 3: Three Feature Cards */}
      <section id="platform" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Mock Browser Window Glass Container */}
          <div className="border border-white/10 rounded-xl overflow-hidden bg-surface/30 backdrop-blur-md">
            <div className="h-12 border-b border-white/10 flex items-center px-6 gap-2 bg-white/5">
              <div className="w-3 h-3 rounded-full bg-accent-rose/80" />
              <div className="w-3 h-3 rounded-full bg-accent-amber/80" />
              <div className="w-3 h-3 rounded-full bg-accent-emerald/80" />
            </div>

            <div className="swiss-grid grid-cols-1 md:grid-cols-3">
              <div className="p-10 flex flex-col justify-between min-h-[320px] group">
                <BrainCircuit className="w-10 h-10 text-muted-foreground group-hover:text-foreground transition-colors mb-8" />
                <div>
                  <h3 className="text-xl font-medium mb-3">Identity Discovery</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Atlas begins by understanding your aspirations, motivations, habits, and learning style.
                  </p>
                </div>
              </div>
              <div className="p-10 flex flex-col justify-between min-h-[320px] group">
                <Compass className="w-10 h-10 text-muted-foreground group-hover:text-foreground transition-colors mb-8" />
                <div>
                  <h3 className="text-xl font-medium mb-3">Personal Blueprint</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A personalized roadmap built specifically around your strengths and future goals.
                  </p>
                </div>
              </div>
              <div className="p-10 flex flex-col justify-between min-h-[320px] group">
                <Target className="w-10 h-10 text-muted-foreground group-hover:text-foreground transition-colors mb-8" />
                <div>
                  <h3 className="text-xl font-medium mb-3">Daily Growth Pack</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Curated videos, books, podcasts, projects, and challenges delivered when they matter most.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section 4: The Journey Timeline */}
      <section id="how-it-works" className="py-32 lg:py-48 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-32">
          <div className="lg:col-span-5 lg:sticky top-40 h-fit">
            <div className="editorial-badge mb-6">HOW IT WORKS</div>
            <h2 className="text-h3 leading-tight mb-8">
              A personalized journey.<br />Not another feed.
            </h2>
          </div>
          <div className="lg:col-span-7 flex flex-col">
            {[
              { num: '01', title: 'Discover Yourself', desc: 'Deep, interactive reflection questions mapping your values, patterns, and ultimate life goals.' },
              { num: '02', title: 'AI Builds Your Blueprint', desc: 'We synthesize your identity into an actionable, step-by-step master plan for growth.' },
              { num: '03', title: 'Receive Daily Growth Packs', desc: 'Every day, get exactly what you need to progress—no more, no less.' },
              { num: '04', title: 'Reflect', desc: 'Log your thoughts, track your wins, and document your challenges.' },
              { num: '05', title: 'Atlas Evolves With You', desc: 'As you grow, your blueprint automatically calibrates to your new baseline.' }
            ].map((step, idx) => (
              <div key={idx} className={`flex flex-col gap-6 pt-10 pb-10 ${idx !== 0 ? 'border-t border-white/10' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-muted-foreground">{step.num} // STEP</span>
                  <span className="text-muted-foreground">↓</span>
                </div>
                <h3 className="text-2xl font-medium">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Section 5: Potential Bento Grid */}
      <section id="growth-journey" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-h2">Built around<br />your potential.</h2>
          </div>

          <div className="swiss-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="aspect-square p-10 flex flex-col justify-between group hover:bg-surface/50 transition-colors">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">01 // Discovery</span>
              <h3 className="text-2xl font-medium">AI Interview</h3>
            </div>

            <div className="aspect-square p-10 flex flex-col justify-between group hover:bg-surface/50 transition-colors">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">02 // Strategy</span>
              <h3 className="text-2xl font-medium">Growth Blueprint</h3>
            </div>

            <div className="bg-white text-black aspect-square p-10 flex flex-col justify-between relative overflow-hidden group">
              <span className="font-mono text-xs text-black/50 uppercase tracking-widest relative z-10">03 // Execution</span>
              <h3 className="text-2xl font-medium relative z-10">Mission Planning</h3>
              {/* Highlight accent */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-black/5 rounded-full blur-3xl group-hover:bg-black/10 transition-colors" />
            </div>

            <div className="md:col-span-2 md:aspect-[2/1] lg:aspect-auto p-10 flex flex-col justify-between group hover:bg-surface/50 transition-colors">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">04 // Insight</span>
              <h3 className="text-2xl font-medium">Reflection</h3>
            </div>

            <div className="aspect-square p-10 flex flex-col justify-between group hover:bg-surface/50 transition-colors">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">05 // Evolution</span>
              <h3 className="text-2xl font-medium">Continuous Adaptation</h3>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Section 6: The Difference Comparison */}
      <section className="py-32 lg:py-48 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="editorial-badge mb-16">THE DIFFERENCE</div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Legacy System */}
            <div className="p-12 lg:p-16 border border-white/10 relative overflow-hidden bg-black opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <div className="absolute inset-4 border border-white/10" />
              <h3 className="text-2xl font-medium mb-12 relative z-10">Traditional Algorithms</h3>
              <ul className="space-y-6 relative z-10 font-mono text-sm text-muted-foreground uppercase tracking-wide">
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-white/30" /> Optimize attention</li>
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-white/30" /> Infinite scrolling</li>
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-white/30" /> Generic recommendations</li>
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-white/30" /> Short-term engagement</li>
              </ul>
            </div>

            {/* Atlas System */}
            <div className="p-12 lg:p-16 bg-surface border border-white/10 relative overflow-hidden">
              <h3 className="text-2xl font-medium mb-12 relative z-10 text-white">Atlas</h3>
              <ul className="space-y-6 relative z-10 font-mono text-sm text-white uppercase tracking-wide">
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-accent-emerald" /> Optimizes growth</li>
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-accent-emerald" /> Purposeful learning</li>
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-accent-emerald" /> Personalized roadmap</li>
                <li className="flex items-center gap-4"><div className="w-1.5 h-1.5 bg-accent-emerald" /> Long-term transformation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Final CTA Section */}
      <section className="bg-white text-black py-32 lg:py-48 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <h2 className="text-h2 mb-6">The next version<br />of you starts today.</h2>
          <p className="text-lg lg:text-xl text-black/60 max-w-2xl mb-12">
            Every meaningful journey begins with understanding.<br />
            Start yours with Atlas.
          </p>
          <Link href="/login" className="bg-black text-white px-10 py-5 font-sans font-medium hover:bg-black/80 transition-colors flex items-center justify-center gap-3 group">
            Start Your Journey
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-black border-t border-white/10 pt-20 pb-10 px-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-20">
          <div className="md:col-span-4 flex flex-col gap-6">
            <Link href="/" className="text-white font-sans font-semibold text-lg tracking-tight uppercase">ATLAS</Link>
            <p>AI-powered personal growth platform.</p>
          </div>
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="#platform" className="hover:text-white transition-colors">Platform</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          </div>
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="#growth-journey" className="hover:text-white transition-colors">Growth Journey</Link>
            <Link href="#about" className="hover:text-white transition-colors">About</Link>
          </div>
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10">
          <p>&copy; {new Date().getFullYear()} ATLAS PROTOCOL</p>
          <p className="mt-4 md:mt-0">ALL SYSTEMS NOMINAL</p>
        </div>
      </footer>
    </div>
  );
}
