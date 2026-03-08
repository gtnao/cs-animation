"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "compute_mid"
  | "compare_equal"
  | "compare_less"
  | "compare_greater"
  | "found"
  | "not_found"
  | "done";

interface Step {
  type: StepType;
  lo: number;
  hi: number;
  mid: number;
  target: number;
  array: number[];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(array: number[], target: number): Step[] {
  const steps: Step[] = [];
  let lo = 0;
  let hi = array.length - 1;

  steps.push({
    type: "init",
    lo,
    hi,
    mid: -1,
    target,
    array: [...array],
    description: `ソート済み配列から ${target} を探索。lo=${lo}, hi=${hi}`,
  });

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);

    steps.push({
      type: "compute_mid",
      lo,
      hi,
      mid,
      target,
      array: [...array],
      description: `mid = floor((${lo} + ${hi}) / 2) = ${mid}, A[${mid}] = ${array[mid]}`,
    });

    if (array[mid] === target) {
      steps.push({
        type: "found",
        lo,
        hi,
        mid,
        target,
        array: [...array],
        description: `A[${mid}] = ${array[mid]} = ${target} → 発見!`,
      });
      steps.push({
        type: "done",
        lo,
        hi,
        mid,
        target,
        array: [...array],
        description: `探索完了: インデックス ${mid} で発見`,
      });
      return steps;
    } else if (array[mid] < target) {
      steps.push({
        type: "compare_less",
        lo,
        hi,
        mid,
        target,
        array: [...array],
        description: `A[${mid}] = ${array[mid]} < ${target} → 右半分を探索 (lo = ${mid + 1})`,
      });
      lo = mid + 1;
    } else {
      steps.push({
        type: "compare_greater",
        lo,
        hi,
        mid,
        target,
        array: [...array],
        description: `A[${mid}] = ${array[mid]} > ${target} → 左半分を探索 (hi = ${mid - 1})`,
      });
      hi = mid - 1;
    }
  }

  steps.push({
    type: "not_found",
    lo,
    hi,
    mid: -1,
    target,
    array: [...array],
    description: `lo(${lo}) > hi(${hi}) → ${target} は配列に存在しない`,
  });

  steps.push({
    type: "done",
    lo,
    hi,
    mid: -1,
    target,
    array: [...array],
    description: "探索完了: 見つからなかった",
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step): string {
  const base =
    "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (step.type === "found" && idx === step.mid) {
    return `${base} bg-emerald-100 border-emerald-500 font-bold`;
  }

  if (step.type === "done" && step.mid === idx && step.array[idx] === step.target) {
    return `${base} bg-emerald-100 border-emerald-500 font-bold`;
  }

  if (
    idx === step.mid &&
    step.mid >= 0 &&
    step.type !== "done" &&
    step.type !== "not_found"
  ) {
    return `${base} bg-blue-100 border-blue-400`;
  }

  if (idx >= step.lo && idx <= step.hi && step.type !== "done" && step.type !== "not_found") {
    return `${base} bg-amber-50 border-amber-400`;
  }

  if (step.type === "not_found" || step.type === "done") {
    return `${base} bg-white border-gray-200`;
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

const DEFAULT_ARRAY = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
const DEFAULT_TARGET = 13;

export default function BinarySearchAnimationPage() {
  const [arrayInput, setArrayInput] = useState(DEFAULT_ARRAY.join(", "));
  const [targetInput, setTargetInput] = useState(String(DEFAULT_TARGET));
  const [array, setArray] = useState(DEFAULT_ARRAY);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((arr: number[], target: number) => {
    const sorted = [...arr].sort((a, b) => a - b);
    setArray(sorted);
    setSteps(generateSteps(sorted, target));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(DEFAULT_ARRAY, DEFAULT_TARGET);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, steps.length]);

  // Keyboard shortcuts
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

  const handleRun = () => {
    const nums = arrayInput
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    const target = parseInt(targetInput.trim(), 10);
    if (nums.length === 0 || isNaN(target)) return;
    run(nums, target);
  };

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">二分探索</h1>
        <p className="text-sm text-muted-foreground mb-6">
          ソート済み配列から目標値を O(log n) で探索するアルゴリズム
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input
            value={arrayInput}
            onChange={(e) => setArrayInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRun();
            }}
            placeholder="配列 (例: 1, 3, 5, 7)"
            className="font-mono max-w-sm"
          />
          <Input
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRun();
            }}
            placeholder="目標値"
            className="font-mono max-w-[100px]"
          />
          <Button onClick={handleRun} variant="outline">
            実行
          </Button>
        </div>

        {/* Array visualization */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            配列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {array.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step)}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pointers */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.type !== "done" && step.type !== "not_found" && (
            <>
              <span>
                lo ={" "}
                <span className="font-mono font-semibold text-foreground">
                  {step.lo}
                </span>
              </span>
              <span>
                hi ={" "}
                <span className="font-mono font-semibold text-foreground">
                  {step.hi}
                </span>
              </span>
              {step.mid >= 0 && (
                <span>
                  mid ={" "}
                  <span className="font-mono font-semibold text-foreground">
                    {step.mid}
                  </span>
                </span>
              )}
            </>
          )}
          <span>
            target ={" "}
            <span className="font-mono font-semibold text-foreground">
              {step.target}
            </span>
          </span>
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Description */}
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>mid (現在の比較位置)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>探索範囲 [lo, hi]</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>発見</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep((prev) => Math.max(0, prev - 1));
              setIsPlaying(false);
            }}
            disabled={currentStep === 0}
          >
            ← 前へ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep((prev) =>
                Math.min(steps.length - 1, prev + 1)
              );
              setIsPlaying(false);
            }}
            disabled={currentStep === steps.length - 1}
          >
            次へ →
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying((prev) => !prev)}
            disabled={currentStep === steps.length - 1}
          >
            {isPlaying ? "停止" : "再生"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep(0);
              setIsPlaying(false);
            }}
          >
            リセット
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
      </div>
    </div>
  );
}
