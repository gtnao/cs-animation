"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface Point {
  x: number;
  y: number;
  idx: number;
}

type StepType = "init" | "sort" | "compare" | "update_best" | "done";

interface Step {
  type: StepType;
  points: Point[];
  i: number;
  j: number;
  bestI: number;
  bestJ: number;
  bestDist: number;
  currentDist: number;
  description: string;
}

// --- Algorithm (brute-force with visualization for small sets) ---

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function generateSteps(rawPoints: { x: number; y: number }[]): Step[] {
  const steps: Step[] = [];
  const points: Point[] = rawPoints.map((p, i) => ({ ...p, idx: i }));

  if (points.length < 2) return steps;

  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);

  steps.push({
    type: "init",
    points: sorted,
    i: -1, j: -1,
    bestI: -1, bestJ: -1,
    bestDist: Infinity,
    currentDist: 0,
    description: `${sorted.length} 個の点から最近点対を求める`,
  });

  steps.push({
    type: "sort",
    points: sorted,
    i: -1, j: -1,
    bestI: -1, bestJ: -1,
    bestDist: Infinity,
    currentDist: 0,
    description: "点をx座標でソート",
  });

  let bestDist = Infinity;
  let bestI = -1;
  let bestJ = -1;

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].x - sorted[i].x > bestDist) break;

      const d = dist(sorted[i], sorted[j]);
      steps.push({
        type: "compare",
        points: sorted,
        i, j,
        bestI, bestJ, bestDist,
        currentDist: d,
        description: `点 ${i} と点 ${j} の距離: ${d.toFixed(2)} (現在の最小: ${bestDist === Infinity ? "∞" : bestDist.toFixed(2)})`,
      });

      if (d < bestDist) {
        bestDist = d;
        bestI = i;
        bestJ = j;
        steps.push({
          type: "update_best",
          points: sorted,
          i, j,
          bestI, bestJ, bestDist,
          currentDist: d,
          description: `最近点対を更新: 点 ${i} - 点 ${j} (距離 ${d.toFixed(2)})`,
        });
      }
    }
  }

  steps.push({
    type: "done",
    points: sorted,
    i: -1, j: -1,
    bestI, bestJ, bestDist,
    currentDist: bestDist,
    description: `最近点対: 点 ${bestI} (${sorted[bestI].x}, ${sorted[bestI].y}) - 点 ${bestJ} (${sorted[bestJ].x}, ${sorted[bestJ].y}), 距離 = ${bestDist.toFixed(2)}`,
  });

  return steps;
}

function parsePoints(s: string): { x: number; y: number }[] {
  return s.split(";").map((p) => p.trim()).filter((p) => p.length > 0).map((p) => {
    const [x, y] = p.split(",").map(Number);
    return { x: x || 0, y: y || 0 };
  });
}

const SVG_W = 400;
const SVG_H = 300;
const PAD = 30;

export default function ClosestPairAnimationPage() {
  const [input, setInput] = useState("1,2;3,1;4,4;6,3;5,1;2,4;7,2");
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
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 400);
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
  const toSvg = (p: { x: number; y: number }) => ({
    sx: PAD + ((p.x - minX) / rangeX) * (SVG_W - 2 * PAD),
    sy: SVG_H - PAD - ((p.y - minY) / rangeY) * (SVG_H - 2 * PAD),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">最近点対 (Closest Pair)</h1>
        <p className="text-sm text-muted-foreground mb-6">平面上の最近点対を求める</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="x,y;x,y;..." className="font-mono max-w-md" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-2 bg-white">
          <svg width={SVG_W} height={SVG_H} className="w-full h-auto" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            {/* Best pair line */}
            {step.bestI >= 0 && step.bestJ >= 0 && (
              <line
                x1={toSvg(step.points[step.bestI]).sx} y1={toSvg(step.points[step.bestI]).sy}
                x2={toSvg(step.points[step.bestJ]).sx} y2={toSvg(step.points[step.bestJ]).sy}
                stroke={step.type === "done" ? "#10b981" : "#f59e0b"} strokeWidth={2}
              />
            )}
            {/* Current comparison line */}
            {step.i >= 0 && step.j >= 0 && step.type === "compare" && (
              <line
                x1={toSvg(step.points[step.i]).sx} y1={toSvg(step.points[step.i]).sy}
                x2={toSvg(step.points[step.j]).sx} y2={toSvg(step.points[step.j]).sy}
                stroke="#3b82f6" strokeWidth={1} strokeDasharray="4,4"
              />
            )}
            {/* Points */}
            {step.points.map((p, idx) => {
              const { sx, sy } = toSvg(p);
              let fill = "#e5e7eb"; let stroke = "#9ca3af";
              if (step.type === "done" && (idx === step.bestI || idx === step.bestJ)) {
                fill = "#d1fae5"; stroke = "#10b981";
              } else if (idx === step.i || idx === step.j) {
                fill = "#dbeafe"; stroke = "#60a5fa";
              } else if (idx === step.bestI || idx === step.bestJ) {
                fill = "#fef3c7"; stroke = "#f59e0b";
              }
              return (
                <g key={idx}>
                  <circle cx={sx} cy={sy} r={6} fill={fill} stroke={stroke} strokeWidth={2} />
                  <text x={sx} y={sy - 10} textAnchor="middle" fontSize={10} fill="#374151">{idx}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>最小距離: {step.bestDist === Infinity ? "∞" : step.bestDist.toFixed(2)}</span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>比較中の点</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" /><span>現在の最近点対</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" /><span>最終結果</span></div>
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
