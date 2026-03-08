"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "consider_element"
  | "binary_search"
  | "extend"
  | "replace"
  | "done";

interface Step {
  type: StepType;
  idx: number;
  tails: number[];
  dp: number[];
  bisectPos?: number;
  description: string;
}

// --- Algorithm step generation (patience sorting / binary search approach) ---

function generateSteps(arr: number[]): Step[] {
  const n = arr.length;
  if (n === 0) return [];
  const steps: Step[] = [];
  const tails: number[] = [];
  const dp = new Array(n).fill(0);

  steps.push({
    type: "init",
    idx: -1,
    tails: [],
    dp: [...dp],
    description: `配列の長さ ${n}。tails配列を使って LIS を構築する`,
  });

  for (let i = 0; i < n; i++) {
    const x = arr[i];

    steps.push({
      type: "consider_element",
      idx: i,
      tails: [...tails],
      dp: [...dp],
      description: `arr[${i}] = ${x} を検討。現在の tails = [${tails.join(", ")}]`,
    });

    // Binary search for the first element in tails >= x
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    if (lo === tails.length) {
      tails.push(x);
      dp[i] = tails.length;
      steps.push({
        type: "extend",
        idx: i,
        tails: [...tails],
        dp: [...dp],
        bisectPos: lo,
        description: `${x} > tails の全要素 → tails の末尾に追加。tails = [${tails.join(", ")}], LIS長 = ${tails.length}`,
      });
    } else {
      const old = tails[lo];
      tails[lo] = x;
      dp[i] = lo + 1;
      steps.push({
        type: "replace",
        idx: i,
        tails: [...tails],
        dp: [...dp],
        bisectPos: lo,
        description: `tails[${lo}] = ${old} を ${x} に置換。tails = [${tails.join(", ")}]`,
      });
    }
  }

  steps.push({
    type: "done",
    idx: n,
    tails: [...tails],
    dp: [...dp],
    description: `完了。LIS の長さ = ${tails.length}`,
  });

  return steps;
}

// --- Component ---

export default function LISAnimationPage() {
  const [input, setInput] = useState("3 1 4 1 5 9 2 6");
  const [arr, setArr] = useState<number[]>([3, 1, 4, 1, 5, 9, 2, 6]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((nums: number[]) => {
    if (nums.length === 0) return;
    setArr(nums);
    setSteps(generateSteps(nums));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const handleRun = useCallback(() => {
    const parsed = input
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((x) => !isNaN(x));
    if (parsed.length > 0) run(parsed);
  }, [input, run]);

  useEffect(() => {
    run([3, 1, 4, 1, 5, 9, 2, 6]);
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
    }, 600);
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
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">最長増加部分列 (LIS)</h1>
        <p className="text-sm text-muted-foreground mb-6">
          二分探索を使った O(n log n) アルゴリズムで LIS を求める
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRun();
            }}
            placeholder="数列 (空白区切り)"
            className="font-mono max-w-md"
          />
          <Button onClick={handleRun} variant="outline">
            実行
          </Button>
        </div>

        {/* Input array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            入力配列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {arr.map((val, idx) => {
              let cls =
                "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              if (idx === step.idx) {
                if (step.type === "extend") {
                  cls += " bg-emerald-100 border-emerald-500 font-bold";
                } else if (step.type === "replace") {
                  cls += " bg-amber-50 border-amber-400 font-bold";
                } else {
                  cls += " bg-blue-100 border-blue-400";
                }
              } else if (step.type !== "done" && step.idx >= 0 && idx < step.idx) {
                cls += " bg-white border-gray-300";
              } else if (step.type === "done") {
                cls += " bg-white border-gray-300";
              } else {
                cls += " bg-gray-50 border-gray-200 text-muted-foreground";
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{val}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {idx}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tails array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            tails 配列 (各長さの LIS の末尾最小値)
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.tails.length === 0 ? (
              <div className="text-xs text-muted-foreground">(空)</div>
            ) : (
              step.tails.map((val, idx) => {
                let cls =
                  "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
                if (step.bisectPos === idx) {
                  if (step.type === "extend") {
                    cls += " bg-emerald-100 border-emerald-500 font-bold";
                  } else if (step.type === "replace") {
                    cls += " bg-amber-50 border-amber-400 font-bold";
                  } else {
                    cls += " bg-blue-100 border-blue-400";
                  }
                } else {
                  cls += " bg-white border-gray-300";
                }
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className={cls}>{val}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {idx}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            LIS長 = <span className="font-mono font-semibold text-foreground">{step.tails.length}</span>
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
            <span>現在の要素</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>末尾に追加 (LIS 延長)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>置換</span>
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
