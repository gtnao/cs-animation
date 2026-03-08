"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "pick_pivot" | "partition_scan" | "partition_swap" | "partition_done" | "recurse" | "found" | "done";

interface Step {
  type: StepType;
  arr: number[];
  left: number;
  right: number;
  pivotIndex: number;
  pivotValue: number;
  scanIndex: number;
  storeIndex: number;
  targetRank: number;
  description: string;
}

function generateSteps(arr: number[], k: number): Step[] {
  const steps: Step[] = [];
  const a = [...arr];
  const n = a.length;

  steps.push({
    type: "init",
    arr: [...a],
    left: 0,
    right: n - 1,
    pivotIndex: -1,
    pivotValue: 0,
    scanIndex: -1,
    storeIndex: -1,
    targetRank: k,
    description: `配列: [${a.join(", ")}]。乱択QuickSelectで${k}番目に小さい要素を探索`,
  });

  function quickSelect(lo: number, hi: number, target: number) {
    if (lo >= hi) {
      steps.push({
        type: "found",
        arr: [...a],
        left: lo,
        right: hi,
        pivotIndex: lo,
        pivotValue: a[lo],
        scanIndex: -1,
        storeIndex: -1,
        targetRank: target,
        description: `発見: A[${lo}] = ${a[lo]} が ${k}番目の要素`,
      });
      return;
    }

    // Random pivot
    const pivotIdx = lo + Math.floor(Math.random() * (hi - lo + 1));
    const pivotVal = a[pivotIdx];
    steps.push({
      type: "pick_pivot",
      arr: [...a],
      left: lo,
      right: hi,
      pivotIndex: pivotIdx,
      pivotValue: pivotVal,
      scanIndex: -1,
      storeIndex: lo,
      targetRank: target,
      description: `ピボットをランダム選択: A[${pivotIdx}] = ${pivotVal} (区間 [${lo}, ${hi}])`,
    });

    // Move pivot to end
    [a[pivotIdx], a[hi]] = [a[hi], a[pivotIdx]];
    let storeIdx = lo;

    for (let i = lo; i < hi; i++) {
      steps.push({
        type: "partition_scan",
        arr: [...a],
        left: lo,
        right: hi,
        pivotIndex: hi,
        pivotValue: pivotVal,
        scanIndex: i,
        storeIndex: storeIdx,
        targetRank: target,
        description: `A[${i}]=${a[i]} ${a[i] < pivotVal ? "<" : ">="} ピボット${pivotVal}`,
      });

      if (a[i] < pivotVal) {
        if (i !== storeIdx) {
          [a[i], a[storeIdx]] = [a[storeIdx], a[i]];
          steps.push({
            type: "partition_swap",
            arr: [...a],
            left: lo,
            right: hi,
            pivotIndex: hi,
            pivotValue: pivotVal,
            scanIndex: i,
            storeIndex: storeIdx,
            targetRank: target,
            description: `A[${i}] と A[${storeIdx}] をスワップ`,
          });
        }
        storeIdx++;
      }
    }

    [a[storeIdx], a[hi]] = [a[hi], a[storeIdx]];
    steps.push({
      type: "partition_done",
      arr: [...a],
      left: lo,
      right: hi,
      pivotIndex: storeIdx,
      pivotValue: pivotVal,
      scanIndex: -1,
      storeIndex: storeIdx,
      targetRank: target,
      description: `パーティション完了: ピボット${pivotVal}は位置${storeIdx}に配置`,
    });

    if (target === storeIdx) {
      steps.push({
        type: "found",
        arr: [...a],
        left: lo,
        right: hi,
        pivotIndex: storeIdx,
        pivotValue: a[storeIdx],
        scanIndex: -1,
        storeIndex: storeIdx,
        targetRank: target,
        description: `発見: A[${storeIdx}] = ${a[storeIdx]} が ${k}番目の要素`,
      });
    } else if (target < storeIdx) {
      steps.push({
        type: "recurse",
        arr: [...a],
        left: lo,
        right: storeIdx - 1,
        pivotIndex: storeIdx,
        pivotValue: pivotVal,
        scanIndex: -1,
        storeIndex: -1,
        targetRank: target,
        description: `目標位置${target} < ピボット位置${storeIdx}。左半分 [${lo}, ${storeIdx - 1}] を探索`,
      });
      quickSelect(lo, storeIdx - 1, target);
    } else {
      steps.push({
        type: "recurse",
        arr: [...a],
        left: storeIdx + 1,
        right: hi,
        pivotIndex: storeIdx,
        pivotValue: pivotVal,
        scanIndex: -1,
        storeIndex: -1,
        targetRank: target,
        description: `目標位置${target} > ピボット位置${storeIdx}。右半分 [${storeIdx + 1}, ${hi}] を探索`,
      });
      quickSelect(storeIdx + 1, hi, target);
    }
  }

  quickSelect(0, n - 1, k);

  steps.push({
    type: "done",
    arr: [...a],
    left: 0,
    right: n - 1,
    pivotIndex: k,
    pivotValue: a[k],
    scanIndex: -1,
    storeIndex: -1,
    targetRank: k,
    description: `アルゴリズム完了。${k}番目に小さい要素 = ${a[k]}`,
  });

  return steps;
}

function getCellClass(idx: number, step: Step): string {
  const base = "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (step.type === "found" && idx === step.pivotIndex) {
    return `${base} bg-emerald-100 border-emerald-500`;
  }
  if (idx === step.scanIndex) {
    return `${base} bg-blue-100 border-blue-400`;
  }
  if (idx === step.pivotIndex) {
    return `${base} bg-red-100 border-red-500`;
  }
  if (idx >= step.left && idx <= step.right) {
    return `${base} bg-amber-50 border-amber-400`;
  }

  return `${base} bg-white border-gray-200`;
}

export default function RandomizedAnimationPage() {
  const [inputArr, setInputArr] = useState("3 6 2 8 1 7 5 4");
  const [inputK, setInputK] = useState("3");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((arrStr: string, kStr: string) => {
    const nums = arrStr.trim().split(/[\s,]+/).map(Number).filter((x) => !isNaN(x));
    const k = parseInt(kStr);
    if (nums.length === 0 || isNaN(k) || k < 0 || k >= nums.length) return;
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Randomized Algorithm (乱択)</h1>
        <p className="text-sm text-muted-foreground mb-6">乱択QuickSelectでk番目に小さい要素を探索</p>

        <div className="flex gap-2 mb-8">
          <Input value={inputArr} onChange={(e) => setInputArr(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputArr, inputK); }} placeholder="配列" className="font-mono max-w-xs" />
          <Input value={inputK} onChange={(e) => setInputK(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputArr, inputK); }} placeholder="k (0-indexed)" className="font-mono w-32" />
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
          <span>探索区間: <span className="font-mono font-semibold text-foreground">[{step.left}, {step.right}]</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>走査中</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>ピボット</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>探索区間</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>発見</span></div>
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
