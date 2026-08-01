"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, SearchX, Plus, Loader2 } from "lucide-react";
import { CourseCatalogEntry } from "@/lib/mock-data";
import { ApiClient } from "@/lib/api-client";
import { CourseCard } from "@/components/hub/course-card";
import { useRouter } from "next/navigation";

export default function KnowledgeHubPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const isSearching = searchQuery.trim().length > 0;

  const [allCourses, setAllCourses] = useState<CourseCatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchCourses() {
      try {
        const data = await ApiClient.get('/catalog/all');
        setAllCourses(data);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourses();
  }, []);

  // Filter logic
  const filteredCourses = useMemo(() => {
    if (!isSearching) return allCourses;
    const lowerQ = searchQuery.toLowerCase();
    return allCourses.filter(c => 
      c.title.toLowerCase().includes(lowerQ) ||
      c.category.toLowerCase().includes(lowerQ) ||
      c.tags.some(t => t.toLowerCase().includes(lowerQ))
    );
  }, [searchQuery, isSearching, allCourses]);

  // We'll mock recommendations as the first 3 courses just for the UI
  const recommendations = allCourses.slice(0, 3);

  return (
    <div className="w-full h-full flex flex-col bg-canvas overflow-y-auto">
      
      {/* Header & Search */}
      <div className="px-6 py-10 md:px-12 md:py-16 border-b border-border/50 bg-sidebar/50">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Knowledge Hub
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-xl mb-8">
          Discover and adopt AI-generated learning templates for your next workspace.
        </p>

        {/* Search Input */}
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by topic, skill, or domain..."
            className="w-full bg-surface border border-border/50 rounded-xl py-3.5 pl-12 pr-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent-primary transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-6 py-10 md:px-12">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
          </div>
        ) : filteredCourses.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-surface border border-border/50 flex items-center justify-center mb-6">
              <SearchX className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No matching course found.</h3>
            <p className="text-muted-foreground mb-8">Create your own learning workspace from scratch.</p>
            
            <button className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-black font-bold px-6 py-3 rounded-xl transition-colors shadow-lg">
              <Plus className="w-5 h-5" />
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {!isSearching ? (
              <>
                {/* Recommended Section */}
                <section>
                  <h2 className="text-xl font-bold text-foreground mb-6">Recommended For You</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {recommendations.map(course => (
                      <CourseCard 
                        key={`rec-${course.id}`} 
                        course={course} 
                        onClick={() => router.push(`/hub/${course.id}`)}
                      />
                    ))}
                  </div>
                </section>

                <div className="h-[1px] bg-border/50 w-full" />

                {/* All Courses Section */}
                <section>
                  <h2 className="text-xl font-bold text-foreground mb-6">All Courses</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {allCourses.map(course => (
                      <CourseCard 
                        key={`all-${course.id}`} 
                        course={course} 
                        onClick={() => router.push(`/hub/${course.id}`)}
                      />
                    ))}
                  </div>
                </section>
              </>
            ) : (
              /* Search Results */
              <section>
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Search Results for "{searchQuery}"
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredCourses.map(course => (
                    <CourseCard 
                      key={`search-${course.id}`} 
                      course={course} 
                      onClick={() => router.push(`/hub/${course.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
