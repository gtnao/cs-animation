"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ALGORITHMS, CATEGORIES } from "@/data/algorithms";
import { useReadStatus } from "@/hooks/use-read-status";

export default function Home() {
  const [query, setQuery] = useState("");
  const { readMap, toggleRead, readCount, isLoaded } = useReadStatus();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const filteredAlgorithms = useMemo(() => {
    if (!query) return ALGORITHMS;
    const q = query.toLowerCase();
    return ALGORITHMS.filter(
      (a) => a.name.toLowerCase().includes(q) || a.description.includes(q)
    );
  }, [query]);

  const filteredCategories = useMemo(() => {
    const ids = new Set(filteredAlgorithms.map((a) => a.category));
    return CATEGORIES.filter((c) => ids.has(c.id));
  }, [filteredAlgorithms]);

  const algorithmsByCategory = useMemo(() => {
    const map = new Map<string, typeof ALGORITHMS>();
    for (const alg of filteredAlgorithms) {
      const list = map.get(alg.category) || [];
      list.push(alg);
      map.set(alg.category, list);
    }
    return map;
  }, [filteredAlgorithms]);

  const scrollToCategory = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-[#2D4855] text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">CS Animation</h1>
          <p className="text-white/80 text-sm sm:text-base">
            アルゴリズムをインタラクティブに学ぶ
          </p>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            {ALGORITHMS.length} algorithms / {CATEGORIES.length} categories
          </p>
        </div>
      </div>

      {/* Sticky search + category nav */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="アルゴリズムを検索..."
              className="pl-9 pr-8 h-9 focus-visible:border-[#2D4855] focus-visible:ring-[#2D4855]/30"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category nav */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="shrink-0 px-3 py-1 text-xs font-medium rounded-full border border-[#2D4855]/20 text-[#2D4855] hover:bg-[#2D4855] hover:text-white transition-colors"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {filteredCategories.map((cat) => {
          const algs = algorithmsByCategory.get(cat.id) || [];
          const catSlugs = algs.map((a) => a.slug);
          const read = isLoaded ? readCount(catSlugs) : 0;

          return (
            <section
              key={cat.id}
              ref={(el) => { sectionRefs.current[cat.id] = el; }}
              className="mb-10 scroll-mt-32"
            >
              {/* Category header */}
              <div className="flex items-center gap-3 mb-4 border-l-4 border-[#2D4855] pl-3">
                <h2 className="text-lg font-bold text-[#2D4855]">
                  {cat.label}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {read}/{algs.length} 読了
                </span>
              </div>

              {/* Algorithm grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {algs.map((alg) => {
                  const isRead = isLoaded && !!readMap[alg.slug];
                  return (
                    <div
                      key={alg.slug}
                      className={`relative rounded-lg border transition-all ${
                        isRead
                          ? "border-l-[3px] border-l-[#2D4855] border-t border-r border-b border-t-border border-r-border border-b-border bg-[#2D4855]/[0.03]"
                          : "border-border hover:border-[#2D4855]/40 hover:shadow-sm"
                      }`}
                    >
                      {/* Overlay link */}
                      <Link
                        href={`/${alg.slug}`}
                        className="absolute inset-0 z-0 rounded-lg"
                        aria-label={alg.name}
                      />

                      <div className="relative z-10 p-4 pointer-events-none">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm leading-tight">
                            {alg.name}
                          </h3>
                          <div
                            className="pointer-events-auto shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={isRead}
                              onCheckedChange={() => toggleRead(alg.slug)}
                              className="data-checked:bg-[#2D4855] data-checked:border-[#2D4855]"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          {alg.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {filteredAlgorithms.length === 0 && (
          <p className="text-center text-muted-foreground py-16">
            一致するアルゴリズムがありません
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          CS Animation
        </div>
      </div>
    </div>
  );
}
