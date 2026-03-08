"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface Item {
  weight: number;
  value: number;
}

type StepType =
  | "init"
  | "consider_capacity"
  | "try_item"
  | "update_best"
  | "keep_current"
  | "finalize_cell"
  | "done";

interface Step {
  type: StepType;
  w: number;
  itemIdx: number;
  dp: number[];
  description: string;
  highlightW?: number;
  compareW?: number;
}

// --- Algorithm step generation ---

function generateSteps(items: Item[], capacity: number): Step[] {
  const steps: Step[] = [];
  const n = items.length;
  const dp = new Array(capacity + 1).fill(0);

  steps.push({
    type: "init",
    w: 0,
    itemIdx: -1,
    dp: [...dp],
    description: `DPテーブルを初期化。dp[w] = 容量wで得られる最大価値。${n}種類の品物、容量${capacity}`,
  });

  for (let w = 1; w <= capacity; w++) {
    steps.push({
      type: "consider_capacity",
      w,
      itemIdx: -1,
      dp: [...dp],
      highlightW: w,
      description: `容量 w=${w} を検討`,
    });

    for (let j = 0; j < n; j++) {
      const item = items[j];
      if (item.weight <= w) {
        const candidate = dp[w - item.weight] + item.value;
        if (candidate > dp[w]) {
          dp[w] = candidate;
          steps.push({
            type: "update_best",
            w,
            itemIdx: j,
            dp: [...dp],
            highlightW: w,
            compareW: w - item.weight,
            description: `品物${j + 1} (w=${item.weight}, v=${item.value}): dp[${w - item.weight}]+${item.value}=${candidate} > ${dp[w] - item.value + (candidate - dp[w])}。dp[${w}] = ${candidate} に更新`,
          });
        } else {
          steps.push({
            type: "keep_current",
            w,
            itemIdx: j,
            dp: [...dp],
            highlightW: w,
            compareW: w - item.weight,
            description: `品物${j + 1} (w=${item.weight}, v=${item.value}): dp[${w - item.weight}]+${item.value}=${candidate} <= dp[${w}]=${dp[w]}。更新なし`,
          });
        }
      } else {
        steps.push({
          type: "try_item",
          w,
          itemIdx: j,
          dp: [...dp],
          highlightW: w,
          description: `品物${j + 1} (w=${item.weight}): 重さ超過、スキップ`,
        });
      }
    }

    steps.push({
      type: "finalize_cell",
      w,
      itemIdx: -1,
      dp: [...dp],
      highlightW: w,
      description: `dp[${w}] = ${dp[w]} 確定`,
    });
  }

  steps.push({
    type: "done",
    w: capacity,
    itemIdx: -1,
    dp: [...dp],
    description: `完了。最大価値 = dp[${capacity}] = ${dp[capacity]}`,
  });

  return steps;
}

// --- Default ---

const defaultItems: Item[] = [
  { weight: 2, value: 3 },
  { weight: 3, value: 5 },
  { weight: 4, value: 6 },
];
const defaultCapacity = 8;

// --- Component ---

export default function KnapsackUnboundedAnimationPage() {
  const [itemsInput, setItemsInput] = useState("2:3, 3:5, 4:6");
  const [capacityInput, setCapacityInput] = useState("8");
  const [items, setItems] = useState<Item[]>(defaultItems);
  const [capacity, setCapacity] = useState(defaultCapacity);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((its: Item[], cap: number) => {
    if (its.length === 0 || cap <= 0) return;
    setItems(its);
    setCapacity(cap);
    setSteps(generateSteps(its, cap));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const handleRun = useCallback(() => {
    const parsed = itemsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => {
        const [w, v] = s.split(":").map(Number);
        return { weight: w, value: v };
      })
      .filter((item) => !isNaN(item.weight) && !isNaN(item.value));
    const cap = parseInt(capacityInput);
    if (parsed.length > 0 && !isNaN(cap) && cap > 0) {
      run(parsed, cap);
    }
  }, [itemsInput, capacityInput, run]);

  useEffect(() => {
    run(defaultItems, defaultCapacity);
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
    }, 400);
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
{/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input
            value={itemsInput}
            onChange={(e) => setItemsInput(e.target.value)}
            placeholder="重さ:価値, ... (例: 2:3, 3:5)"
            className="font-mono max-w-sm"
          />
          <Input
            value={capacityInput}
            onChange={(e) => setCapacityInput(e.target.value)}
            placeholder="容量"
            className="font-mono w-20"
          />
          <Button onClick={handleRun} variant="outline">
            実行
          </Button>
        </div>

        {/* Items */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            品物一覧 (何個でも使用可)
          </div>
          <div className="flex gap-2 flex-wrap">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`px-3 py-1 border-2 rounded text-xs font-mono ${
                  step.itemIdx === idx
                    ? "bg-blue-100 border-blue-400"
                    : "bg-white border-gray-200"
                }`}
              >
                #{idx + 1}: w={item.weight}, v={item.value}
              </div>
            ))}
          </div>
        </div>

        {/* DP array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            dp[w] = 容量wでの最大価値
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.dp.map((val, w) => {
              let cls =
                "w-10 h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors";
              if (step.highlightW === w) {
                if (step.type === "update_best") {
                  cls += " bg-emerald-100 border-emerald-500 font-bold";
                } else if (step.type === "finalize_cell") {
                  cls += " bg-blue-100 border-blue-400 font-bold";
                } else {
                  cls += " bg-blue-100 border-blue-400";
                }
              } else if (step.compareW !== undefined && step.compareW === w) {
                cls += " bg-amber-50 border-amber-400";
              } else if (
                step.type === "done" ||
                (step.highlightW !== undefined && w < step.highlightW)
              ) {
                cls += " bg-white border-gray-300";
              } else {
                cls += " bg-gray-50 border-gray-200 text-muted-foreground";
              }
              return (
                <div key={w} className="flex flex-col items-center gap-1">
                  <div className={cls}>{val}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {w}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
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
            <span>現在の容量</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>参照先</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>値更新</span>
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
              setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
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
