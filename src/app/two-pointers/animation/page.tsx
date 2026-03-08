"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "check" | "extend" | "shrink" | "update_best" | "done";

interface Step {
  type: StepType;
  arr: number[];
  left: number;
  right: number;
  currentSum: number;
  target: number;
  bestLeft: number;
  bestRight: number;
  bestLen: number;
  description: string;
}

function generateSteps(arr: number[], target: number): Step[] {
  const steps: Step[] = [];
  const n = arr.length;
  if (n === 0) return [];

  steps.push({
    type: "init",
    arr: [...arr],
    left: 0,
    right: 0,
    currentSum: 0,
    target,
    bestLeft: -1,
    bestRight: -1,
    bestLen: n + 1,
    description: `配列: [${arr.join(", ")}]。合計 ≥ ${target} となる最短区間を探索`,
  });

  let left = 0;
  let currentSum = 0;
  let bestLeft = -1;
  let bestRight = -1;
  let bestLen = n + 1;

  for (let right = 0; right < n; right++) {
    currentSum += arr[right];
    steps.push({
      type: "extend",
      arr: [...arr],
      left,
      right,
      currentSum,
      target,
      bestLeft,
      bestRight,
      bestLen,
      description: `右端を拡張: right=${right}, A[${right}]=${arr[right]} を加算。合計=${currentSum}`,
    });

    while (currentSum >= target) {
      const len = right - left + 1;
      if (len < bestLen) {
        bestLen = len;
        bestLeft = left;
        bestRight = right;
        steps.push({
          type: "update_best",
          arr: [...arr],
          left,
          right,
          currentSum,
          target,
          bestLeft,
          bestRight,
          bestLen,
          description: `合計=${currentSum} ≥ ${target}。最短更新: 区間[${left},${right}] 長さ${len}`,
        });
      } else {
        steps.push({
          type: "check",
          arr: [...arr],
          left,
          right,
          currentSum,
          target,
          bestLeft,
          bestRight,
          bestLen,
          description: `合計=${currentSum} ≥ ${target}。区間[${left},${right}] 長さ${len} (最短${bestLen}以上)`,
        });
      }

      currentSum -= arr[left];
      steps.push({
        type: "shrink",
        arr: [...arr],
        left: left + 1,
        right,
        currentSum,
        target,
        bestLeft,
        bestRight,
        bestLen,
        description: `左端を縮小: A[${left}]=${arr[left]} を減算。left=${left + 1}, 合計=${currentSum}`,
      });
      left++;
    }
  }

  steps.push({
    type: "done",
    arr: [...arr],
    left,
    right: n - 1,
    currentSum,
    target,
    bestLeft,
    bestRight,
    bestLen,
    description: bestLen <= n
      ? `探索完了: 最短区間 [${bestLeft},${bestRight}] 長さ${bestLen}`
      : `探索完了: 条件を満たす区間なし`,
  });

  return steps;
}

function getCellClass(idx: number, step: Step): string {
  const base =
    "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (step.type === "done" && idx >= step.bestLeft && idx <= step.bestRight && step.bestLeft >= 0) {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

  if (step.type !== "done" && idx >= step.left && idx <= step.right) {
    if (idx === step.left || idx === step.right) {
      return `${base} bg-blue-100 border-blue-400`;
    }
    return `${base} bg-amber-50 border-amber-400`;
  }

  return `${base} bg-white border-gray-200`;
}

export default function TwoPointersAnimationPage() {
  const [inputArr, setInputArr] = useState("2 3 1 2 4 3");
  const [inputTarget, setInputTarget] = useState("7");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((arrStr: string, targetStr: string) => {
    const nums = arrStr.trim().split(/[\s,]+/).map(Number).filter((x) => !isNaN(x));
    const target = parseInt(targetStr);
    if (nums.length === 0 || isNaN(target)) return;
    setSteps(generateSteps(nums, target));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputArr, inputTarget);
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">しゃくとり法 (Two Pointers)</h1>
        <p className="text-sm text-muted-foreground mb-6">
          合計がtarget以上となる最短の連続部分配列を探索
        </p>

        <div className="flex gap-2 mb-8">
          <Input value={inputArr} onChange={(e) => setInputArr(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputArr, inputTarget); }} placeholder="配列 (スペース区切り)" className="font-mono max-w-xs" />
          <Input value={inputTarget} onChange={(e) => setInputTarget(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputArr, inputTarget); }} placeholder="目標値" className="font-mono w-24" />
          <Button onClick={() => run(inputArr, inputTarget)} variant="outline">実行</Button>
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
          {step.type !== "init" && step.type !== "done" && (
            <>
              <span>left = <span className="font-mono font-semibold text-foreground">{step.left}</span></span>
              <span>right = <span className="font-mono font-semibold text-foreground">{step.right}</span></span>
              <span>合計 = <span className="font-mono font-semibold text-foreground">{step.currentSum}</span></span>
            </>
          )}
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>左端/右端</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>現在の区間</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>最短区間</span>
          </div>
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
