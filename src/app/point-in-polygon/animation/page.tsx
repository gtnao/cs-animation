"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface Point {
  x: number;
  y: number;
}

type StepType = "init" | "cast_ray" | "check_edge" | "intersect" | "no_intersect" | "result_inside" | "result_outside";

interface Step {
  type: StepType;
  polygon: Point[];
  query: Point;
  edgeIndex: number;
  crossingCount: number;
  description: string;
}

// --- Algorithm ---

function generateSteps(polygon: Point[], query: Point): Step[] {
  const steps: Step[] = [];
  const n = polygon.length;

  steps.push({
    type: "init",
    polygon,
    query,
    edgeIndex: -1,
    crossingCount: 0,
    description: `点 (${query.x}, ${query.y}) が多角形の内部にあるか判定する (Ray Casting法)`,
  });

  steps.push({
    type: "cast_ray",
    polygon,
    query,
    edgeIndex: -1,
    crossingCount: 0,
    description: "点から右方向に半直線を引き、辺との交差回数を数える",
  });

  let count = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const pi = polygon[i];
    const pj = polygon[j];

    steps.push({
      type: "check_edge",
      polygon,
      query,
      edgeIndex: i,
      crossingCount: count,
      description: `辺 ${i}-${j} (${pi.x},${pi.y})-(${pj.x},${pj.y}) をチェック`,
    });

    const intersects =
      ((pi.y > query.y) !== (pj.y > query.y)) &&
      query.x < pi.x + ((query.y - pi.y) / (pj.y - pi.y)) * (pj.x - pi.x);

    if (intersects) {
      count++;
      steps.push({
        type: "intersect",
        polygon,
        query,
        edgeIndex: i,
        crossingCount: count,
        description: `辺 ${i}-${j} と半直線が交差! 交差回数: ${count}`,
      });
    } else {
      steps.push({
        type: "no_intersect",
        polygon,
        query,
        edgeIndex: i,
        crossingCount: count,
        description: `辺 ${i}-${j} と半直線は交差しない。交差回数: ${count}`,
      });
    }
  }

  const inside = count % 2 === 1;
  steps.push({
    type: inside ? "result_inside" : "result_outside",
    polygon,
    query,
    edgeIndex: -1,
    crossingCount: count,
    description: inside
      ? `交差回数 ${count} (奇数) → 点は内部にある`
      : `交差回数 ${count} (偶数) → 点は外部にある`,
  });

  return steps;
}

function parseInput(s: string): { polygon: Point[]; query: Point } | null {
  const parts = s.split("|").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const polyPts = parts[0].split(";").map((p) => {
    const [x, y] = p.split(",").map(Number);
    return { x: x || 0, y: y || 0 };
  });
  const [qx, qy] = parts[1].split(",").map(Number);
  if (polyPts.length < 3) return null;
  return { polygon: polyPts, query: { x: qx || 0, y: qy || 0 } };
}

const SVG_W = 400;
const SVG_H = 300;
const PAD = 30;

export default function PointInPolygonAnimationPage() {
  const [input, setInput] = useState("0,0;4,0;4,3;2,5;0,3|2,2");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const parsed = parseInput(s);
    if (!parsed) return;
    setSteps(generateSteps(parsed.polygon, parsed.query));
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

  const allPts = [...step.polygon, step.query];
  const xs = allPts.map((p) => p.x);
  const ys = allPts.map((p) => p.y);
  const minX = Math.min(...xs) - 1;
  const maxX = Math.max(...xs) + 2;
  const minY = Math.min(...ys) - 1;
  const maxY = Math.max(...ys) + 1;
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const toSvg = (p: Point) => ({
    sx: PAD + ((p.x - minX) / rangeX) * (SVG_W - 2 * PAD),
    sy: SVG_H - PAD - ((p.y - minY) / rangeY) * (SVG_H - 2 * PAD),
  });

  const polyStr = step.polygon.map((p) => { const s = toSvg(p); return `${s.sx},${s.sy}`; }).join(" ");
  const qSvg = toSvg(step.query);

  return (
    <>
<div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="x,y;...;x,y|qx,qy" className="font-mono max-w-md" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-2 bg-white">
          <svg width={SVG_W} height={SVG_H} className="w-full h-auto" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            <polygon points={polyStr} fill="#f3f4f6" stroke="#9ca3af" strokeWidth={2} />
            {step.polygon.map((p, i) => {
              const j = (i + 1) % step.polygon.length;
              const a = toSvg(p);
              const b = toSvg(step.polygon[j]);
              let color = "#9ca3af";
              if (i === step.edgeIndex) {
                color = step.type === "intersect" ? "#10b981" : step.type === "no_intersect" ? "#ef4444" : "#f59e0b";
              }
              return <line key={i} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={color} strokeWidth={i === step.edgeIndex ? 3 : 2} />;
            })}
            {/* Ray */}
            {step.type !== "init" && (
              <line x1={qSvg.sx} y1={qSvg.sy} x2={SVG_W - PAD + 10} y2={qSvg.sy} stroke="#3b82f6" strokeWidth={1} strokeDasharray="4,4" />
            )}
            {/* Query point */}
            <circle cx={qSvg.sx} cy={qSvg.sy} r={6} fill={step.type === "result_inside" ? "#d1fae5" : step.type === "result_outside" ? "#fee2e2" : "#dbeafe"} stroke={step.type === "result_inside" ? "#10b981" : step.type === "result_outside" ? "#ef4444" : "#3b82f6"} strokeWidth={2} />
            {step.polygon.map((p, i) => {
              const s = toSvg(p);
              return <text key={i} x={s.sx} y={s.sy - 10} textAnchor="middle" fontSize={10} fill="#374151">{i}</text>;
            })}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>交差回数: {step.crossingCount}</span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>判定点</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>チェック中の辺</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>交差</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>非交差</span></div>
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
