"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface Point {
  x: number;
  y: number;
}

type StepType =
  | "init"
  | "sort"
  | "lower_add"
  | "lower_remove"
  | "upper_add"
  | "upper_remove"
  | "done";

interface Step {
  type: StepType;
  points: Point[];
  sortedPoints: Point[];
  lowerHull: number[];
  upperHull: number[];
  currentIndex: number;
  description: string;
}

// --- Cross product ---

function cross(O: Point, A: Point, B: Point): number {
  return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
}

// --- Algorithm step generation (Andrew's Monotone Chain) ---

function generateSteps(points: Point[]): Step[] {
  const steps: Step[] = [];
  if (points.length < 2) return steps;

  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);

  steps.push({
    type: "init",
    points,
    sortedPoints: sorted,
    lowerHull: [],
    upperHull: [],
    currentIndex: -1,
    description: `${points.length} 個の点で凸包を構築する`,
  });

  steps.push({
    type: "sort",
    points,
    sortedPoints: sorted,
    lowerHull: [],
    upperHull: [],
    currentIndex: -1,
    description: "点をx座標でソート",
  });

  // Lower hull
  const lower: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    while (lower.length >= 2 && cross(sorted[lower[lower.length - 2]], sorted[lower[lower.length - 1]], sorted[i]) <= 0) {
      const removed = lower.pop()!;
      steps.push({
        type: "lower_remove",
        points,
        sortedPoints: sorted,
        lowerHull: [...lower],
        upperHull: [],
        currentIndex: removed,
        description: `下側凸包: 点 ${removed} は左折しないため除去`,
      });
    }
    lower.push(i);
    steps.push({
      type: "lower_add",
      points,
      sortedPoints: sorted,
      lowerHull: [...lower],
      upperHull: [],
      currentIndex: i,
      description: `下側凸包: 点 ${i} (${sorted[i].x}, ${sorted[i].y}) を追加`,
    });
  }

  // Upper hull
  const upper: number[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(sorted[upper[upper.length - 2]], sorted[upper[upper.length - 1]], sorted[i]) <= 0) {
      const removed = upper.pop()!;
      steps.push({
        type: "upper_remove",
        points,
        sortedPoints: sorted,
        lowerHull: [...lower],
        upperHull: [...upper],
        currentIndex: removed,
        description: `上側凸包: 点 ${removed} は左折しないため除去`,
      });
    }
    upper.push(i);
    steps.push({
      type: "upper_add",
      points,
      sortedPoints: sorted,
      lowerHull: [...lower],
      upperHull: [...upper],
      currentIndex: i,
      description: `上側凸包: 点 ${i} (${sorted[i].x}, ${sorted[i].y}) を追加`,
    });
  }

  steps.push({
    type: "done",
    points,
    sortedPoints: sorted,
    lowerHull: [...lower],
    upperHull: [...upper],
    currentIndex: -1,
    description: `凸包完成: ${new Set([...lower, ...upper]).size} 頂点`,
  });

  return steps;
}

function parsePoints(s: string): Point[] {
  const pairs = s.split(";").map((p) => p.trim()).filter((p) => p.length > 0);
  return pairs.map((p) => {
    const [x, y] = p.split(",").map(Number);
    return { x: x || 0, y: y || 0 };
  });
}

// --- Component ---

const SVG_W = 400;
const SVG_H = 300;
const PAD = 30;

export default function ConvexHullAnimationPage() {
  const [input, setInput] = useState("1,1;3,3;1,3;3,1;2,2;0,2;4,1");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const pts = parsePoints(s);
    if (pts.length < 2) return;
    const st = generateSteps(pts);
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") {
        setCurrentStep((prev) => Math.max(0, prev - 1));
        setIsPlaying(false);
      } else if (e.key === "ArrowRight") {
        setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
        setIsPlaying(false);
      } else if (e.key === " ") {
        e.preventDefault();
        if (currentStep < steps.length - 1) setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  const sorted = step.sortedPoints;
  const xs = sorted.map((p) => p.x);
  const ys = sorted.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const toSvg = (p: Point) => ({
    sx: PAD + ((p.x - minX) / rangeX) * (SVG_W - 2 * PAD),
    sy: SVG_H - PAD - ((p.y - minY) / rangeY) * (SVG_H - 2 * PAD),
  });

  const hullIndices = new Set([...step.lowerHull, ...step.upperHull]);

  return (
    <>
<div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="x,y;x,y;... 形式で入力"
            className="font-mono max-w-md"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* SVG Visualization */}
        <div className="mb-6 border border-border rounded p-2 bg-white">
          <svg width={SVG_W} height={SVG_H} className="w-full h-auto" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            {/* Lower hull edges */}
            {step.lowerHull.length >= 2 &&
              step.lowerHull.map((idx, i) => {
                if (i === 0) return null;
                const a = toSvg(sorted[step.lowerHull[i - 1]]);
                const b = toSvg(sorted[idx]);
                return (
                  <line key={`l-${i}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke="#f59e0b" strokeWidth={2} />
                );
              })}
            {/* Upper hull edges */}
            {step.upperHull.length >= 2 &&
              step.upperHull.map((idx, i) => {
                if (i === 0) return null;
                const a = toSvg(sorted[step.upperHull[i - 1]]);
                const b = toSvg(sorted[idx]);
                return (
                  <line key={`u-${i}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke="#3b82f6" strokeWidth={2} />
                );
              })}
            {/* Points */}
            {sorted.map((p, i) => {
              const { sx, sy } = toSvg(p);
              let fill = "#e5e7eb";
              let stroke = "#9ca3af";
              if (i === step.currentIndex) {
                fill = "#dbeafe";
                stroke = "#60a5fa";
              } else if (step.type === "done" && hullIndices.has(i)) {
                fill = "#d1fae5";
                stroke = "#10b981";
              } else if (hullIndices.has(i)) {
                fill = "#fef3c7";
                stroke = "#f59e0b";
              }
              return (
                <g key={i}>
                  <circle cx={sx} cy={sy} r={6} fill={fill} stroke={stroke} strokeWidth={2} />
                  <text x={sx} y={sy - 10} textAnchor="middle" fontSize={10} fill="#374151">
                    {i}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Description */}
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" />
            <span>現在の点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>凸包候補</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>凸包確定</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>
            ← 前へ
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>
            次へ →
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((p) => !p)} disabled={currentStep === steps.length - 1}>
            {isPlaying ? "停止" : "再生"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>
            リセット
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
    </>
  );
}
