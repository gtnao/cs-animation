"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "add_set" | "subtract_intersection" | "add_intersection" | "done";

interface Step {
  type: StepType;
  sets: number[][];
  universe: number;
  currentSubset: number[];
  currentSubsetIndices: number[];
  sign: number;
  contribution: number;
  runningTotal: number;
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(sets: number[][]): Step[] {
  const steps: Step[] = [];
  const n = sets.length;

  // Compute universe size (just max element + 1 for display)
  const allElements = new Set<number>();
  for (const s of sets) {
    for (const e of s) allElements.add(e);
  }
  const universe = allElements.size > 0 ? Math.max(...allElements) + 1 : 0;

  steps.push({
    type: "init",
    sets,
    universe,
    currentSubset: [],
    currentSubsetIndices: [],
    sign: 0,
    contribution: 0,
    runningTotal: 0,
    description: `${n} 個の集合の和集合の要素数を包除原理で計算する`,
  });

  let total = 0;

  // Iterate over all non-empty subsets of {0, 1, ..., n-1}
  for (let mask = 1; mask < (1 << n); mask++) {
    const indices: number[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) indices.push(i);
    }

    // Compute intersection
    let intersection = new Set<number>(sets[indices[0]]);
    for (let i = 1; i < indices.length; i++) {
      const s = new Set<number>(sets[indices[i]]);
      intersection = new Set([...intersection].filter((x) => s.has(x)));
    }

    const size = intersection.size;
    const sign = indices.length % 2 === 1 ? 1 : -1;
    total += sign * size;

    const setNames = indices.map((i) => `A${i + 1}`).join(" ∩ ");
    const signStr = sign === 1 ? "+" : "-";

    steps.push({
      type: sign === 1
        ? (indices.length === 1 ? "add_set" : "add_intersection")
        : "subtract_intersection",
      sets,
      universe,
      currentSubset: [...intersection],
      currentSubsetIndices: indices,
      sign,
      contribution: size,
      runningTotal: total,
      description: `${signStr} |${setNames}| = ${signStr} ${size}  →  合計 = ${total}`,
    });
  }

  steps.push({
    type: "done",
    sets,
    universe,
    currentSubset: [],
    currentSubsetIndices: [],
    sign: 0,
    contribution: 0,
    runningTotal: total,
    description: `計算完了: |A1 ∪ ... ∪ A${n}| = ${total}`,
  });

  return steps;
}

function parseSets(input: string): number[][] {
  // Format: "{1,2,3},{2,3,4},{3,4,5}"
  const result: number[][] = [];
  const parts = input.split("},{");
  for (const part of parts) {
    const cleaned = part.replace(/[{}]/g, "").trim();
    if (cleaned.length === 0) continue;
    const nums = cleaned.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    result.push(nums);
  }
  return result;
}

// --- Component ---

export default function InclusionExclusionAnimationPage() {
  const [input, setInput] = useState("{1,2,3,4},{2,3,5,6},{3,4,6,7}");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const sets = parseSets(s);
    if (sets.length === 0 || sets.length > 5) return;
    setSteps(generateSteps(sets));
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
    }, 700);
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
        if (currentStep < steps.length - 1) {
          setIsPlaying((prev) => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">包除原理</h1>
        <p className="text-sm text-muted-foreground mb-6">
          集合の和集合を交互の加減算で計算する過程を可視化
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") run(input); }}
            placeholder="{1,2,3},{2,3,4},{3,4,5}"
            className="font-mono max-w-md"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* Sets display */}
        <div className="mb-6 space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            集合
          </div>
          {step.sets.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-sm font-mono w-8">A{idx + 1}:</span>
              <div className="flex gap-1">
                {s.map((elem, eidx) => {
                  const base =
                    "w-8 h-8 flex items-center justify-center border-2 text-xs font-mono transition-colors";
                  const isInCurrent = step.currentSubset.includes(elem);
                  const isActiveSet = step.currentSubsetIndices.includes(idx);
                  let cls: string;
                  if (isActiveSet && isInCurrent) {
                    cls = step.sign === 1
                      ? `${base} bg-emerald-100 border-emerald-500`
                      : `${base} bg-red-100 border-red-500`;
                  } else if (isActiveSet) {
                    cls = `${base} bg-amber-50 border-amber-400`;
                  } else {
                    cls = `${base} bg-white border-gray-200`;
                  }
                  return <div key={eidx} className={cls}>{elem}</div>;
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Running total */}
        <div className="mb-6 p-3 border border-border rounded">
          <span className="text-sm font-mono">
            現在の合計 = <span className="font-bold text-lg">{step.runningTotal}</span>
          </span>
        </div>

        {/* Result */}
        {step.type === "done" && (
          <div className="mb-6 p-4 border border-emerald-500 bg-emerald-50 rounded">
            <span className="text-sm font-mono font-bold">
              |A1 ∪ ... ∪ A{step.sets.length}| = {step.runningTotal}
            </span>
          </div>
        )}

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        {/* Description */}
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>対象集合</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>加算 (共通部分)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>減算 (共通部分)</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
      </div>
    </div>
  );
}
