"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface Point {
  x: number;
  y: number;
}

type StepType = "init" | "add_site" | "compute_cell" | "done";

interface Step {
  type: StepType;
  sites: Point[];
  currentSite: number;
  processedSites: number[];
  description: string;
}

// --- Step generation (incremental Voronoi visualization) ---

function generateSteps(sites: Point[]): Step[] {
  const steps: Step[] = [];
  if (sites.length < 2) return steps;

  steps.push({
    type: "init",
    sites,
    currentSite: -1,
    processedSites: [],
    description: `${sites.length} 個の母点でボロノイ図を構築する`,
  });

  const processed: number[] = [];
  for (let i = 0; i < sites.length; i++) {
    steps.push({
      type: "add_site",
      sites,
      currentSite: i,
      processedSites: [...processed],
      description: `母点 ${i} (${sites[i].x}, ${sites[i].y}) を追加`,
    });

    processed.push(i);

    steps.push({
      type: "compute_cell",
      sites,
      currentSite: i,
      processedSites: [...processed],
      description: `母点 ${i} のボロノイ領域を計算`,
    });
  }

  steps.push({
    type: "done",
    sites,
    currentSite: -1,
    processedSites: [...processed],
    description: `ボロノイ図完成: ${sites.length} 領域`,
  });

  return steps;
}

function parsePoints(s: string): Point[] {
  return s.split(";").map((p) => p.trim()).filter((p) => p.length > 0).map((p) => {
    const [x, y] = p.split(",").map(Number);
    return { x: x || 0, y: y || 0 };
  });
}

const SVG_W = 400;
const SVG_H = 400;
const PAD = 20;

// Simple nearest-site coloring for visualization
const COLORS = [
  "#dbeafe", "#fef3c7", "#d1fae5", "#fee2e2", "#ede9fe",
  "#fce7f3", "#ccfbf1", "#fef9c3", "#e0e7ff", "#cffafe",
];

export default function VoronoiAnimationPage() {
  const [input, setInput] = useState("2,2;5,1;8,3;3,6;7,7;1,8");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const pts = parsePoints(s);
    if (pts.length < 2) return;
    setSteps(generateSteps(pts));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(input); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  const xs = step.sites.map((p) => p.x);
  const ys = step.sites.map((p) => p.y);
  const minX = Math.min(...xs) - 1;
  const maxX = Math.max(...xs) + 1;
  const minY = Math.min(...ys) - 1;
  const maxY = Math.max(...ys) + 1;
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const toSvg = (p: Point) => ({
    sx: PAD + ((p.x - minX) / rangeX) * (SVG_W - 2 * PAD),
    sy: SVG_H - PAD - ((p.y - minY) / rangeY) * (SVG_H - 2 * PAD),
  });

  // Render pixel-based Voronoi
  const activeSites = step.processedSites;
  const cellSize = 8;
  const cells: { x: number; y: number; color: string }[] = [];
  if (activeSites.length > 0) {
    for (let px = 0; px < SVG_W; px += cellSize) {
      for (let py = 0; py < SVG_H; py += cellSize) {
        const wx = minX + ((px - PAD) / (SVG_W - 2 * PAD)) * rangeX;
        const wy = maxY - ((py - PAD) / (SVG_H - 2 * PAD)) * rangeY;
        let best = -1;
        let bestD = Infinity;
        for (const si of activeSites) {
          const d = (step.sites[si].x - wx) ** 2 + (step.sites[si].y - wy) ** 2;
          if (d < bestD) { bestD = d; best = si; }
        }
        if (best >= 0) {
          cells.push({ x: px, y: py, color: COLORS[best % COLORS.length] });
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">ボロノイ図</h1>
        <p className="text-sm text-muted-foreground mb-6">各母点に最も近い領域で空間を分割</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="x,y;x,y;..." className="font-mono max-w-md" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-2 bg-white">
          <svg width={SVG_W} height={SVG_H} className="w-full h-auto" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            {cells.map((c, i) => (
              <rect key={i} x={c.x} y={c.y} width={cellSize} height={cellSize} fill={c.color} />
            ))}
            {step.sites.map((p, i) => {
              const { sx, sy } = toSvg(p);
              const isActive = activeSites.includes(i);
              const isCurrent = i === step.currentSite;
              return (
                <g key={i}>
                  <circle cx={sx} cy={sy} r={6} fill={isCurrent ? "#dbeafe" : isActive ? "#374151" : "#d1d5db"} stroke={isCurrent ? "#3b82f6" : isActive ? "#111827" : "#9ca3af"} strokeWidth={2} />
                  <text x={sx} y={sy - 10} textAnchor="middle" fontSize={10} fill="#374151" fontWeight="bold">{i}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>現在の母点</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-gray-800 rounded-full" /><span>処理済み母点</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((p) => !p)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
      </div>
    </div>
  );
}
