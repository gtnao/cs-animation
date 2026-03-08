"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "solve_range"
  | "find_opt"
  | "update_cell"
  | "recurse_left"
  | "recurse_right"
  | "done";

interface Step {
  type: StepType;
  k: number; // partition count
  lo: number;
  hi: number;
  mid: number;
  optK: number;
  optLo: number;
  optHi: number;
  dp: number[][];
  description: string;
}

// --- Cost function: sum of squares of subarray sums ---
// cost(l, r) = (prefix[r] - prefix[l])^2

function generateSteps(arr: number[], K: number): Step[] {
  const n = arr.length;
  const steps: Step[] = [];

  // Prefix sums
  const prefix = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + arr[i];
  }

  // cost(l, r) = (prefix[r] - prefix[l])^2
  const cost = (l: number, r: number) => {
    const s = prefix[r] - prefix[l];
    return s * s;
  };

  // dp[k][j] = min cost to partition arr[0..j-1] into k groups
  const INF = 1e18;
  const dp: number[][] = Array.from({ length: K + 1 }, () =>
    new Array(n + 1).fill(INF)
  );
  dp[0][0] = 0;

  // Base case: k=1
  for (let j = 1; j <= n; j++) {
    dp[1][j] = cost(0, j);
  }

  steps.push({
    type: "init",
    k: 0,
    lo: 0,
    hi: n,
    mid: 0,
    optK: 0,
    optLo: 0,
    optHi: 0,
    dp: dp.map((row) => [...row]),
    description: `配列 [${arr.join(", ")}] を ${K} 個に分割。コスト = 各部分の和の二乗の合計を最小化`,
  });

  // For k = 2..K, use D&C optimization
  for (let k = 2; k <= K; k++) {
    const solve = (lo: number, hi: number, optLo: number, optHi: number) => {
      if (lo > hi) return;
      const mid = (lo + hi) >> 1;

      steps.push({
        type: "solve_range",
        k,
        lo,
        hi,
        mid,
        optK: -1,
        optLo,
        optHi,
        dp: dp.map((row) => [...row]),
        description: `k=${k}: 範囲 [${lo}, ${hi}] の中央 mid=${mid} を処理。最適分割点の範囲 [${optLo}, ${optHi}]`,
      });

      let bestVal = INF;
      let bestOpt = optLo;

      for (let t = optLo; t <= Math.min(mid - 1, optHi); t++) {
        const candidate = dp[k - 1][t] + cost(t, mid);
        if (candidate < bestVal) {
          bestVal = candidate;
          bestOpt = t;
        }
      }

      dp[k][mid] = bestVal;

      steps.push({
        type: "update_cell",
        k,
        lo,
        hi,
        mid,
        optK: bestOpt,
        optLo,
        optHi,
        dp: dp.map((row) => [...row]),
        description: `dp[${k}][${mid}] = ${bestVal} (最適分割点 = ${bestOpt})`,
      });

      solve(lo, mid - 1, optLo, bestOpt);
      solve(mid + 1, hi, bestOpt, optHi);
    };

    solve(1, n, 0, n - 1);
  }

  steps.push({
    type: "done",
    k: K,
    lo: 0,
    hi: n,
    mid: 0,
    optK: 0,
    optLo: 0,
    optHi: 0,
    dp: dp.map((row) => [...row]),
    description: `完了。最小コスト = dp[${K}][${n}] = ${dp[K][n]}`,
  });

  return steps;
}

// --- Default ---
const defaultArr = [1, 3, 2, 4, 1, 2];
const defaultK = 3;

// --- Component ---

export default function DNCOptimizationAnimationPage() {
  const [arrInput, setArrInput] = useState("1 3 2 4 1 2");
  const [kInput, setKInput] = useState("3");
  const [arr, setArr] = useState(defaultArr);
  const [k, setK] = useState(defaultK);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((a: number[], partitions: number) => {
    if (a.length === 0 || partitions <= 0 || partitions > a.length) return;
    setArr(a);
    setK(partitions);
    setSteps(generateSteps(a, partitions));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const handleRun = useCallback(() => {
    const parsed = arrInput
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((x) => !isNaN(x));
    const partitions = parseInt(kInput);
    if (parsed.length > 0 && !isNaN(partitions)) {
      run(parsed, partitions);
    }
  }, [arrInput, kInput, run]);

  useEffect(() => {
    run(defaultArr, defaultK);
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

  const n = arr.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">
          Divide & Conquer Optimization
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          最適分割点の単調性を利用してDPを高速化する分割統治テクニック
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input
            value={arrInput}
            onChange={(e) => setArrInput(e.target.value)}
            placeholder="配列 (空白区切り)"
            className="font-mono max-w-sm"
          />
          <Input
            value={kInput}
            onChange={(e) => setKInput(e.target.value)}
            placeholder="分割数K"
            className="font-mono w-20"
          />
          <Button onClick={handleRun} variant="outline">
            実行
          </Button>
        </div>

        {/* Input array */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            入力配列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {arr.map((val, idx) => {
              let cls =
                "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              if (
                step.type !== "init" &&
                step.type !== "done" &&
                idx >= step.optK &&
                idx < step.mid
              ) {
                cls += " bg-amber-50 border-amber-400";
              } else {
                cls += " bg-white border-gray-200";
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

        {/* DP Table */}
        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            dp[k][j] (k分割で先頭j要素の最小コスト)
          </div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-10 h-8 text-xs text-muted-foreground font-mono">
                  k\j
                </th>
                {Array.from({ length: n + 1 }, (_, j) => (
                  <th
                    key={j}
                    className="w-14 h-8 text-xs text-muted-foreground font-mono text-center"
                  >
                    {j}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {step.dp.map((row, ki) => (
                <tr key={ki}>
                  <td className="w-10 h-8 text-xs text-muted-foreground font-mono text-center">
                    {ki}
                  </td>
                  {row.map((val, j) => {
                    let cls =
                      "w-14 h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors";
                    if (ki === step.k && j === step.mid && step.type === "update_cell") {
                      cls += " bg-emerald-100 border-emerald-500 font-bold";
                    } else if (ki === step.k && j === step.mid && step.type === "solve_range") {
                      cls += " bg-blue-100 border-blue-400";
                    } else if (val < 1e17) {
                      cls += " bg-white border-gray-300";
                    } else {
                      cls += " bg-gray-50 border-gray-200 text-muted-foreground";
                    }
                    return (
                      <td key={j}>
                        <div className={cls}>
                          {val < 1e17 ? val : "-"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.type !== "init" && step.type !== "done" && (
            <span>
              k={step.k}, 範囲=[{step.lo},{step.hi}], mid={step.mid}
            </span>
          )}
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
            <span>処理中のセル</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>分割区間</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>値確定</span>
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
