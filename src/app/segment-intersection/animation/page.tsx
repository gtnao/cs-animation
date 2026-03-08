"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface Point {
  x: number;
  y: number;
}

interface Segment {
  p1: Point;
  p2: Point;
}

type StepType =
  | "init"
  | "compute_d1"
  | "compute_d2"
  | "compute_d3"
  | "compute_d4"
  | "check_straddle1"
  | "check_straddle2"
  | "check_collinear"
  | "result_intersect"
  | "result_no_intersect";

interface Step {
  type: StepType;
  seg1: Segment;
  seg2: Segment;
  d1?: number;
  d2?: number;
  d3?: number;
  d4?: number;
  description: string;
}

// --- Cross product ---

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function onSegment(p: Point, q: Point, r: Point): boolean {
  return (
    Math.min(p.x, r.x) <= q.x &&
    q.x <= Math.max(p.x, r.x) &&
    Math.min(p.y, r.y) <= q.y &&
    q.y <= Math.max(p.y, r.y)
  );
}

// --- Step generation ---

function generateSteps(seg1: Segment, seg2: Segment): Step[] {
  const steps: Step[] = [];

  steps.push({
    type: "init",
    seg1,
    seg2,
    description: "2つの線分の交差判定を開始",
  });

  const d1 = cross(seg1.p1, seg1.p2, seg2.p1);
  steps.push({
    type: "compute_d1",
    seg1,
    seg2,
    d1,
    description: `d1 = cross(A, B, C) = ${d1.toFixed(1)}`,
  });

  const d2 = cross(seg1.p1, seg1.p2, seg2.p2);
  steps.push({
    type: "compute_d2",
    seg1,
    seg2,
    d1,
    d2,
    description: `d2 = cross(A, B, D) = ${d2.toFixed(1)}`,
  });

  const d3 = cross(seg2.p1, seg2.p2, seg1.p1);
  steps.push({
    type: "compute_d3",
    seg1,
    seg2,
    d1,
    d2,
    d3,
    description: `d3 = cross(C, D, A) = ${d3.toFixed(1)}`,
  });

  const d4 = cross(seg2.p1, seg2.p2, seg1.p2);
  steps.push({
    type: "compute_d4",
    seg1,
    seg2,
    d1,
    d2,
    d3,
    d4,
    description: `d4 = cross(C, D, B) = ${d4.toFixed(1)}`,
  });

  steps.push({
    type: "check_straddle1",
    seg1,
    seg2,
    d1,
    d2,
    d3,
    d4,
    description: `d1 * d2 = ${(d1 * d2).toFixed(1)} ${d1 * d2 < 0 ? "< 0: C,DはABの両側" : ">= 0: C,DはABの同じ側"}`,
  });

  steps.push({
    type: "check_straddle2",
    seg1,
    seg2,
    d1,
    d2,
    d3,
    d4,
    description: `d3 * d4 = ${(d3 * d4).toFixed(1)} ${d3 * d4 < 0 ? "< 0: A,BはCDの両側" : ">= 0: A,BはCDの同じ側"}`,
  });

  const intersect =
    (d1 * d2 < 0 && d3 * d4 < 0) ||
    (d1 === 0 && onSegment(seg1.p1, seg2.p1, seg1.p2)) ||
    (d2 === 0 && onSegment(seg1.p1, seg2.p2, seg1.p2)) ||
    (d3 === 0 && onSegment(seg2.p1, seg1.p1, seg2.p2)) ||
    (d4 === 0 && onSegment(seg2.p1, seg1.p2, seg2.p2));

  if (d1 === 0 || d2 === 0 || d3 === 0 || d4 === 0) {
    steps.push({
      type: "check_collinear",
      seg1,
      seg2,
      d1,
      d2,
      d3,
      d4,
      description: "外積が0の場合: 共線性チェックを実施",
    });
  }

  steps.push({
    type: intersect ? "result_intersect" : "result_no_intersect",
    seg1,
    seg2,
    d1,
    d2,
    d3,
    d4,
    description: intersect ? "判定結果: 交差する" : "判定結果: 交差しない",
  });

  return steps;
}

function parseSegments(s: string): [Segment, Segment] | null {
  const parts = s.split("|").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const parse = (p: string): Segment | null => {
    const coords = p.split(";").map((c) => c.trim());
    if (coords.length !== 2) return null;
    const [x1, y1] = coords[0].split(",").map(Number);
    const [x2, y2] = coords[1].split(",").map(Number);
    return { p1: { x: x1 || 0, y: y1 || 0 }, p2: { x: x2 || 0, y: y2 || 0 } };
  };
  const s1 = parse(parts[0]);
  const s2 = parse(parts[1]);
  if (!s1 || !s2) return null;
  return [s1, s2];
}

// --- Component ---

const SVG_W = 400;
const SVG_H = 300;
const PAD = 30;

export default function SegmentIntersectionAnimationPage() {
  const [input, setInput] = useState("1,1;4,4|1,4;4,1");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const result = parseSegments(s);
    if (!result) return;
    const [s1, s2] = result;
    setSteps(generateSteps(s1, s2));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const allPts = [step.seg1.p1, step.seg1.p2, step.seg2.p1, step.seg2.p2];
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

  const a = toSvg(step.seg1.p1);
  const b = toSvg(step.seg1.p2);
  const c = toSvg(step.seg2.p1);
  const d = toSvg(step.seg2.p2);

  const isResult = step.type === "result_intersect" || step.type === "result_no_intersect";
  const seg1Color = isResult ? (step.type === "result_intersect" ? "#10b981" : "#ef4444") : "#3b82f6";
  const seg2Color = isResult ? (step.type === "result_intersect" ? "#10b981" : "#ef4444") : "#f59e0b";

  return (
    <>
<div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") run(input); }}
            placeholder="x1,y1;x2,y2|x3,y3;x4,y4"
            className="font-mono max-w-md"
          />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-2 bg-white">
          <svg width={SVG_W} height={SVG_H} className="w-full h-auto" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={seg1Color} strokeWidth={3} />
            <line x1={c.sx} y1={c.sy} x2={d.sx} y2={d.sy} stroke={seg2Color} strokeWidth={3} />
            <circle cx={a.sx} cy={a.sy} r={5} fill={seg1Color} />
            <circle cx={b.sx} cy={b.sy} r={5} fill={seg1Color} />
            <circle cx={c.sx} cy={c.sy} r={5} fill={seg2Color} />
            <circle cx={d.sx} cy={d.sy} r={5} fill={seg2Color} />
            <text x={a.sx} y={a.sy - 10} textAnchor="middle" fontSize={12} fill="#374151" fontWeight="bold">A</text>
            <text x={b.sx} y={b.sy - 10} textAnchor="middle" fontSize={12} fill="#374151" fontWeight="bold">B</text>
            <text x={c.sx} y={c.sy - 10} textAnchor="middle" fontSize={12} fill="#374151" fontWeight="bold">C</text>
            <text x={d.sx} y={d.sy - 10} textAnchor="middle" fontSize={12} fill="#374151" fontWeight="bold">D</text>
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>線分AB</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>線分CD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>交差</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>非交差</span>
          </div>
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
