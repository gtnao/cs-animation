"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "start_row" | "copy_last" | "compute" | "extract" | "done";

interface Step {
  type: StepType;
  n: number;
  triangle: number[][];
  currentRow: number;
  currentCol: number;
  bellNumbers: number[];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(n: number): Step[] {
  const steps: Step[] = [];
  // Bell triangle: triangle[i][j]
  const triangle: number[][] = [];

  steps.push({
    type: "init",
    n,
    triangle: [],
    currentRow: -1,
    currentCol: -1,
    bellNumbers: [],
    description: `ベル三角形を使って B(0) ~ B(${n}) を計算する`,
  });

  // Row 0
  triangle.push([1]);
  steps.push({
    type: "start_row",
    n,
    triangle: triangle.map((r) => [...r]),
    currentRow: 0,
    currentCol: 0,
    bellNumbers: [1],
    description: `行 0: B(0) = 1`,
  });

  for (let i = 1; i <= n; i++) {
    const row: number[] = new Array(i + 1).fill(0);
    // First element of row i = last element of row i-1
    row[0] = triangle[i - 1][i - 1];
    steps.push({
      type: "copy_last",
      n,
      triangle: [...triangle.map((r) => [...r]), [...row]],
      currentRow: i,
      currentCol: 0,
      bellNumbers: triangle.map((r) => r[0]),
      description: `行 ${i}: 先頭 = 前行の末尾 = ${row[0]}`,
    });

    for (let j = 1; j <= i; j++) {
      row[j] = row[j - 1] + triangle[i - 1][j - 1];
      const tempTriangle = [...triangle.map((r) => [...r]), [...row]];
      steps.push({
        type: "compute",
        n,
        triangle: tempTriangle,
        currentRow: i,
        currentCol: j,
        bellNumbers: triangle.map((r) => r[0]),
        description: `T(${i}, ${j}) = T(${i}, ${j - 1}) + T(${i - 1}, ${j - 1}) = ${row[j - 1]} + ${triangle[i - 1][j - 1]} = ${row[j]}`,
      });
    }

    triangle.push(row);
    const bells = triangle.map((r) => r[0]);
    steps.push({
      type: "extract",
      n,
      triangle: triangle.map((r) => [...r]),
      currentRow: i,
      currentCol: 0,
      bellNumbers: bells,
      description: `B(${i}) = ${row[0]} 確定`,
    });
  }

  steps.push({
    type: "done",
    n,
    triangle: triangle.map((r) => [...r]),
    currentRow: -1,
    currentCol: -1,
    bellNumbers: triangle.map((r) => r[0]),
    description: `計算完了: B(${n}) = ${triangle[n][0]}`,
  });

  return steps;
}

// --- Component ---

export default function BellNumberAnimationPage() {
  const [input, setInput] = useState("5");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const val = parseInt(s, 10);
    if (isNaN(val) || val < 0 || val > 8) return;
    setSteps(generateSteps(val));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(input);
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
        <div className="flex gap-2 mb-8">
          <div className="flex items-center gap-1">
            <span className="text-sm">n:</span>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") run(input); }}
              className="font-mono w-20"
            />
          </div>
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* Bell Triangle */}
        {step.triangle.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              ベル三角形
            </div>
            <div className="space-y-1">
              {step.triangle.map((row, i) => (
                <div key={i} className="flex gap-1">
                  {row.map((val, j) => {
                    const base =
                      "w-14 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
                    let cls: string;
                    if (i === step.currentRow && j === step.currentCol) {
                      cls = `${base} bg-blue-100 border-blue-400 font-bold`;
                    } else if (
                      step.type === "compute" &&
                      ((i === step.currentRow && j === step.currentCol - 1) ||
                        (i === step.currentRow - 1 && j === step.currentCol - 1))
                    ) {
                      cls = `${base} bg-amber-50 border-amber-400`;
                    } else if (j === 0) {
                      cls = `${base} bg-emerald-100 border-emerald-500`;
                    } else {
                      cls = `${base} bg-white border-gray-200`;
                    }
                    return (
                      <div key={j} className={cls}>
                        {val}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bell Numbers */}
        {step.bellNumbers.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              ベル数 B(i)
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {step.bellNumbers.map((val, idx) => {
                const base =
                  "w-14 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
                const cls =
                  step.type === "done" && idx === step.n
                    ? `${base} bg-emerald-100 border-emerald-500 font-bold`
                    : `${base} bg-white border-gray-300`;
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
        )}

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
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>ベル数 (各行の先頭)</span>
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
