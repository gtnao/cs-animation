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
  | "consider_item"
  | "skip_item"
  | "take_item"
  | "update_cell"
  | "done";

interface Step {
  type: StepType;
  i: number; // item index (1-based)
  w: number; // current capacity
  dp: number[][];
  description: string;
  highlightCell?: [number, number];
  compareCell?: [number, number];
}

// --- Algorithm step generation ---

function generateSteps(items: Item[], capacity: number): Step[] {
  const n = items.length;
  const steps: Step[] = [];

  // Initialize DP table
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(capacity + 1).fill(0)
  );

  steps.push({
    type: "init",
    i: 0,
    w: 0,
    dp: dp.map((row) => [...row]),
    description: `DPテーブルを初期化。${n}個の品物、容量${capacity}のナップサック`,
  });

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    steps.push({
      type: "consider_item",
      i,
      w: 0,
      dp: dp.map((row) => [...row]),
      description: `品物${i} (重さ=${item.weight}, 価値=${item.value}) を検討`,
    });

    for (let w = 0; w <= capacity; w++) {
      if (item.weight > w) {
        dp[i][w] = dp[i - 1][w];
        steps.push({
          type: "skip_item",
          i,
          w,
          dp: dp.map((row) => [...row]),
          highlightCell: [i, w],
          compareCell: [i - 1, w],
          description: `容量${w} < 重さ${item.weight}: 品物${i}は入らない。dp[${i}][${w}] = dp[${i - 1}][${w}] = ${dp[i][w]}`,
        });
      } else {
        const withoutItem = dp[i - 1][w];
        const withItem = dp[i - 1][w - item.weight] + item.value;
        if (withItem > withoutItem) {
          dp[i][w] = withItem;
          steps.push({
            type: "take_item",
            i,
            w,
            dp: dp.map((row) => [...row]),
            highlightCell: [i, w],
            compareCell: [i - 1, w - item.weight],
            description: `品物${i}を入れる方が得: dp[${i - 1}][${w - item.weight}]+${item.value}=${withItem} > dp[${i - 1}][${w}]=${withoutItem}。dp[${i}][${w}] = ${withItem}`,
          });
        } else {
          dp[i][w] = withoutItem;
          steps.push({
            type: "skip_item",
            i,
            w,
            dp: dp.map((row) => [...row]),
            highlightCell: [i, w],
            compareCell: [i - 1, w],
            description: `品物${i}を入れない方が得: dp[${i - 1}][${w}]=${withoutItem} >= dp[${i - 1}][${w - item.weight}]+${item.value}=${withItem}。dp[${i}][${w}] = ${withoutItem}`,
          });
        }
      }
    }
  }

  steps.push({
    type: "done",
    i: n,
    w: capacity,
    dp: dp.map((row) => [...row]),
    description: `完了。最大価値 = dp[${n}][${capacity}] = ${dp[n][capacity]}`,
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(
  row: number,
  col: number,
  step: Step,
  n: number
): string {
  const base =
    "w-10 h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors";

  if (step.highlightCell) {
    const [hr, hc] = step.highlightCell;
    if (row === hr && col === hc) {
      if (step.type === "take_item") {
        return `${base} bg-emerald-100 border-emerald-500 font-bold`;
      }
      if (step.type === "skip_item") {
        return `${base} bg-blue-100 border-blue-400 font-bold`;
      }
    }
  }

  if (step.compareCell) {
    const [cr, cc] = step.compareCell;
    if (row === cr && col === cc) {
      return `${base} bg-amber-50 border-amber-400`;
    }
  }

  // Already computed rows
  if (row < step.i || (row === step.i && step.highlightCell && col < step.highlightCell[1])) {
    return `${base} bg-white border-gray-300`;
  }

  if (step.type === "done" && row <= n) {
    return `${base} bg-white border-gray-300`;
  }

  return `${base} bg-gray-50 border-gray-200 text-muted-foreground`;
}

// --- Default items ---

const defaultItems: Item[] = [
  { weight: 2, value: 3 },
  { weight: 3, value: 4 },
  { weight: 4, value: 5 },
  { weight: 5, value: 7 },
];
const defaultCapacity = 7;

// --- Component ---

export default function Knapsack01AnimationPage() {
  const [itemsInput, setItemsInput] = useState("2:3, 3:4, 4:5, 5:7");
  const [capacityInput, setCapacityInput] = useState("7");
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

  // Auto-advance
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

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">ナップサック問題 (0-1)</h1>
        <p className="text-sm text-muted-foreground mb-6">
          各品物を最大1個選べる条件下で、容量制限内の価値最大化を求める動的計画法
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input
            value={itemsInput}
            onChange={(e) => setItemsInput(e.target.value)}
            placeholder="重さ:価値, ... (例: 2:3, 3:4)"
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

        {/* Items display */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            品物一覧
          </div>
          <div className="flex gap-2 flex-wrap">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`px-3 py-1 border-2 rounded text-xs font-mono ${
                  step.i === idx + 1 && step.type !== "done"
                    ? "bg-blue-100 border-blue-400"
                    : "bg-white border-gray-200"
                }`}
              >
                #{idx + 1}: w={item.weight}, v={item.value}
              </div>
            ))}
          </div>
        </div>

        {/* DP Table */}
        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            DPテーブル (dp[i][w] = 品物1..iで容量wの最大価値)
          </div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-10 h-8 text-xs text-muted-foreground font-mono"></th>
                {Array.from({ length: capacity + 1 }, (_, w) => (
                  <th
                    key={w}
                    className="w-10 h-8 text-xs text-muted-foreground font-mono text-center"
                  >
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {step.dp.map((row, i) => (
                <tr key={i}>
                  <td className="w-10 h-10 text-xs text-muted-foreground font-mono text-center">
                    {i}
                  </td>
                  {row.map((val, w) => (
                    <td key={w}>
                      <div className={getCellClass(i, w, step, items.length)}>
                        {val}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
            <span>現在のセル / 品物</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>参照先セル</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>品物を選択</span>
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
      </div>
    </div>
  );
}
