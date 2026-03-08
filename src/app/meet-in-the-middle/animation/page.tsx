"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "split"
  | "enumerate_left"
  | "enumerate_right"
  | "sort_right"
  | "search"
  | "found"
  | "not_found"
  | "done";

interface Step {
  type: StepType;
  leftGroup: number[];
  rightGroup: number[];
  leftSums: number[];
  rightSums: number[];
  currentLeftIdx: number;
  currentRightIdx: number;
  target: number;
  foundPair: [number, number] | null;
  description: string;
}

// --- Algorithm step generation ---

function generateSubsetSums(arr: number[]): number[] {
  const n = arr.length;
  const sums: number[] = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        sum += arr[i];
      }
    }
    sums.push(sum);
  }
  return sums;
}

function generateSteps(nums: number[], target: number): Step[] {
  const steps: Step[] = [];
  const n = nums.length;
  const mid = Math.floor(n / 2);
  const leftGroup = nums.slice(0, mid);
  const rightGroup = nums.slice(mid);

  steps.push({
    type: "init",
    leftGroup,
    rightGroup,
    leftSums: [],
    rightSums: [],
    currentLeftIdx: -1,
    currentRightIdx: -1,
    target,
    foundPair: null,
    description: `配列 [${nums.join(", ")}] から和が ${target} になる部分集合を探索`,
  });

  steps.push({
    type: "split",
    leftGroup,
    rightGroup,
    leftSums: [],
    rightSums: [],
    currentLeftIdx: -1,
    currentRightIdx: -1,
    target,
    foundPair: null,
    description: `左半分 [${leftGroup.join(", ")}] と右半分 [${rightGroup.join(", ")}] に分割`,
  });

  // Enumerate left sums
  const leftSums = generateSubsetSums(leftGroup);
  steps.push({
    type: "enumerate_left",
    leftGroup,
    rightGroup,
    leftSums,
    rightSums: [],
    currentLeftIdx: -1,
    currentRightIdx: -1,
    target,
    foundPair: null,
    description: `左半分の部分和を全列挙: ${leftSums.length} 通り [${leftSums.slice(0, 8).join(", ")}${leftSums.length > 8 ? ", ..." : ""}]`,
  });

  // Enumerate right sums
  const rightSums = generateSubsetSums(rightGroup);
  steps.push({
    type: "enumerate_right",
    leftGroup,
    rightGroup,
    leftSums,
    rightSums,
    currentLeftIdx: -1,
    currentRightIdx: -1,
    target,
    foundPair: null,
    description: `右半分の部分和を全列挙: ${rightSums.length} 通り [${rightSums.slice(0, 8).join(", ")}${rightSums.length > 8 ? ", ..." : ""}]`,
  });

  // Sort right sums
  const sortedRight = [...rightSums].sort((a, b) => a - b);
  steps.push({
    type: "sort_right",
    leftGroup,
    rightGroup,
    leftSums,
    rightSums: sortedRight,
    currentLeftIdx: -1,
    currentRightIdx: -1,
    target,
    foundPair: null,
    description: `右半分の部分和をソート: [${sortedRight.slice(0, 8).join(", ")}${sortedRight.length > 8 ? ", ..." : ""}]`,
  });

  // Search for pairs
  let found = false;
  const maxSearchSteps = 15;
  let searchCount = 0;

  for (let i = 0; i < leftSums.length && !found && searchCount < maxSearchSteps; i++) {
    const need = target - leftSums[i];
    // Binary search in sortedRight
    let lo = 0;
    let hi = sortedRight.length - 1;
    let foundIdx = -1;
    while (lo <= hi) {
      const m = Math.floor((lo + hi) / 2);
      if (sortedRight[m] === need) {
        foundIdx = m;
        break;
      } else if (sortedRight[m] < need) {
        lo = m + 1;
      } else {
        hi = m - 1;
      }
    }

    searchCount++;
    if (foundIdx >= 0) {
      steps.push({
        type: "found",
        leftGroup,
        rightGroup,
        leftSums,
        rightSums: sortedRight,
        currentLeftIdx: i,
        currentRightIdx: foundIdx,
        target,
        foundPair: [leftSums[i], sortedRight[foundIdx]],
        description: `左の部分和 ${leftSums[i]} + 右の部分和 ${sortedRight[foundIdx]} = ${target} → 発見!`,
      });
      found = true;
    } else {
      steps.push({
        type: "search",
        leftGroup,
        rightGroup,
        leftSums,
        rightSums: sortedRight,
        currentLeftIdx: i,
        currentRightIdx: -1,
        target,
        foundPair: null,
        description: `左の部分和 ${leftSums[i]} に対して右から ${need} を二分探索 → 見つからない`,
      });
    }
  }

  if (!found) {
    steps.push({
      type: "not_found",
      leftGroup,
      rightGroup,
      leftSums,
      rightSums: sortedRight,
      currentLeftIdx: -1,
      currentRightIdx: -1,
      target,
      foundPair: null,
      description: `和が ${target} になる部分集合は存在しない`,
    });
  }

  steps.push({
    type: "done",
    leftGroup,
    rightGroup,
    leftSums,
    rightSums: sortedRight,
    currentLeftIdx: -1,
    currentRightIdx: -1,
    target,
    foundPair: found ? steps[steps.length - 1].foundPair : null,
    description: found
      ? `探索完了: 和が ${target} になる部分集合を発見`
      : `探索完了: 和が ${target} になる部分集合は存在しない`,
  });

  return steps;
}

// --- Cell styling ---

function getSumCellClass(
  idx: number,
  isLeft: boolean,
  step: Step
): string {
  const base =
    "min-w-[2.5rem] h-8 flex items-center justify-center border text-xs font-mono transition-colors px-1";

  if (step.type === "found" && step.foundPair) {
    if (isLeft && idx === step.currentLeftIdx) {
      return `${base} bg-emerald-100 border-emerald-500 font-bold`;
    }
    if (!isLeft && idx === step.currentRightIdx) {
      return `${base} bg-emerald-100 border-emerald-500 font-bold`;
    }
  }

  if (step.type === "search" || step.type === "found") {
    if (isLeft && idx === step.currentLeftIdx) {
      return `${base} bg-blue-100 border-blue-400`;
    }
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

const DEFAULT_NUMS = [3, 7, 1, 8, 2, 5];
const DEFAULT_TARGET = 14;

export default function MeetInTheMiddleAnimationPage() {
  const [numsInput, setNumsInput] = useState(DEFAULT_NUMS.join(", "));
  const [targetInput, setTargetInput] = useState(String(DEFAULT_TARGET));
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((nums: number[], target: number) => {
    setSteps(generateSteps(nums, target));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(DEFAULT_NUMS, DEFAULT_TARGET);
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
    }, 800);
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
    const nums = numsInput
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    const target = parseInt(targetInput.trim(), 10);
    if (nums.length === 0 || isNaN(target)) return;
    if (nums.length > 12) {
      alert("要素数は12以下にしてください");
      return;
    }
    run(nums, target);
  };

  const step = steps[currentStep];
  if (!step) return null;

  const maxDisplay = 16;

  return (
    <>
{/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input
            value={numsInput}
            onChange={(e) => setNumsInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRun();
            }}
            placeholder="配列 (例: 3, 7, 1, 8, 2, 5)"
            className="font-mono max-w-sm"
          />
          <Input
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRun();
            }}
            placeholder="目標和"
            className="font-mono max-w-[100px]"
          />
          <Button onClick={handleRun} variant="outline">
            実行
          </Button>
        </div>

        {/* Groups display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              左半分: [{step.leftGroup.join(", ")}]
            </div>
            {step.leftSums.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {step.leftSums.slice(0, maxDisplay).map((s, i) => (
                  <div key={i} className={getSumCellClass(i, true, step)}>
                    {s}
                  </div>
                ))}
                {step.leftSums.length > maxDisplay && (
                  <div className="min-w-[2.5rem] h-8 flex items-center justify-center text-xs text-muted-foreground">
                    ...
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              右半分: [{step.rightGroup.join(", ")}]
            </div>
            {step.rightSums.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {step.rightSums.slice(0, maxDisplay).map((s, i) => (
                  <div key={i} className={getSumCellClass(i, false, step)}>
                    {s}
                  </div>
                ))}
                {step.rightSums.length > maxDisplay && (
                  <div className="min-w-[2.5rem] h-8 flex items-center justify-center text-xs text-muted-foreground">
                    ...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
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
            <span>現在の探索位置</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>発見されたペア</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200" />
            <span>デフォルト</span>
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
    </>
  );
}
