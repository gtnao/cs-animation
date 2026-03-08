"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface Point { x: number; y: number; }
interface HalfPlane { a: number; b: number; c: number; } // ax + by <= c

type StepType = "init" | "add_halfplane" | "clip" | "done";

interface Step {
  type: StepType;
  halfPlanes: HalfPlane[];
  currentHP: number;
  polygon: Point[];
  description: string;
}

// --- Polygon clipping by half-plane ---

function clipPolygon(polygon: Point[], hp: HalfPlane): Point[] {
  if (polygon.length === 0) return [];
  const result: Point[] = [];
  const n = polygon.length;
  const inside = (p: Point) => hp.a * p.x + hp.b * p.y <= hp.c + 1e-9;
  const intersect = (p1: Point, p2: Point): Point => {
    const d1 = hp.a * p1.x + hp.b * p1.y - hp.c;
    const d2 = hp.a * p2.x + hp.b * p2.y - hp.c;
    const t = d1 / (d1 - d2);
    return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
  };

  for (let i = 0; i < n; i++) {
    const cur = polygon[i];
    const next = polygon[(i + 1) % n];
    const curIn = inside(cur);
    const nextIn = inside(next);
    if (curIn) result.push(cur);
    if (curIn !== nextIn) result.push(intersect(cur, next));
  }
  return result;
}

function generateSteps(halfPlanes: HalfPlane[]): Step[] {
  const steps: Step[] = [];
  if (halfPlanes.length === 0) return steps;

  // Start with a large bounding box
  let polygon: Point[] = [
    { x: -10, y: -10 }, { x: 10, y: -10 },
    { x: 10, y: 10 }, { x: -10, y: 10 },
  ];

  steps.push({
    type: "init",
    halfPlanes,
    currentHP: -1,
    polygon: [...polygon],
    description: `${halfPlanes.length} 個の半平面の交差領域を求める`,
  });

  for (let i = 0; i < halfPlanes.length; i++) {
    steps.push({
      type: "add_halfplane",
      halfPlanes,
      currentHP: i,
      polygon: [...polygon],
      description: `半平面 ${i}: ${halfPlanes[i].a}x + ${halfPlanes[i].b}y <= ${halfPlanes[i].c} を追加`,
    });

    polygon = clipPolygon(polygon, halfPlanes[i]);

    steps.push({
      type: "clip",
      halfPlanes,
      currentHP: i,
      polygon: [...polygon],
      description: `半平面 ${i} で切断後: ${polygon.length} 頂点`,
    });
  }

  steps.push({
    type: "done",
    halfPlanes,
    currentHP: -1,
    polygon: [...polygon],
    description: `半平面交差完了: ${polygon.length} 頂点の凸多角形`,
  });

  return steps;
}

function parseHalfPlanes(s: string): HalfPlane[] {
  return s.split(";").map((p) => p.trim()).filter((p) => p.length > 0).map((p) => {
    const [a, b, c] = p.split(",").map(Number);
    return { a: a || 0, b: b || 0, c: c || 0 };
  });
}

const SVG_W = 400;
const SVG_H = 400;
const PAD = 30;

export default function HalfPlaneIntersectionAnimationPage() {
  const [input, setInput] = useState("1,0,5;-1,0,0;0,1,5;0,-1,0;1,1,7");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const hps = parseHalfPlanes(s);
    if (hps.length === 0) return;
    setSteps(generateSteps(hps));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(input); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 700);
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

  const viewMin = -2;
  const viewMax = 8;
  const viewRange = viewMax - viewMin;
  const toSvg = (p: Point) => ({
    sx: PAD + ((p.x - viewMin) / viewRange) * (SVG_W - 2 * PAD),
    sy: SVG_H - PAD - ((p.y - viewMin) / viewRange) * (SVG_H - 2 * PAD),
  });

  const polyStr = step.polygon.map((p) => { const s = toSvg(p); return `${s.sx},${s.sy}`; }).join(" ");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">半平面交差</h1>
        <p className="text-sm text-muted-foreground mb-6">半平面の共通部分を逐次的に計算</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="a,b,c;... (ax+by<=c)" className="font-mono max-w-md" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-2 bg-white">
          <svg width={SVG_W} height={SVG_H} className="w-full h-auto" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            {/* Grid */}
            {Array.from({ length: viewMax - viewMin + 1 }, (_, i) => {
              const v = viewMin + i;
              const s = toSvg({ x: v, y: viewMin });
              const e = toSvg({ x: v, y: viewMax });
              return <line key={`vg-${i}`} x1={s.sx} y1={s.sy} x2={e.sx} y2={e.sy} stroke="#f3f4f6" strokeWidth={1} />;
            })}
            {Array.from({ length: viewMax - viewMin + 1 }, (_, i) => {
              const v = viewMin + i;
              const s = toSvg({ x: viewMin, y: v });
              const e = toSvg({ x: viewMax, y: v });
              return <line key={`hg-${i}`} x1={s.sx} y1={s.sy} x2={e.sx} y2={e.sy} stroke="#f3f4f6" strokeWidth={1} />;
            })}
            {/* Polygon */}
            {step.polygon.length >= 3 && (
              <polygon points={polyStr} fill={step.type === "done" ? "#d1fae5" : "#dbeafe"} stroke={step.type === "done" ? "#10b981" : "#3b82f6"} strokeWidth={2} fillOpacity={0.5} />
            )}
            {/* Current half-plane line */}
            {step.currentHP >= 0 && (() => {
              const hp = step.halfPlanes[step.currentHP];
              // Draw boundary line ax + by = c
              let p1: Point, p2: Point;
              if (Math.abs(hp.b) > 1e-9) {
                p1 = { x: viewMin, y: (hp.c - hp.a * viewMin) / hp.b };
                p2 = { x: viewMax, y: (hp.c - hp.a * viewMax) / hp.b };
              } else {
                p1 = { x: hp.c / hp.a, y: viewMin };
                p2 = { x: hp.c / hp.a, y: viewMax };
              }
              const s1 = toSvg(p1);
              const s2 = toSvg(p2);
              return <line x1={s1.sx} y1={s1.sy} x2={s2.sx} y2={s2.sy} stroke="#f59e0b" strokeWidth={2} strokeDasharray="6,3" />;
            })()}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>頂点数: {step.polygon.length}</span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>交差領域</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>半平面境界</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>完成</span></div>
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
