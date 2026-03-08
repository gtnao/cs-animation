"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "heapify-compare" | "heapify-swap" | "heapify-done" | "extract" | "done";

interface Step {
  type: StepType;
  array: number[];
  heapSize: number;
  comparing?: [number, number];
  swapIndices?: [number, number];
  sortedIndices: number[];
  phase: "build" | "extract";
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const a = [...arr];
  const n = a.length;
  const sorted: number[] = [];

  steps.push({
    type: "init",
    array: [...a],
    heapSize: n,
    sortedIndices: [],
    phase: "build",
    description: `配列 [${a.join(", ")}] をヒープソートで整列します`,
  });

  // Sift down
  function siftDown(size: number, i: number, phase: "build" | "extract") {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < size) {
      steps.push({
        type: "heapify-compare",
        array: [...a],
        heapSize: size,
        comparing: [largest, left],
        sortedIndices: [...sorted],
        phase,
        description: `a[${largest}] = ${a[largest]} と a[${left}] = ${a[left]} を比較`,
      });
      if (a[left] > a[largest]) largest = left;
    }

    if (right < size) {
      steps.push({
        type: "heapify-compare",
        array: [...a],
        heapSize: size,
        comparing: [largest, right],
        sortedIndices: [...sorted],
        phase,
        description: `a[${largest}] = ${a[largest]} と a[${right}] = ${a[right]} を比較`,
      });
      if (a[right] > a[largest]) largest = right;
    }

    if (largest !== i) {
      [a[i], a[largest]] = [a[largest], a[i]];
      steps.push({
        type: "heapify-swap",
        array: [...a],
        heapSize: size,
        swapIndices: [i, largest],
        sortedIndices: [...sorted],
        phase,
        description: `a[${i}] と a[${largest}] を交換`,
      });
      siftDown(size, largest, phase);
    }
  }

  // Build max-heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    siftDown(n, i, "build");
  }

  steps.push({
    type: "heapify-done",
    array: [...a],
    heapSize: n,
    sortedIndices: [...sorted],
    phase: "build",
    description: `最大ヒープ構築完了: [${a.join(", ")}]`,
  });

  // Extract elements
  for (let i = n - 1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];
    sorted.push(i);

    steps.push({
      type: "extract",
      array: [...a],
      heapSize: i,
      swapIndices: [0, i],
      sortedIndices: [...sorted],
      phase: "extract",
      description: `最大値 ${a[i]} を位置 ${i} に配置`,
    });

    siftDown(i, 0, "extract");
  }

  sorted.push(0);
  steps.push({
    type: "done",
    array: [...a],
    heapSize: 0,
    sortedIndices: [...sorted],
    phase: "extract",
    description: "ソート完了",
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step): string {
  const base =
    "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono font-bold transition-colors";

  if (step.swapIndices && (step.type === "heapify-swap" || step.type === "extract")) {
    if (idx === step.swapIndices[0] || idx === step.swapIndices[1]) {
      return `${base} bg-red-100 border-red-500`;
    }
  }

  if (step.comparing) {
    if (idx === step.comparing[0] || idx === step.comparing[1]) {
      return `${base} bg-blue-100 border-blue-400`;
    }
  }

  if (step.sortedIndices.includes(idx)) {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

  if (idx < step.heapSize) {
    return `${base} bg-amber-50 border-amber-400`;
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

export default function HeapSortAnimationPage() {
  const [input, setInput] = useState("5, 3, 8, 1, 2, 7, 4, 6");
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

        <div className="mb-2 text-xs font-medium text-muted-foreground">
          フェーズ: {step.phase === "build" ? "ヒープ構築" : "要素抽出"} | ヒープサイズ: {step.heapSize}
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

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>比較中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>ヒープ領域</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>交換</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>ソート済み</span>
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
