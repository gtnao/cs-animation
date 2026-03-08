"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "count" | "accumulate" | "place" | "done";

interface Step {
  type: StepType;
  array: number[];
  countArray: number[];
  output: number[];
  highlightInput?: number;
  highlightCount?: number;
  highlightOutput?: number;
  maxVal: number;
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const a = [...arr];
  const n = a.length;
  const maxVal = Math.max(...a);
  const count = new Array(maxVal + 1).fill(0);
  const output = new Array(n).fill(-1);

  steps.push({
    type: "init",
    array: [...a],
    countArray: [...count],
    output: [...output],
    maxVal,
    description: `配列 [${a.join(", ")}] を計数ソートで整列します (最大値: ${maxVal})`,
  });

  // Count occurrences
  for (let i = 0; i < n; i++) {
    count[a[i]]++;
    steps.push({
      type: "count",
      array: [...a],
      countArray: [...count],
      output: [...output],
      highlightInput: i,
      highlightCount: a[i],
      maxVal,
      description: `a[${i}] = ${a[i]} をカウント → count[${a[i]}] = ${count[a[i]]}`,
    });
  }

  // Accumulate
  for (let i = 1; i <= maxVal; i++) {
    count[i] += count[i - 1];
    steps.push({
      type: "accumulate",
      array: [...a],
      countArray: [...count],
      output: [...output],
      highlightCount: i,
      maxVal,
      description: `累積和: count[${i}] = ${count[i]}`,
    });
  }

  // Place elements (right to left for stability)
  for (let i = n - 1; i >= 0; i--) {
    count[a[i]]--;
    output[count[a[i]]] = a[i];
    steps.push({
      type: "place",
      array: [...a],
      countArray: [...count],
      output: [...output],
      highlightInput: i,
      highlightOutput: count[a[i]],
      maxVal,
      description: `a[${i}] = ${a[i]} を出力位置 ${count[a[i]]} に配置`,
    });
  }

  steps.push({
    type: "done",
    array: [...output],
    countArray: [...count],
    output: [...output],
    maxVal,
    description: "ソート完了",
  });

  return steps;
}

// --- Cell styling ---

function getInputCellClass(idx: number, step: Step): string {
  const base =
    "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono font-bold transition-colors";
  if (idx === step.highlightInput) return `${base} bg-blue-100 border-blue-400`;
  return `${base} bg-white border-gray-200`;
}

function getCountCellClass(idx: number, step: Step): string {
  const base =
    "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono font-bold transition-colors";
  if (idx === step.highlightCount) return `${base} bg-amber-50 border-amber-400`;
  return `${base} bg-white border-gray-200`;
}

function getOutputCellClass(idx: number, step: Step): string {
  const base =
    "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono font-bold transition-colors";
  if (step.type === "done") return `${base} bg-emerald-100 border-emerald-500`;
  if (idx === step.highlightOutput) return `${base} bg-emerald-100 border-emerald-500`;
  if (step.output[idx] !== -1) return `${base} bg-amber-50 border-amber-400`;
  return `${base} bg-white border-gray-200`;
}

// --- Component ---

function parseInput(s: string): number[] {
  return s
    .split(/[\s,]+/)
    .map((x) => parseInt(x, 10))
    .filter((x) => !isNaN(x) && x >= 0);
}

export default function CountingSortAnimationPage() {
  const [input, setInput] = useState("4, 2, 2, 8, 3, 3, 1");
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
            placeholder="カンマ区切りで非負整数を入力"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* Input array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">入力配列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.array.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getInputCellClass(idx, step)}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Count array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">カウント配列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.countArray.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCountCellClass(idx, step)}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Output array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">出力配列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.output.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getOutputCellClass(idx, step)}>{val === -1 ? "–" : val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
              </div>
            ))}
          </div>
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
            <span>処理中の入力要素</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>更新中のカウント</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>配置済み</span>
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
