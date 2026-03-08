"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "match"
  | "substitute"
  | "insert_or_delete"
  | "done";

interface Step {
  type: StepType;
  i: number;
  j: number;
  dp: number[][];
  description: string;
  operation?: string;
}

// --- Algorithm step generation ---

function generateSteps(s1: string, s2: string): Step[] {
  const m = s1.length;
  const n = s2.length;
  const steps: Step[] = [];

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  steps.push({
    type: "init",
    i: 0,
    j: 0,
    dp: dp.map((row) => [...row]),
    description: `DPテーブルを初期化。s1="${s1}" (長さ${m}), s2="${s2}" (長さ${n})。dp[i][0]=i, dp[0][j]=j`,
  });

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
        steps.push({
          type: "match",
          i,
          j,
          dp: dp.map((row) => [...row]),
          description: `s1[${i - 1}]='${s1[i - 1]}' = s2[${j - 1}]='${s2[j - 1]}' → 一致。dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]}`,
          operation: "一致",
        });
      } else {
        const replace = dp[i - 1][j - 1] + 1;
        const del = dp[i - 1][j] + 1;
        const ins = dp[i][j - 1] + 1;
        dp[i][j] = Math.min(replace, del, ins);

        let op: string;
        if (dp[i][j] === replace) {
          op = "置換";
        } else if (dp[i][j] === del) {
          op = "削除";
        } else {
          op = "挿入";
        }

        const stepType =
          dp[i][j] === replace ? "substitute" : "insert_or_delete";

        steps.push({
          type: stepType,
          i,
          j,
          dp: dp.map((row) => [...row]),
          description: `s1[${i - 1}]='${s1[i - 1]}' != s2[${j - 1}]='${s2[j - 1]}'。min(置換=${replace}, 削除=${del}, 挿入=${ins}) = ${dp[i][j]} (${op})`,
          operation: op,
        });
      }
    }
  }

  steps.push({
    type: "done",
    i: m,
    j: n,
    dp: dp.map((row) => [...row]),
    description: `完了。編集距離 = dp[${m}][${n}] = ${dp[m][n]}`,
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(row: number, col: number, step: Step): string {
  const base =
    "w-10 h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors";

  if (
    row === step.i &&
    col === step.j &&
    step.type !== "init" &&
    step.type !== "done"
  ) {
    if (step.type === "match") {
      return `${base} bg-emerald-100 border-emerald-500 font-bold`;
    }
    if (step.type === "substitute") {
      return `${base} bg-red-100 border-red-500 font-bold`;
    }
    return `${base} bg-blue-100 border-blue-400 font-bold`;
  }

  // Reference cells
  if (step.type !== "init" && step.type !== "done") {
    if (
      (row === step.i - 1 && col === step.j - 1) ||
      (row === step.i - 1 && col === step.j) ||
      (row === step.i && col === step.j - 1)
    ) {
      return `${base} bg-amber-50 border-amber-400`;
    }
  }

  const isComputed =
    step.type === "done" ||
    row === 0 ||
    col === 0 ||
    row < step.i ||
    (row === step.i && col < step.j);
  if (isComputed) {
    return `${base} bg-white border-gray-300`;
  }

  return `${base} bg-gray-50 border-gray-200 text-muted-foreground`;
}

// --- Component ---

export default function EditDistanceAnimationPage() {
  const [input1, setInput1] = useState("kitten");
  const [input2, setInput2] = useState("sitting");
  const [s1, setS1] = useState("kitten");
  const [s2, setS2] = useState("sitting");
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

        {/* DP Table */}
        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            DPテーブル (dp[i][j] = s1[0..i-1] を s2[0..j-1] に変換する最小コスト)
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
          {step.operation && (
            <span>
              操作:{" "}
              <span className="font-mono font-semibold text-foreground">
                {step.operation}
              </span>
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
            <span>挿入/削除</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>参照先</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>一致 (コスト0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
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
    </>
  );
}
