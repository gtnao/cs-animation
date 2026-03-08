"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "compute_moves" | "compute_mex" | "set_grundy" | "done";

interface Step {
  type: StepType;
  maxN: number;
  moves: number[];
  grundy: number[];
  currentPos: number;
  reachable: number[];
  reachableGrundy: number[];
  description: string;
}

// --- Step generation for a subtraction game ---
// Game: can remove 1, 2, or 3 stones. Player who takes the last stone wins.

function generateSteps(maxN: number, moves: number[]): Step[] {
  const steps: Step[] = [];
  const grundy = new Array(maxN + 1).fill(-1);

  steps.push({
    type: "init",
    maxN,
    moves,
    grundy: [...grundy],
    currentPos: -1,
    reachable: [],
    reachableGrundy: [],
    description: `Subtraction Game: 取れる数 = {${moves.join(", ")}}, 0~${maxN} のGrundy数を計算`,
  });

  // G(0) = 0 (losing position)
  grundy[0] = 0;
  steps.push({
    type: "set_grundy",
    maxN,
    moves,
    grundy: [...grundy],
    currentPos: 0,
    reachable: [],
    reachableGrundy: [],
    description: `G(0) = 0 (石がない = 負け)`,
  });

  for (let n = 1; n <= maxN; n++) {
    const reachable = moves.filter((m) => n - m >= 0).map((m) => n - m);
    const reachableGrundy = reachable.map((r) => grundy[r]);

    steps.push({
      type: "compute_moves",
      maxN,
      moves,
      grundy: [...grundy],
      currentPos: n,
      reachable,
      reachableGrundy,
      description: `n=${n}: 遷移先 = {${reachable.join(", ")}}`,
    });

    // Compute mex
    const grundySet = new Set(reachableGrundy);
    let mex = 0;
    while (grundySet.has(mex)) mex++;

    steps.push({
      type: "compute_mex",
      maxN,
      moves,
      grundy: [...grundy],
      currentPos: n,
      reachable,
      reachableGrundy,
      description: `n=${n}: 遷移先のGrundy値 = {${reachableGrundy.join(", ")}}, mex = ${mex}`,
    });

    grundy[n] = mex;

    steps.push({
      type: "set_grundy",
      maxN,
      moves,
      grundy: [...grundy],
      currentPos: n,
      reachable,
      reachableGrundy,
      description: `G(${n}) = ${mex} ${mex === 0 ? "(負け)" : "(勝ち)"}`,
    });
  }

  steps.push({
    type: "done",
    maxN,
    moves,
    grundy: [...grundy],
    currentPos: -1,
    reachable: [],
    reachableGrundy: [],
    description: "全てのGrundy数の計算が完了",
  });

  return steps;
}

function parseInput(s: string): { maxN: number; moves: number[] } | null {
  const parts = s.split("|").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const maxN = parseInt(parts[0]);
  const moves = parts[1].split(",").map(Number).filter((n) => n > 0);
  if (isNaN(maxN) || maxN < 1 || moves.length === 0) return null;
  return { maxN: Math.min(maxN, 20), moves };
}

export default function SpragueGrundyAnimationPage() {
  const [input, setInput] = useState("12|1,2,3");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const parsed = parseInput(s);
    if (!parsed) return;
    setSteps(generateSteps(parsed.maxN, parsed.moves));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(input); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 500);
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

  return (
    <>
<div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="最大N|取れる数(カンマ区切り)" className="font-mono max-w-md" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        {/* Grundy value table */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">Grundy数</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.grundy.map((g, idx) => {
              const computed = g >= 0;
              const isCurrent = idx === step.currentPos;
              const isReachable = step.reachable.includes(idx);
              let cls = "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              if (isCurrent) {
                cls += " bg-blue-100 border-blue-400 font-bold";
              } else if (isReachable) {
                cls += " bg-amber-50 border-amber-400";
              } else if (computed && g === 0) {
                cls += " bg-red-100 border-red-500";
              } else if (computed) {
                cls += " bg-emerald-100 border-emerald-500";
              } else {
                cls += " bg-gray-50 border-gray-200 text-muted-foreground";
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{computed ? g : "-"}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Arrows showing reachable states */}
        {step.reachable.length > 0 && step.currentPos >= 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            <span className="font-mono">
              {step.currentPos} → {"{" + step.reachable.join(", ") + "}"}
            </span>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>取れる数: {"{" + step.moves.join(", ") + "}"}</span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>計算中</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>遷移先</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>勝ち (G &gt; 0)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>負け (G = 0)</span></div>
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
