"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

type StepType = "init" | "add_line" | "query" | "remove_line" | "done";

interface Line {
  a: number;
  b: number;
}

interface Step {
  type: StepType;
  lines: Line[];
  queryX?: number;
  queryResult?: number;
  description: string;
  highlightLineIdx?: number;
}

// --- Algorithm ---

function generateSteps(): Step[] {
  const steps: Step[] = [];
  const lines: Line[] = [];

  // Lines to add: y = a*x + b
  const inputLines: Line[] = [
    { a: 3, b: 0 },
    { a: 1, b: 3 },
    { a: -1, b: 10 },
    { a: 2, b: -1 },
  ];

  const queries = [0, 1, 2, 3, 4, 5];

  steps.push({
    type: "init",
    lines: [],
    description: "Convex Hull Trick: 一次関数群の最小値クエリを高速に処理する",
  });

  // Add lines
  for (const line of inputLines) {
    // Remove lines that are no longer useful
    while (lines.length >= 2) {
      const l1 = lines[lines.length - 2];
      const l2 = lines[lines.length - 1];
      // Check if l2 is always above intersection of l1 and line
      const x12 = (l1.b - l2.b) / (l2.a - l1.a);
      const x23 = (l2.b - line.b) / (line.a - l2.a);
      if (x12 >= x23) {
        lines.pop();
        steps.push({
          type: "remove_line",
          lines: lines.map((l) => ({ ...l })),
          description: `直線 y=${l2.a}x+${l2.b} は不要なので除去`,
          highlightLineIdx: lines.length,
        });
      } else {
        break;
      }
    }

    lines.push({ ...line });
    steps.push({
      type: "add_line",
      lines: lines.map((l) => ({ ...l })),
      description: `直線 y=${line.a}x+${line.b >= 0 ? "+" : ""}${line.b} を追加。凸包上の直線数=${lines.length}`,
      highlightLineIdx: lines.length - 1,
    });
  }

  // Process queries
  for (const x of queries) {
    let minVal = Infinity;
    let minIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      const val = lines[i].a * x + lines[i].b;
      if (val < minVal) {
        minVal = val;
        minIdx = i;
      }
    }
    steps.push({
      type: "query",
      lines: lines.map((l) => ({ ...l })),
      queryX: x,
      queryResult: minVal,
      description: `クエリ x=${x}: min = ${minVal} (直線 y=${lines[minIdx].a}x+${lines[minIdx].b >= 0 ? "+" : ""}${lines[minIdx].b})`,
      highlightLineIdx: minIdx,
    });
  }

  steps.push({
    type: "done",
    lines: lines.map((l) => ({ ...l })),
    description: "完了",
  });

  return steps;
}

// --- Component ---

export default function ConvexHullTrickAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    setSteps(generateSteps());
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    setSteps(generateSteps());
    setCurrentStep(0);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((prev) => !prev); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Convex Hull Trick</h1>
        <p className="text-sm text-muted-foreground mb-6">一次関数群の最小値クエリを凸包で高速処理</p>

        <Button onClick={run} variant="outline" className="mb-8">リセット</Button>

        {/* Lines list */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">凸包上の直線群</div>
          <div className="flex gap-2 flex-wrap">
            {step.lines.map((line, idx) => {
              const base = "px-3 py-2 border rounded text-xs font-mono transition-colors";
              const cls = step.highlightLineIdx === idx
                ? `${base} bg-blue-100 border-blue-400 font-bold`
                : `${base} bg-white border-gray-200`;
              return (
                <div key={idx} className={cls}>
                  y = {line.a}x {line.b >= 0 ? "+" : ""}{line.b}
                </div>
              );
            })}
            {step.lines.length === 0 && <span className="text-sm text-muted-foreground">(空)</span>}
          </div>
        </div>

        {/* Query result */}
        {step.queryX !== undefined && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded">
            <span className="text-sm font-mono">x = {step.queryX} → min = {step.queryResult}</span>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>操作対象の直線</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
      </div>
    </div>
  );
}
