"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "pick" | "compare-shift" | "compare-stop" | "insert" | "done";

interface Step {
  type: StepType;
  array: number[];
  key?: number;
  keyIdx?: number;
  compareIdx?: number;
  sortedBound: number;
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const a = [...arr];
  const n = a.length;

  steps.push({
    type: "init",
    array: [...a],
    sortedBound: 1,
    description: `配列 [${a.join(", ")}] を挿入ソートで整列します`,
  });

  for (let i = 1; i < n; i++) {
    const key = a[i];

    steps.push({
      type: "pick",
      array: [...a],
      key,
      keyIdx: i,
      sortedBound: i,
      description: `a[${i}] = ${key} を取り出し、整列済み部分に挿入する位置を探す`,
    });

    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      steps.push({
        type: "compare-shift",
        array: [...a],
        key,
        keyIdx: i,
        compareIdx: j,
        sortedBound: i,
        description: `a[${j}] = ${a[j]} > ${key} なので右にシフト`,
      });
      a[j + 1] = a[j];
      j--;
    }

    if (j >= 0) {
      steps.push({
        type: "compare-stop",
        array: [...a],
        key,
        keyIdx: i,
        compareIdx: j,
        sortedBound: i,
        description: `a[${j}] = ${a[j]} ≤ ${key} なのでここに挿入`,
      });
    }

    a[j + 1] = key;
    steps.push({
      type: "insert",
      array: [...a],
      key,
      keyIdx: j + 1,
      sortedBound: i + 1,
      description: `${key} を位置 ${j + 1} に挿入 → [${a.join(", ")}]`,
    });
  }

  steps.push({
    type: "done",
    array: [...a],
    sortedBound: n,
    description: "ソート完了",
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step): string {
  const base =
    "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono font-bold transition-colors";

  if (step.type === "pick" && idx === step.keyIdx) {
    return `${base} bg-blue-100 border-blue-400`;
  }

  if (step.type === "compare-shift" && idx === step.compareIdx) {
    return `${base} bg-red-100 border-red-500`;
  }

  if (step.type === "compare-stop" && idx === step.compareIdx) {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

  if (step.type === "insert" && idx === step.keyIdx) {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

  if (idx < step.sortedBound && step.type !== "init") {
    return `${base} bg-amber-50 border-amber-400`;
  }

  if (step.type === "done") {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

function parseInput(s: string): number[] {
  return s
    .split(/[\s,]+/)
    .map((x) => parseInt(x, 10))
    .filter((x) => !isNaN(x));
}

export default function InsertionSortAnimationPage() {
  const [input, setInput] = useState("5, 3, 8, 1, 2");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const arr = parseInput(s);
    if (arr.length === 0) return;
    setSteps(generateSteps(arr));
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
    }, 500);
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
    <>
<div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="カンマ区切りで数値を入力"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            配列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.array.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step)}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        {step.key !== undefined && step.type !== "done" && step.type !== "init" && (
          <div className="mb-4 text-sm text-muted-foreground">
            挿入する値: <span className="font-mono font-semibold text-foreground">{step.key}</span>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>取り出した要素</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>整列済み部分</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>シフト</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>挿入位置確定</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
    </>
  );
}
