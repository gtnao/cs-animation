"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface Point { x: number; y: number; }

type StepType = "init" | "find_bottom" | "merge_edge" | "add_vertex" | "done";

interface Step {
  type: StepType;
  polyA: Point[];
  polyB: Point[];
  result: Point[];
  idxA: number;
  idxB: number;
  description: string;
}

// --- Minkowski sum of two convex polygons ---

function angle(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

function generateSteps(polyA: Point[], polyB: Point[]): Step[] {
  const steps: Step[] = [];
  const nA = polyA.length;
  const nB = polyB.length;

  steps.push({
    type: "init", polyA, polyB, result: [], idxA: -1, idxB: -1,
    description: `多角形A (${nA}頂点) と多角形B (${nB}頂点) のミンコフスキー和を計算`,
  });

  // Find bottom-most points
  let startA = 0;
  for (let i = 1; i < nA; i++) {
    if (polyA[i].y < polyA[startA].y || (polyA[i].y === polyA[startA].y && polyA[i].x < polyA[startA].x)) startA = i;
  }
  let startB = 0;
  for (let i = 1; i < nB; i++) {
    if (polyB[i].y < polyB[startB].y || (polyB[i].y === polyB[startB].y && polyB[i].x < polyB[startB].x)) startB = i;
  }

  steps.push({
    type: "find_bottom", polyA, polyB, result: [], idxA: startA, idxB: startB,
    description: `最下点を検出: A[${startA}], B[${startB}]`,
  });

  const result: Point[] = [];
  let iA = startA;
  let iB = startB;
  let count = 0;

  while (count < nA + nB) {
    const sumPt = { x: polyA[iA].x + polyB[iB].x, y: polyA[iA].y + polyB[iB].y };
    result.push(sumPt);

    steps.push({
      type: "add_vertex", polyA, polyB, result: [...result], idxA: iA, idxB: iB,
      description: `A[${iA}] + B[${iB}] = (${sumPt.x.toFixed(1)}, ${sumPt.y.toFixed(1)}) を追加`,
    });

    const nextA = (iA + 1) % nA;
    const nextB = (iB + 1) % nB;
    const angleA = angle(polyA[iA], polyA[nextA]);
    const angleB = angle(polyB[iB], polyB[nextB]);

    if (Math.abs(angleA - angleB) < 1e-9) {
      iA = nextA;
      iB = nextB;
      count += 2;
      steps.push({
        type: "merge_edge", polyA, polyB, result: [...result], idxA: iA, idxB: iB,
        description: `辺の角度が等しい: A,Bともに進める`,
      });
    } else if (angleA < angleB) {
      iA = nextA;
      count++;
      steps.push({
        type: "merge_edge", polyA, polyB, result: [...result], idxA: iA, idxB: iB,
        description: `Aの辺角度が小さい: A[${iA}] に進める`,
      });
    } else {
      iB = nextB;
      count++;
      steps.push({
        type: "merge_edge", polyA, polyB, result: [...result], idxA: iA, idxB: iB,
        description: `Bの辺角度が小さい: B[${iB}] に進める`,
      });
    }
  }

  steps.push({
    type: "done", polyA, polyB, result: [...result], idxA: -1, idxB: -1,
    description: `ミンコフスキー和完成: ${result.length} 頂点`,
  });

  return steps;
}

function parseInput(s: string): { polyA: Point[]; polyB: Point[] } | null {
  const parts = s.split("|").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const parse = (p: string) => p.split(";").map((c) => {
    const [x, y] = c.split(",").map(Number);
    return { x: x || 0, y: y || 0 };
  });
  const a = parse(parts[0]);
  const b = parse(parts[1]);
  if (a.length < 3 || b.length < 3) return null;
  return { polyA: a, polyB: b };
}

const SVG_W = 400;
const SVG_H = 350;
const PAD = 30;

export default function MinkowskiSumAnimationPage() {
  const [input, setInput] = useState("0,0;2,0;2,1;0,1|0,0;1,0;0.5,1");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const parsed = parseInput(s);
    if (!parsed) return;
    setSteps(generateSteps(parsed.polyA, parsed.polyB));
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

  const allPts = [...step.polyA, ...step.polyB, ...step.result];
  const xs = allPts.map((p) => p.x);
  const ys = allPts.map((p) => p.y);
  const minX = Math.min(...xs) - 0.5;
  const maxX = Math.max(...xs) + 0.5;
  const minY = Math.min(...ys) - 0.5;
  const maxY = Math.max(...ys) + 0.5;
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const toSvg = (p: Point) => ({
    sx: PAD + ((p.x - minX) / rangeX) * (SVG_W - 2 * PAD),
    sy: SVG_H - PAD - ((p.y - minY) / rangeY) * (SVG_H - 2 * PAD),
  });

  const polyAStr = step.polyA.map((p) => { const s = toSvg(p); return `${s.sx},${s.sy}`; }).join(" ");
  const polyBStr = step.polyB.map((p) => { const s = toSvg(p); return `${s.sx},${s.sy}`; }).join(" ");
  const resultStr = step.result.map((p) => { const s = toSvg(p); return `${s.sx},${s.sy}`; }).join(" ");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">ミンコフスキー和</h1>
        <p className="text-sm text-muted-foreground mb-6">2つの凸多角形のミンコフスキー和を計算</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="A: x,y;...|B: x,y;..." className="font-mono max-w-md" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-2 bg-white">
          <svg width={SVG_W} height={SVG_H} className="w-full h-auto" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            {/* Result polygon */}
            {step.result.length >= 3 && (
              <polygon points={resultStr} fill={step.type === "done" ? "#d1fae5" : "#dbeafe"} stroke={step.type === "done" ? "#10b981" : "#3b82f6"} strokeWidth={2} fillOpacity={0.4} />
            )}
            {/* Polygon A */}
            <polygon points={polyAStr} fill="#dbeafe" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={0.4} />
            {/* Polygon B */}
            <polygon points={polyBStr} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={0.4} />
            {/* Polygon A vertices */}
            {step.polyA.map((p, i) => {
              const { sx, sy } = toSvg(p);
              return (
                <g key={`a-${i}`}>
                  <circle cx={sx} cy={sy} r={4} fill={i === step.idxA ? "#3b82f6" : "#dbeafe"} stroke="#3b82f6" strokeWidth={1.5} />
                  <text x={sx} y={sy - 8} textAnchor="middle" fontSize={9} fill="#2563eb">A{i}</text>
                </g>
              );
            })}
            {/* Polygon B vertices */}
            {step.polyB.map((p, i) => {
              const { sx, sy } = toSvg(p);
              return (
                <g key={`b-${i}`}>
                  <circle cx={sx} cy={sy} r={4} fill={i === step.idxB ? "#f59e0b" : "#fef3c7"} stroke="#f59e0b" strokeWidth={1.5} />
                  <text x={sx} y={sy - 8} textAnchor="middle" fontSize={9} fill="#d97706">B{i}</text>
                </g>
              );
            })}
            {/* Result vertices */}
            {step.result.map((p, i) => {
              const { sx, sy } = toSvg(p);
              return <circle key={`r-${i}`} cx={sx} cy={sy} r={3} fill={step.type === "done" ? "#10b981" : "#6b7280"} stroke="white" strokeWidth={1} />;
            })}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>結果頂点数: {step.result.length}</span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>多角形A</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>多角形B</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>ミンコフスキー和</span></div>
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
