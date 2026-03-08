"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "add" | "remove" | "compute" | "slide" | "done";

interface Step {
  type: StepType;
  arr: number[];
  windowStart: number;
  windowEnd: number;
  windowSize: number;
  windowSum: number;
  maxSum: number;
  maxStart: number;
  description: string;
}

function generateSteps(arr: number[], k: number): Step[] {
  const steps: Step[] = [];
  const n = arr.length;
  if (n === 0 || k <= 0 || k > n) return [];

  steps.push({
    type: "init",
    arr: [...arr],
    windowStart: 0,
    windowEnd: -1,
    windowSize: k,
    windowSum: 0,
    maxSum: -Infinity,
    maxStart: -1,
    description: `配列: [${arr.join(", ")}]。ウィンドウサイズ k=${k} で最大和を探索`,
  });

  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
    steps.push({
      type: "add",
      arr: [...arr],
      windowStart: 0,
      windowEnd: i,
      windowSize: k,
      windowSum,
      maxSum: -Infinity,
      maxStart: -1,
      description: `初期ウィンドウ構築: A[${i}]=${arr[i]} を加算。合計=${windowSum}`,
    });
  }

  let maxSum = windowSum;
  let maxStart = 0;
  steps.push({
    type: "compute",
    arr: [...arr],
    windowStart: 0,
    windowEnd: k - 1,
    windowSize: k,
    windowSum,
    maxSum,
    maxStart,
    description: `初期ウィンドウ [0, ${k - 1}] の合計=${windowSum}。最大=${maxSum}`,
  });

  for (let i = k; i < n; i++) {
    windowSum += arr[i] - arr[i - k];
    steps.push({
      type: "slide",
      arr: [...arr],
      windowStart: i - k + 1,
      windowEnd: i,
      windowSize: k,
      windowSum,
      maxSum,
      maxStart,
      description: `スライド: +A[${i}]=${arr[i]}, -A[${i - k}]=${arr[i - k]}。合計=${windowSum}`,
    });

    if (windowSum > maxSum) {
      maxSum = windowSum;
      maxStart = i - k + 1;
      steps.push({
        type: "compute",
        arr: [...arr],
        windowStart: i - k + 1,
        windowEnd: i,
        windowSize: k,
        windowSum,
        maxSum,
        maxStart,
        description: `最大更新: ウィンドウ [${i - k + 1}, ${i}] 合計=${windowSum}`,
      });
    }
  }

  steps.push({
    type: "done",
    arr: [...arr],
    windowStart: maxStart,
    windowEnd: maxStart + k - 1,
    windowSize: k,
    windowSum: maxSum,
    maxSum,
    maxStart,
    description: `探索完了: 最大和=${maxSum} (区間 [${maxStart}, ${maxStart + k - 1}])`,
  });

  return steps;
}

function getCellClass(idx: number, step: Step): string {
  const base =
    "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (step.type === "done" && idx >= step.maxStart && idx <= step.maxStart + step.windowSize - 1) {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

  if (step.type !== "done" && idx >= step.windowStart && idx <= step.windowEnd) {
    return `${base} bg-amber-50 border-amber-400`;
  }

  return `${base} bg-white border-gray-200`;
}

export default function SlidingWindowAnimationPage() {
  const [inputArr, setInputArr] = useState("1 4 2 10 2 3 1 0 20");
  const [inputK, setInputK] = useState("4");
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

  useEffect(() => {
    run(inputArr, inputK);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <Input value={inputArr} onChange={(e) => setInputArr(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputArr, inputK); }} placeholder="配列 (スペース区切り)" className="font-mono max-w-xs" />
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

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>ウィンドウ合計 = <span className="font-mono font-semibold text-foreground">{step.windowSum === -Infinity ? "–" : step.windowSum}</span></span>
          <span>最大和 = <span className="font-mono font-semibold text-foreground">{step.maxSum === -Infinity ? "–" : step.maxSum}</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>現在のウィンドウ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>最大和のウィンドウ</span>
          </div>
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
