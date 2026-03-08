"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "fill_base" | "compute" | "done";

interface Step {
  type: StepType;
  n: number;
  kind: "second" | "first";
  table: number[][];
  currentI: number;
  currentJ: number;
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(n: number, kind: "second" | "first"): Step[] {
  const steps: Step[] = [];
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  const kindName = kind === "second" ? "第二種" : "第一種";

  steps.push({
    type: "init",
    n,
    kind,
    table: dp.map((r) => [...r]),
    currentI: -1,
    currentJ: -1,
    description: `${kindName}スターリング数の表を n=${n} まで構築する`,
  });

  // Base cases
  dp[0][0] = 1;
  steps.push({
    type: "fill_base",
    n,
    kind,
    table: dp.map((r) => [...r]),
    currentI: 0,
    currentJ: 0,
    description: `基底ケース: S(0, 0) = 1`,
  });

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= i; j++) {
      if (kind === "second") {
        // S2(n,k) = k * S2(n-1, k) + S2(n-1, k-1)
        dp[i][j] = j * dp[i - 1][j] + dp[i - 1][j - 1];
      } else {
        // s1(n,k) = (n-1) * s1(n-1, k) + s1(n-1, k-1) (unsigned)
        dp[i][j] = (i - 1) * dp[i - 1][j] + dp[i - 1][j - 1];
      }

      const coeff = kind === "second" ? j : i - 1;
      steps.push({
        type: "compute",
        n,
        kind,
        table: dp.map((r) => [...r]),
        currentI: i,
        currentJ: j,
        description:
          kind === "second"
            ? `S(${i}, ${j}) = ${j} * S(${i - 1}, ${j}) + S(${i - 1}, ${j - 1}) = ${coeff} * ${dp[i - 1][j]} + ${dp[i - 1][j - 1]} = ${dp[i][j]}`
            : `s(${i}, ${j}) = ${coeff} * s(${i - 1}, ${j}) + s(${i - 1}, ${j - 1}) = ${coeff} * ${dp[i - 1][j]} + ${dp[i - 1][j - 1]} = ${dp[i][j]}`,
      });
    }
  }

  steps.push({
    type: "done",
    n,
    kind,
    table: dp.map((r) => [...r]),
    currentI: -1,
    currentJ: -1,
    description: `計算完了。${kindName}スターリング数の表が完成`,
  });

  return steps;
}

// --- Component ---

export default function StirlingNumberAnimationPage() {
  const [input, setInput] = useState("5");
  const [kindInput, setKindInput] = useState<"second" | "first">("second");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string, kind: "second" | "first") => {
    const val = parseInt(s, 10);
    if (isNaN(val) || val < 0 || val > 8) return;
    setSteps(generateSteps(val, kind));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(input, kindInput);
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
    }, 500);
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
          <div className="flex items-center gap-1">
            <span className="text-sm">n:</span>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") run(input, kindInput); }}
              className="font-mono w-20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={kindInput === "second" ? "default" : "outline"}
              size="sm"
              onClick={() => { setKindInput("second"); run(input, "second"); }}
            >
              第二種
            </Button>
            <Button
              variant={kindInput === "first" ? "default" : "outline"}
              size="sm"
              onClick={() => { setKindInput("first"); run(input, "first"); }}
            >
              第一種
            </Button>
          </div>
          <Button onClick={() => run(input, kindInput)} variant="outline">
            実行
          </Button>
        </div>

        {/* DP Table */}
        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {step.kind === "second" ? "第二種" : "第一種"}スターリング数 S(i, j)
          </div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-10 h-8 text-xs font-mono text-muted-foreground">i\j</th>
                {Array.from({ length: step.n + 1 }, (_, j) => (
                  <th key={j} className="w-14 h-8 text-xs font-mono text-muted-foreground">
                    {j}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {step.table.map((row, i) => (
                <tr key={i}>
                  <td className="w-10 h-10 text-xs font-mono text-muted-foreground text-center">
                    {i}
                  </td>
                  {row.map((val, j) => {
                    if (j > step.n) return null;
                    const base =
                      "w-14 h-10 text-center border-2 text-sm font-mono transition-colors";
                    let cls: string;
                    if (i === step.currentI && j === step.currentJ) {
                      cls = `${base} bg-blue-100 border-blue-400 font-bold`;
                    } else if (
                      step.type === "compute" &&
                      ((i === step.currentI - 1 && j === step.currentJ) ||
                        (i === step.currentI - 1 && j === step.currentJ - 1))
                    ) {
                      cls = `${base} bg-amber-50 border-amber-400`;
                    } else if (val > 0 && j <= i) {
                      cls = `${base} bg-white border-gray-300`;
                    } else {
                      cls = `${base} bg-gray-50 border-gray-200 text-muted-foreground`;
                    }
                    return (
                      <td key={j} className={cls}>
                        {j <= i ? val : ""}
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
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        {/* Description */}
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>現在計算中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>参照元</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
    </>
  );
}
