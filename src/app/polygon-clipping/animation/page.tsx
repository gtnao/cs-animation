"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface Point { x: number; y: number; }

type StepType = "init" | "check_vertex" | "add_vertex" | "add_intersection" | "skip_vertex" | "done";

interface Step {
  type: StepType;
  polygon: Point[];
  lineP1: Point;
  lineP2: Point;
  result: Point[];
  currentVertex: number;
  description: string;
}

// --- Sutherland-Hodgman style clipping ---

function cross2d(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function lineIntersect(p1: Point, p2: Point, p3: Point, p4: Point): Point {
  const d1 = cross2d(p3, p4, p1);
  const d2 = cross2d(p3, p4, p2);
  const t = d1 / (d1 - d2);
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  };
}

function generateSteps(polygon: Point[], lineP1: Point, lineP2: Point): Step[] {
  const steps: Step[] = [];
  const n = polygon.length;

  steps.push({
    type: "init",
    polygon,
    lineP1,
    lineP2,
    result: [],
    currentVertex: -1,
    description: `凸多角形 (${n}頂点) を直線で切断する`,
  });

  const result: Point[] = [];

  for (let i = 0; i < n; i++) {
    const cur = polygon[i];
    const next = polygon[(i + 1) % n];
    const curSide = cross2d(lineP1, lineP2, cur);
    const nextSide = cross2d(lineP1, lineP2, next);

    steps.push({
      type: "check_vertex",
      polygon,
      lineP1,
      lineP2,
      result: [...result],
      currentVertex: i,
      description: `頂点 ${i} (${cur.x}, ${cur.y}) をチェック: ${curSide >= 0 ? "左側 (保持)" : "右側 (除外)"}`,
    });

    if (curSide >= 0) {
      result.push(cur);
      steps.push({
        type: "add_vertex",
        polygon,
        lineP1,
        lineP2,
        result: [...result],
        currentVertex: i,
        description: `頂点 ${i} を結果に追加`,
      });
    } else {
      steps.push({
        type: "skip_vertex",
        polygon,
        lineP1,
        lineP2,
        result: [...result],
        currentVertex: i,
        description: `頂点 ${i} は切断線の右側なのでスキップ`,
      });
    }

    if ((curSide >= 0) !== (nextSide >= 0)) {
      const inter = lineIntersect(cur, next, lineP1, lineP2);
      result.push(inter);
      steps.push({
        type: "add_intersection",
        polygon,
        lineP1,
        lineP2,
        result: [...result],
        currentVertex: i,
        description: `辺 ${i}-${(i + 1) % n} と切断線の交点 (${inter.x.toFixed(1)}, ${inter.y.toFixed(1)}) を追加`,
      });
    }
  }

  steps.push({
    type: "done",
    polygon,
    lineP1,
    lineP2,
    result: [...result],
    currentVertex: -1,
    description: `切断完了: ${result.length} 頂点の凸多角形`,
  });

  return steps;
}

function parseInput(s: string): { polygon: Point[]; lineP1: Point; lineP2: Point } | null {
  const parts = s.split("|").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const polyPts = parts[0].split(";").map((p) => {
    const [x, y] = p.split(",").map(Number);
    return { x: x || 0, y: y || 0 };
  });
  const linePts = parts[1].split(";").map((p) => {
    const [x, y] = p.split(",").map(Number);
    return { x: x || 0, y: y || 0 };
  });
  if (polyPts.length < 3 || linePts.length !== 2) return null;
  return { polygon: polyPts, lineP1: linePts[0], lineP2: linePts[1] };
}

const SVG_W = 400;
const SVG_H = 350;
const PAD = 30;

export default function PolygonClippingAnimationPage() {
  const [input, setInput] = useState("0,0;6,0;6,4;3,6;0,4|1,1;5,5");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const parsed = parseInput(s);
    if (!parsed) return;
    setSteps(generateSteps(parsed.polygon, parsed.lineP1, parsed.lineP2));
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

  const allPts = [...step.polygon, step.lineP1, step.lineP2, ...step.result];
  const xs = allPts.map((p) => p.x);
  const ys = allPts.map((p) => p.y);
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

  const polyStr = step.polygon.map((p) => { const s = toSvg(p); return `${s.sx},${s.sy}`; }).join(" ");
  const resultStr = step.result.map((p) => { const s = toSvg(p); return `${s.sx},${s.sy}`; }).join(" ");

  // Extend line for visualization
  const dir = { x: step.lineP2.x - step.lineP1.x, y: step.lineP2.y - step.lineP1.y };
  const lA = toSvg({ x: step.lineP1.x - dir.x * 10, y: step.lineP1.y - dir.y * 10 });
  const lB = toSvg({ x: step.lineP1.x + dir.x * 10, y: step.lineP1.y + dir.y * 10 });

  return (
    <>
<div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="多角形|切断線 (x,y;...|x,y;x,y)" className="font-mono max-w-md" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-2 bg-white">
          <svg width={SVG_W} height={SVG_H} className="w-full h-auto" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            {/* Original polygon */}
            <polygon points={polyStr} fill="#f3f4f6" stroke="#9ca3af" strokeWidth={1.5} />
            {/* Result polygon */}
            {step.result.length >= 3 && (
              <polygon points={resultStr} fill={step.type === "done" ? "#d1fae5" : "#dbeafe"} stroke={step.type === "done" ? "#10b981" : "#3b82f6"} strokeWidth={2} fillOpacity={0.6} />
            )}
            {/* Cutting line */}
            <line x1={lA.sx} y1={lA.sy} x2={lB.sx} y2={lB.sy} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6,3" />
            {/* Polygon vertices */}
            {step.polygon.map((p, i) => {
              const { sx, sy } = toSvg(p);
              const isCurrent = i === step.currentVertex;
              const cr = cross2d(step.lineP1, step.lineP2, p);
              let fill = "#e5e7eb";
              let stroke = "#9ca3af";
              if (isCurrent) { fill = "#dbeafe"; stroke = "#3b82f6"; }
              else if (step.type === "done" && cr >= 0) { fill = "#d1fae5"; stroke = "#10b981"; }
              return (
                <g key={i}>
                  <circle cx={sx} cy={sy} r={5} fill={fill} stroke={stroke} strokeWidth={2} />
                  <text x={sx} y={sy - 10} textAnchor="middle" fontSize={10} fill="#374151">{i}</text>
                </g>
              );
            })}
            {/* Intersection points */}
            {step.result.filter((p) => !step.polygon.some((pp) => Math.abs(pp.x - p.x) < 0.01 && Math.abs(pp.y - p.y) < 0.01)).map((p, i) => {
              const { sx, sy } = toSvg(p);
              return <circle key={`inter-${i}`} cx={sx} cy={sy} r={4} fill="#fef3c7" stroke="#f59e0b" strokeWidth={2} />;
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
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>現在の頂点</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" /><span>交点</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>結果多角形</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>切断線</span></div>
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
