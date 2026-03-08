"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "explore"
  | "include"
  | "prune"
  | "update_best"
  | "backtrack"
  | "done";

interface Step {
  type: StepType;
  index: number;
  currentSum: number;
  currentWeight: number;
  bestValue: number;
  capacity: number;
  items: { weight: number; value: number }[];
  selected: boolean[];
  pruned: boolean;
  description: string;
}

// --- Algorithm step generation ---
// 0/1 Knapsack with branch and bound

function generateSteps(
  items: { weight: number; value: number }[],
  capacity: number
): Step[] {
  const steps: Step[] = [];
  const n = items.length;
  const selected = new Array(n).fill(false);
  let bestValue = 0;

  // Sort by value/weight ratio descending for better bound
  const sorted = items
    .map((item, idx) => ({ ...item, originalIdx: idx }))
    .sort((a, b) => b.value / b.weight - a.value / a.weight);

  // Upper bound using fractional knapsack
  function upperBound(idx: number, curWeight: number, curValue: number): number {
    let bound = curValue;
    let w = curWeight;
    for (let i = idx; i < n; i++) {
      if (w + sorted[i].weight <= capacity) {
        w += sorted[i].weight;
        bound += sorted[i].value;
      } else {
        bound += ((capacity - w) / sorted[i].weight) * sorted[i].value;
        break;
      }
    }
    return bound;
  }

  steps.push({
    type: "init",
    index: -1,
    currentSum: 0,
    currentWeight: 0,
    bestValue: 0,
    capacity,
    items: sorted,
    selected: [...selected],
    pruned: false,
    description: `ナップサック容量 ${capacity}, ${n} 個のアイテム。価値/重さ比でソート済み`,
  });

  function dfs(idx: number, curWeight: number, curValue: number): void {
    if (idx === n) {
      if (curValue > bestValue) {
        bestValue = curValue;
        steps.push({
          type: "update_best",
          index: idx,
          currentSum: curValue,
          currentWeight: curWeight,
          bestValue,
          capacity,
          items: sorted,
          selected: [...selected],
          pruned: false,
          description: `葉に到達。最良値を ${bestValue} に更新`,
        });
      }
      return;
    }

    // Limit step generation for visualization
    if (steps.length > 60) return;

    steps.push({
      type: "explore",
      index: idx,
      currentSum: curValue,
      currentWeight: curWeight,
      bestValue,
      capacity,
      items: sorted,
      selected: [...selected],
      pruned: false,
      description: `アイテム ${idx} (重さ=${sorted[idx].weight}, 価値=${sorted[idx].value}) を検討`,
    });

    // Try including item
    if (curWeight + sorted[idx].weight <= capacity) {
      selected[idx] = true;
      steps.push({
        type: "include",
        index: idx,
        currentSum: curValue + sorted[idx].value,
        currentWeight: curWeight + sorted[idx].weight,
        bestValue,
        capacity,
        items: sorted,
        selected: [...selected],
        pruned: false,
        description: `アイテム ${idx} を選択 → 重さ=${curWeight + sorted[idx].weight}, 価値=${curValue + sorted[idx].value}`,
      });
      dfs(idx + 1, curWeight + sorted[idx].weight, curValue + sorted[idx].value);
      selected[idx] = false;

      steps.push({
        type: "backtrack",
        index: idx,
        currentSum: curValue,
        currentWeight: curWeight,
        bestValue,
        capacity,
        items: sorted,
        selected: [...selected],
        pruned: false,
        description: `アイテム ${idx} をバックトラック`,
      });
    } else {
      steps.push({
        type: "prune",
        index: idx,
        currentSum: curValue,
        currentWeight: curWeight,
        bestValue,
        capacity,
        items: sorted,
        selected: [...selected],
        pruned: true,
        description: `アイテム ${idx} を選択すると容量超過 (${curWeight + sorted[idx].weight} > ${capacity}) → 枝刈り`,
      });
    }

    // Try excluding item (with bound check)
    const bound = upperBound(idx + 1, curWeight, curValue);
    if (bound > bestValue) {
      dfs(idx + 1, curWeight, curValue);
    } else {
      steps.push({
        type: "prune",
        index: idx,
        currentSum: curValue,
        currentWeight: curWeight,
        bestValue,
        capacity,
        items: sorted,
        selected: [...selected],
        pruned: true,
        description: `アイテム ${idx} を除外した場合の上界 ${bound.toFixed(1)} <= 現在の最良値 ${bestValue} → 枝刈り`,
      });
    }
  }

  dfs(0, 0, 0);

  steps.push({
    type: "done",
    index: n,
    currentSum: bestValue,
    currentWeight: 0,
    bestValue,
    capacity,
    items: sorted,
    selected: [...selected],
    pruned: false,
    description: `探索完了: 最大価値 = ${bestValue}`,
  });

  return steps;
}

// --- Cell styling ---

function getItemCellClass(idx: number, step: Step): string {
  const base =
    "h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors px-3";

  if (step.type === "prune" && idx === step.index) {
    return `${base} bg-red-100 border-red-500`;
  }

  if (idx === step.index && step.type !== "done") {
    return `${base} bg-blue-100 border-blue-400`;
  }

  if (step.selected[idx]) {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

  if (idx < step.index) {
    return `${base} bg-amber-50 border-amber-400`;
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

const DEFAULT_ITEMS = [
  { weight: 2, value: 6 },
  { weight: 3, value: 5 },
  { weight: 4, value: 8 },
  { weight: 5, value: 9 },
  { weight: 1, value: 3 },
];
const DEFAULT_CAPACITY = 8;

export default function PruningSearchAnimationPage() {
  const [capacityInput, setCapacityInput] = useState(String(DEFAULT_CAPACITY));
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((items: { weight: number; value: number }[], cap: number) => {
    setSteps(generateSteps(items, cap));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(DEFAULT_ITEMS, DEFAULT_CAPACITY);
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
    const cap = parseInt(capacityInput.trim(), 10);
    if (isNaN(cap) || cap <= 0) return;
    run(DEFAULT_ITEMS, cap);
  };

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">枝刈り全探索</h1>
        <p className="text-sm text-muted-foreground mb-6">
          不要な探索分岐を早期に打ち切ることで全探索を高速化する手法
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input
            value={capacityInput}
            onChange={(e) => setCapacityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRun();
            }}
            placeholder="ナップサック容量"
            className="font-mono max-w-[150px]"
          />
          <Button onClick={handleRun} variant="outline">
            実行
          </Button>
        </div>

        {/* Items */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            アイテム (重さ, 価値)
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.items.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getItemCellClass(idx, step)}>
                  w={item.weight} v={item.value}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3 flex-wrap">
          <span>
            容量 ={" "}
            <span className="font-mono font-semibold text-foreground">
              {step.capacity}
            </span>
          </span>
          <span>
            現在の重さ ={" "}
            <span className="font-mono font-semibold text-foreground">
              {step.currentWeight}
            </span>
          </span>
          <span>
            現在の価値 ={" "}
            <span className="font-mono font-semibold text-foreground">
              {step.currentSum}
            </span>
          </span>
          <span>
            最良値 ={" "}
            <span className="font-mono font-semibold text-foreground">
              {step.bestValue}
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
            <span>現在検討中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>処理済み</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>選択中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>枝刈り</span>
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
