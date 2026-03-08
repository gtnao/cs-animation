"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface Point { x: number; y: number; }

type StepType = "init" | "build_hull" | "start_calipers" | "check_pair" | "update_best" | "rotate" | "done";

interface Step {
  type: StepType;
  points: Point[];
  hull: number[];
  pIdx: number;
  qIdx: number;
  bestI: number;
  bestJ: number;
  bestDist: number;
  currentDist: number;
  description: string;
}

// --- Geometry helpers ---

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function convexHull(points: Point[]): number[] {
  const sorted = points.map((p, i) => ({ ...p, i })).sort((a, b) => a.x - b.x || a.y - b.y);
  const lower: number[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(points[lower[lower.length - 2]], points[lower[lower.length - 1]], points[p.i]) <= 0) lower.pop();
    lower.push(p.i);
  }
  const upper: number[] = [];
  for (const p of sorted.reverse()) {
    while (upper.length >= 2 && cross(points[upper[upper.length - 2]], points[upper[upper.length - 1]], points[p.i]) <= 0) upper.pop();
    upper.push(p.i);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

function generateSteps(points: Point[]): Step[] {
  const steps: Step[] = [];
  if (points.length < 2) return steps;

  steps.push({
    type: "init", points, hull: [], pIdx: -1, qIdx: -1,
    bestI: -1, bestJ: -1, bestDist: 0, currentDist: 0,
    description: `${points.length} 個の点の最遠点対を回転キャリパー法で求める`,
  });

  const hull = convexHull(points);
  const n = hull.length;

  steps.push({
    type: "build_hull", points, hull, pIdx: -1, qIdx: -1,
    bestI: -1, bestJ: -1, bestDist: 0, currentDist: 0,
    description: `凸包を構築: ${n} 頂点`,
  });

  if (n < 2) return steps;

  // Find antipodal point for edge 0
  let q = 1;
  for (let i = 2; i < n; i++) {
    if (dist(points[hull[0]], points[hull[i]]) > dist(points[hull[0]], points[hull[q]])) {
      q = i;
    }
  }

  let bestDist = 0;
  let bestI = -1;
  let bestJ = -1;

  steps.push({
    type: "start_calipers", points, hull, pIdx: 0, qIdx: q,
    bestI: -1, bestJ: -1, bestDist: 0, currentDist: 0,
    description: `キャリパーを頂点 0 と頂点 ${q} に配置`,
  });

  for (let i = 0; i < n; i++) {
    const d = dist(points[hull[i]], points[hull[q]]);
    steps.push({
      type: "check_pair", points, hull, pIdx: i, qIdx: q,
      bestI, bestJ, bestDist, currentDist: d,
      description: `頂点 ${hull[i]} と頂点 ${hull[q]} の距離: ${d.toFixed(2)}`,
    });

    if (d > bestDist) {
      bestDist = d;
      bestI = i;
      bestJ = q;
      steps.push({
        type: "update_best", points, hull, pIdx: i, qIdx: q,
        bestI, bestJ, bestDist, currentDist: d,
        description: `最遠点対を更新: 距離 ${d.toFixed(2)}`,
      });
    }

    // Rotate caliper
    const ni = (i + 1) % n;
    const nq = (q + 1) % n;
    const edgeI = { x: points[hull[ni]].x - points[hull[i]].x, y: points[hull[ni]].y - points[hull[i]].y };
    const edgeQ = { x: points[hull[nq]].x - points[hull[q]].x, y: points[hull[nq]].y - points[hull[q]].y };
    const crossVal = edgeI.x * edgeQ.y - edgeI.y * edgeQ.x;

    if (crossVal < 0) {
      q = nq;
      steps.push({
        type: "rotate", points, hull, pIdx: i, qIdx: q,
        bestI, bestJ, bestDist, currentDist: 0,
        description: `対角頂点を ${hull[q]} に回転`,
      });
    }
  }

  steps.push({
    type: "done", points, hull, pIdx: bestI, qIdx: bestJ,
    bestI, bestJ, bestDist, currentDist: bestDist,
    description: `最遠点対: 頂点 ${hull[bestI]} - 頂点 ${hull[bestJ]}, 距離 = ${bestDist.toFixed(2)}`,
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

export default function RotatingCalipersAnimationPage() {
  const [input, setInput] = useState("0,0;4,0;5,3;3,5;1,4;0,2");
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
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 600);
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

  const hullStr = step.hull.length > 0 ? step.hull.map((i) => { const s = toSvg(step.points[i]); return `${s.sx},${s.sy}`; }).join(" ") : "";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">回転キャリパー法</h1>
        <p className="text-sm text-muted-foreground mb-6">凸多角形の最遠点対 (直径) を求める</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="x,y;x,y;..." className="font-mono max-w-md" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-2 bg-white">
          <svg width={SVG_W} height={SVG_H} className="w-full h-auto" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            {hullStr && <polygon points={hullStr} fill="#f9fafb" stroke="#9ca3af" strokeWidth={1.5} />}
            {/* Caliper line */}
            {step.pIdx >= 0 && step.qIdx >= 0 && step.hull.length > 0 && (
              <line
                x1={toSvg(step.points[step.hull[step.pIdx]]).sx} y1={toSvg(step.points[step.hull[step.pIdx]]).sy}
                x2={toSvg(step.points[step.hull[step.qIdx]]).sx} y2={toSvg(step.points[step.hull[step.qIdx]]).sy}
                stroke={step.type === "done" ? "#10b981" : "#3b82f6"} strokeWidth={2}
              />
            )}
            {/* Best pair line */}
            {step.bestI >= 0 && step.bestJ >= 0 && step.type !== "done" && (
              <line
                x1={toSvg(step.points[step.hull[step.bestI]]).sx} y1={toSvg(step.points[step.hull[step.bestI]]).sy}
                x2={toSvg(step.points[step.hull[step.bestJ]]).sx} y2={toSvg(step.points[step.hull[step.bestJ]]).sy}
                stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,4"
              />
            )}
            {step.points.map((p, i) => {
              const { sx, sy } = toSvg(p);
              let fill = "#e5e7eb"; let stroke = "#9ca3af";
              if (step.hull.length > 0 && step.pIdx >= 0 && (step.hull[step.pIdx] === i || step.hull[step.qIdx] === i)) {
                fill = step.type === "done" ? "#d1fae5" : "#dbeafe";
                stroke = step.type === "done" ? "#10b981" : "#3b82f6";
              }
              return (
                <g key={i}>
                  <circle cx={sx} cy={sy} r={5} fill={fill} stroke={stroke} strokeWidth={2} />
                  <text x={sx} y={sy - 10} textAnchor="middle" fontSize={10} fill="#374151">{i}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>最遠距離: {step.bestDist > 0 ? step.bestDist.toFixed(2) : "-"}</span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>キャリパー対</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>暫定最遠対</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>最遠点対確定</span></div>
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
