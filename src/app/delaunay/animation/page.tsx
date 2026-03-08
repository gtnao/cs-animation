"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface Point {
  x: number;
  y: number;
}

interface Triangle {
  a: number;
  b: number;
  c: number;
}

type StepType = "init" | "add_point" | "create_triangle" | "flip_edge" | "done";

interface Step {
  type: StepType;
  points: Point[];
  triangles: Triangle[];
  currentPoint: number;
  highlightTriangle: number;
  description: string;
}

// --- Simple incremental Delaunay ---

function cross2d(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function inCircumcircle(p: Point, a: Point, b: Point, c: Point): boolean {
  const ax = a.x - p.x, ay = a.y - p.y;
  const bx = b.x - p.x, by = b.y - p.y;
  const cx = c.x - p.x, cy = c.y - p.y;
  const det =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay);
  return det > 0;
}

function generateSteps(points: Point[]): Step[] {
  const steps: Step[] = [];
  if (points.length < 3) return steps;

  steps.push({
    type: "init",
    points,
    triangles: [],
    currentPoint: -1,
    highlightTriangle: -1,
    description: `${points.length} 個の点でドロネー三角形分割を構築`,
  });

  // Simple incremental approach
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const triangles: Triangle[] = [];

  // Start with first triangle
  if (sorted.length >= 3) {
    // Ensure CCW
    const cr = cross2d(sorted[0], sorted[1], sorted[2]);
    if (cr > 0) {
      triangles.push({ a: 0, b: 1, c: 2 });
    } else {
      triangles.push({ a: 0, b: 2, c: 1 });
    }

    steps.push({
      type: "create_triangle",
      points: sorted,
      triangles: [...triangles],
      currentPoint: 2,
      highlightTriangle: 0,
      description: `最初の三角形 (0, 1, 2) を作成`,
    });

    // Add remaining points
    for (let i = 3; i < sorted.length; i++) {
      steps.push({
        type: "add_point",
        points: sorted,
        triangles: [...triangles],
        currentPoint: i,
        highlightTriangle: -1,
        description: `点 ${i} (${sorted[i].x}, ${sorted[i].y}) を追加`,
      });

      // Find bad triangles (point is inside circumcircle)
      const bad: number[] = [];
      for (let t = 0; t < triangles.length; t++) {
        const tri = triangles[t];
        if (inCircumcircle(sorted[i], sorted[tri.a], sorted[tri.b], sorted[tri.c])) {
          bad.push(t);
        }
      }

      // Get boundary edges
      const edges: [number, number][] = [];
      for (const t of bad) {
        const tri = triangles[t];
        const triEdges: [number, number][] = [[tri.a, tri.b], [tri.b, tri.c], [tri.c, tri.a]];
        for (const [ea, eb] of triEdges) {
          const shared = bad.some((bt) => {
            if (bt === t) return false;
            const other = triangles[bt];
            const vs = [other.a, other.b, other.c];
            return vs.includes(ea) && vs.includes(eb);
          });
          if (!shared) edges.push([ea, eb]);
        }
      }

      // Remove bad triangles (in reverse order)
      for (const t of bad.sort((a, b) => b - a)) {
        triangles.splice(t, 1);
      }

      if (bad.length > 0) {
        steps.push({
          type: "flip_edge",
          points: sorted,
          triangles: [...triangles],
          currentPoint: i,
          highlightTriangle: -1,
          description: `${bad.length} 個の不正な三角形を除去`,
        });
      }

      // Create new triangles
      for (const [ea, eb] of edges) {
        triangles.push({ a: ea, b: eb, c: i });
      }

      steps.push({
        type: "create_triangle",
        points: sorted,
        triangles: [...triangles],
        currentPoint: i,
        highlightTriangle: triangles.length - 1,
        description: `点 ${i} を含む新しい三角形を作成 (計 ${triangles.length} 三角形)`,
      });
    }
  }

  steps.push({
    type: "done",
    points: sorted,
    triangles: [...triangles],
    currentPoint: -1,
    highlightTriangle: -1,
    description: `ドロネー三角形分割完成: ${triangles.length} 三角形`,
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
const SVG_H = 350;
const PAD = 30;

export default function DelaunayAnimationPage() {
  const [input, setInput] = useState("1,1;5,1;3,4;1,6;6,5;4,2");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const pts = parsePoints(s);
    if (pts.length < 3) return;
    setSteps(generateSteps(pts));
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

  const xs = step.points.map((p) => p.x);
  const ys = step.points.map((p) => p.y);
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

  return (
    <>
<div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="x,y;x,y;..." className="font-mono max-w-md" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-2 bg-white">
          <svg width={SVG_W} height={SVG_H} className="w-full h-auto" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            {step.triangles.map((tri, idx) => {
              const a = toSvg(step.points[tri.a]);
              const b = toSvg(step.points[tri.b]);
              const c = toSvg(step.points[tri.c]);
              const isHighlight = idx === step.highlightTriangle;
              return (
                <polygon
                  key={idx}
                  points={`${a.sx},${a.sy} ${b.sx},${b.sy} ${c.sx},${c.sy}`}
                  fill={isHighlight ? "#dbeafe" : step.type === "done" ? "#f0fdf4" : "#f9fafb"}
                  stroke={isHighlight ? "#3b82f6" : "#9ca3af"}
                  strokeWidth={isHighlight ? 2 : 1}
                />
              );
            })}
            {step.points.map((p, i) => {
              const { sx, sy } = toSvg(p);
              const isCurrent = i === step.currentPoint;
              return (
                <g key={i}>
                  <circle cx={sx} cy={sy} r={5} fill={isCurrent ? "#dbeafe" : "#374151"} stroke={isCurrent ? "#3b82f6" : "#111827"} strokeWidth={2} />
                  <text x={sx} y={sy - 10} textAnchor="middle" fontSize={10} fill="#374151">{i}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>三角形数: {step.triangles.length}</span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>追加中の点</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>新しい三角形</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>完成</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((p) => !p)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
    </>
  );
}
