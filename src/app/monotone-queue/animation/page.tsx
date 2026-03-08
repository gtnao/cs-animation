"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "remove_back" | "push_back" | "remove_front" | "record_min" | "done";

interface Step {
  type: StepType;
  arr: number[];
  deque: number[];
  windowStart: number;
  windowEnd: number;
  k: number;
  result: number[];
  currentIndex: number;
  description: string;
}

function generateSteps(arr: number[], k: number): Step[] {
  const steps: Step[] = [];
  const n = arr.length;
  if (n === 0 || k <= 0 || k > n) return [];

  const deque: number[] = [];
  const result: number[] = [];

  steps.push({
    type: "init",
    arr: [...arr],
    deque: [],
    windowStart: 0,
    windowEnd: -1,
    k,
    result: [],
    currentIndex: -1,
    description: `配列: [${arr.join(", ")}]。ウィンドウサイズ k=${k} でスライディングウィンドウ最小値を求める`,
  });

  for (let i = 0; i < n; i++) {
    // Remove elements from back that are >= arr[i]
    while (deque.length > 0 && arr[deque[deque.length - 1]] >= arr[i]) {
      const removed = deque.pop()!;
      steps.push({
        type: "remove_back",
        arr: [...arr],
        deque: [...deque],
        windowStart: Math.max(0, i - k + 1),
        windowEnd: i,
        k,
        result: [...result],
        currentIndex: i,
        description: `A[${removed}]=${arr[removed]} ≥ A[${i}]=${arr[i]}。後ろからpop`,
      });
    }

    deque.push(i);
    steps.push({
      type: "push_back",
      arr: [...arr],
      deque: [...deque],
      windowStart: Math.max(0, i - k + 1),
      windowEnd: i,
      k,
      result: [...result],
      currentIndex: i,
      description: `i=${i} (値${arr[i]}) をデックに追加。デック: [${deque.map((d) => `${d}(${arr[d]})`).join(", ")}]`,
    });

    // Remove front if out of window
    if (deque[0] <= i - k) {
      const removed = deque.shift()!;
      steps.push({
        type: "remove_front",
        arr: [...arr],
        deque: [...deque],
        windowStart: i - k + 1,
        windowEnd: i,
        k,
        result: [...result],
        currentIndex: i,
        description: `インデックス ${removed} はウィンドウ外。前からpop`,
      });
    }

    if (i >= k - 1) {
      result.push(arr[deque[0]]);
      steps.push({
        type: "record_min",
        arr: [...arr],
        deque: [...deque],
        windowStart: i - k + 1,
        windowEnd: i,
        k,
        result: [...result],
        currentIndex: i,
        description: `ウィンドウ [${i - k + 1}, ${i}] の最小値 = A[${deque[0]}] = ${arr[deque[0]]}`,
      });
    }
  }

  steps.push({
    type: "done",
    arr: [...arr],
    deque: [...deque],
    windowStart: n - k,
    windowEnd: n - 1,
    k,
    result: [...result],
    currentIndex: -1,
    description: `完了。各ウィンドウの最小値: [${result.join(", ")}]`,
  });

  return steps;
}

function getCellClass(idx: number, step: Step): string {
  const base =
    "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (idx === step.currentIndex) {
    return `${base} bg-blue-100 border-blue-400`;
  }
  if (step.deque.length > 0 && idx === step.deque[0] && step.type === "record_min") {
    return `${base} bg-emerald-100 border-emerald-500`;
  }
  if (idx >= step.windowStart && idx <= step.windowEnd && step.windowEnd >= 0) {
    return `${base} bg-amber-50 border-amber-400`;
  }

  return `${base} bg-white border-gray-200`;
}

export default function MonotoneQueueAnimationPage() {
  const [inputArr, setInputArr] = useState("1 3 -1 -3 5 3 6 7");
  const [inputK, setInputK] = useState("3");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((arrStr: string, kStr: string) => {
    const nums = arrStr.trim().split(/[\s,]+/).map(Number).filter((x) => !isNaN(x));
    const k = parseInt(kStr);
    if (nums.length === 0 || isNaN(k) || k <= 0 || k > nums.length) return;
    setSteps(generateSteps(nums, k));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(inputArr, inputK); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 500);
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
    <>
<div className="flex gap-2 mb-8">
          <Input value={inputArr} onChange={(e) => setInputArr(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputArr, inputK); }} placeholder="配列" className="font-mono max-w-xs" />
          <Input value={inputK} onChange={(e) => setInputK(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputArr, inputK); }} placeholder="k" className="font-mono w-20" />
          <Button onClick={() => run(inputArr, inputK)} variant="outline">実行</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">配列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.arr.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step)}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">デック (インデックス)</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.deque.length > 0 ? step.deque.map((d, idx) => (
              <div key={idx} className="w-14 h-10 flex items-center justify-center border-2 bg-amber-50 border-amber-400 text-sm font-mono">{d}({step.arr[d]})</div>
            )) : <div className="text-sm text-muted-foreground">（空）</div>}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">各ウィンドウの最小値</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.result.map((val, idx) => (
              <div key={idx} className="w-12 h-10 flex items-center justify-center border-2 bg-emerald-100 border-emerald-500 text-sm font-mono">{val}</div>
            ))}
            {step.result.length === 0 && <div className="text-sm text-muted-foreground">（まだなし）</div>}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>現在の要素</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>ウィンドウ/デック</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>最小値</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
    </>
  );
}
