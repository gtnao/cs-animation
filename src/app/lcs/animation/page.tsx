"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "compare_match"
  | "compare_mismatch"
  | "done";

interface Step {
  type: StepType;
  i: number;
  j: number;
  dp: number[][];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(s1: string, s2: string): Step[] {
  const m = s1.length;
  const n = s2.length;
  const steps: Step[] = [];

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  steps.push({
    type: "init",
    i: 0,
    j: 0,
    dp: dp.map((row) => [...row]),
    description: `DPテーブルを初期化。s1="${s1}" (長さ${m}), s2="${s2}" (長さ${n})`,
  });

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        steps.push({
          type: "compare_match",
          i,
          j,
          dp: dp.map((row) => [...row]),
          description: `s1[${i - 1}]='${s1[i - 1]}' = s2[${j - 1}]='${s2[j - 1]}' → 一致。dp[${i}][${j}] = dp[${i - 1}][${j - 1}]+1 = ${dp[i][j]}`,
        });
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        steps.push({
          type: "compare_mismatch",
          i,
          j,
          dp: dp.map((row) => [...row]),
          description: `s1[${i - 1}]='${s1[i - 1]}' != s2[${j - 1}]='${s2[j - 1]}' → 不一致。dp[${i}][${j}] = max(dp[${i - 1}][${j}], dp[${i}][${j - 1}]) = ${dp[i][j]}`,
        });
      }
    }
  }

  steps.push({
    type: "done",
    i: m,
    j: n,
    dp: dp.map((row) => [...row]),
    description: `完了。LCS長 = dp[${m}][${n}] = ${dp[m][n]}`,
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(
  row: number,
  col: number,
  step: Step
): string {
  const base =
    "w-10 h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors";

  if (row === step.i && col === step.j && step.type !== "init" && step.type !== "done") {
    if (step.type === "compare_match") {
      return `${base} bg-emerald-100 border-emerald-500 font-bold`;
    }
    if (step.type === "compare_mismatch") {
      return `${base} bg-red-100 border-red-500 font-bold`;
    }
  }

  // Diagonal reference for match
  if (step.type === "compare_match" && row === step.i - 1 && col === step.j - 1) {
    return `${base} bg-amber-50 border-amber-400`;
  }

  // References for mismatch
  if (
    step.type === "compare_mismatch" &&
    ((row === step.i - 1 && col === step.j) ||
      (row === step.i && col === step.j - 1))
  ) {
    return `${base} bg-amber-50 border-amber-400`;
  }

  // Computed cells
  const isComputed =
    step.type === "done" ||
    row < step.i ||
    (row === step.i && col < step.j) ||
    row === 0 ||
    col === 0;
  if (isComputed) {
    return `${base} bg-white border-gray-300`;
  }

  return `${base} bg-gray-50 border-gray-200 text-muted-foreground`;
}

// --- Component ---

export default function LCSAnimationPage() {
  const [input1, setInput1] = useState("ABCBDAB");
  const [input2, setInput2] = useState("BDCAB");
  const [s1, setS1] = useState("ABCBDAB");
  const [s2, setS2] = useState("BDCAB");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((a: string, b: string) => {
    const ta = a.trim();
    const tb = b.trim();
    if (ta.length === 0 || tb.length === 0) return;
    setS1(ta);
    setS2(tb);
    setSteps(generateSteps(ta, tb));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(input1, input2);
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
    }, 300);
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
            value={input1}
            onChange={(e) => setInput1(e.target.value)}
            placeholder="文字列1"
            className="font-mono max-w-xs"
          />
          <Input
            value={input2}
            onChange={(e) => setInput2(e.target.value)}
            placeholder="文字列2"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(input1, input2)} variant="outline">
            実行
          </Button>
        </div>

        {/* Strings */}
        <div className="mb-4 flex gap-8">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">
              s1
            </div>
            <div className="flex gap-1">
              {s1.split("").map((c, idx) => (
                <div
                  key={idx}
                  className={`w-8 h-8 flex items-center justify-center border-2 text-xs font-mono ${
                    step.i - 1 === idx && step.type !== "init" && step.type !== "done"
                      ? "bg-blue-100 border-blue-400"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">
              s2
            </div>
            <div className="flex gap-1">
              {s2.split("").map((c, idx) => (
                <div
                  key={idx}
                  className={`w-8 h-8 flex items-center justify-center border-2 text-xs font-mono ${
                    step.j - 1 === idx && step.type !== "init" && step.type !== "done"
                      ? "bg-blue-100 border-blue-400"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DP Table */}
        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            DPテーブル
          </div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-10 h-8 text-xs text-muted-foreground font-mono"></th>
                <th className="w-10 h-8 text-xs text-muted-foreground font-mono text-center">
                  -
                </th>
                {s2.split("").map((c, idx) => (
                  <th
                    key={idx}
                    className="w-10 h-8 text-xs text-muted-foreground font-mono text-center"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {step.dp.map((row, i) => (
                <tr key={i}>
                  <td className="w-10 h-8 text-xs text-muted-foreground font-mono text-center">
                    {i === 0 ? "-" : s1[i - 1]}
                  </td>
                  {row.map((val, j) => (
                    <td key={j}>
                      <div className={getCellClass(i, j, step)}>{val}</div>
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
            <span>現在の文字</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>参照先</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>一致</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>不一致</span>
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
