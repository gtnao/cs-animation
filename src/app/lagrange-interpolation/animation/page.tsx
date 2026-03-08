"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "compute_basis"
  | "evaluate_basis"
  | "add_term"
  | "done";

interface Step {
  type: StepType;
  points: [number, number][];
  targetX: number;
  currentBasis: number;
  basisValue: number;
  weights: number[];
  partialResult: number;
  result: number | null;
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(points: [number, number][], targetX: number): Step[] {
  const steps: Step[] = [];
  const n = points.length;

  steps.push({
    type: "init",
    points,
    targetX,
    currentBasis: -1,
    basisValue: 0,
    weights: [],
    partialResult: 0,
    result: null,
    description: `${n} 点からラグランジュ補間で f(${targetX}) を計算`,
  });

  let result = 0;
  const weights: number[] = [];

  for (let i = 0; i < n; i++) {
    // Compute L_i(targetX)
    let li = 1;
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        li *= (targetX - points[j][0]) / (points[i][0] - points[j][0]);
      }
    }

    weights.push(li);

    steps.push({
      type: "compute_basis",
      points,
      targetX,
      currentBasis: i,
      basisValue: li,
      weights: [...weights],
      partialResult: result,
      result: null,
      description: `L_${i}(${targetX}) = ${li.toFixed(4)} (基底多項式の値)`,
    });

    const term = points[i][1] * li;
    result += term;

    steps.push({
      type: "add_term",
      points,
      targetX,
      currentBasis: i,
      basisValue: li,
      weights: [...weights],
      partialResult: result,
      result: null,
      description: `y_${i} * L_${i}(${targetX}) = ${points[i][1]} * ${li.toFixed(4)} = ${term.toFixed(4)}  →  合計 = ${result.toFixed(4)}`,
    });
  }

  steps.push({
    type: "done",
    points,
    targetX,
    currentBasis: -1,
    basisValue: 0,
    weights: [...weights],
    partialResult: result,
    result,
    description: `計算完了: f(${targetX}) = ${result.toFixed(4)}`,
  });

  return steps;
}

function parsePoints(input: string): [number, number][] {
  const result: [number, number][] = [];
  const parts = input.split(";").map((s) => s.trim());
  for (const part of parts) {
    const match = part.match(/\(?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)?/);
    if (match) {
      result.push([parseFloat(match[1]), parseFloat(match[2])]);
    }
  }
  return result;
}

// --- Component ---

export default function LagrangeInterpolationAnimationPage() {
  const [inputPoints, setInputPoints] = useState("(0,1);(1,3);(2,7);(3,13)");
  const [inputX, setInputX] = useState("1.5");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((pStr: string, xStr: string) => {
    const points = parsePoints(pStr);
    const x = parseFloat(xStr);
    if (points.length < 2 || points.length > 8 || isNaN(x)) return;
    setSteps(generateSteps(points, x));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputPoints, inputX);
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
    }, 700);
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">ラグランジュ補間</h1>
        <p className="text-sm text-muted-foreground mb-6">
          各基底多項式の寄与を加算して補間値を計算
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-sm">点:</span>
            <Input
              value={inputPoints}
              onChange={(e) => setInputPoints(e.target.value)}
              placeholder="(0,1);(1,3);(2,7)"
              className="font-mono w-64"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">x:</span>
            <Input
              value={inputX}
              onChange={(e) => setInputX(e.target.value)}
              className="font-mono w-20"
            />
          </div>
          <Button onClick={() => run(inputPoints, inputX)} variant="outline">
            実行
          </Button>
        </div>

        {/* Points display */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            データ点 (x_i, y_i)
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {step.points.map(([x, y], idx) => {
              const base =
                "px-3 py-2 border-2 text-sm font-mono transition-colors rounded";
              let cls: string;
              if (idx === step.currentBasis) {
                cls = `${base} bg-blue-100 border-blue-400 font-bold`;
              } else {
                cls = `${base} bg-white border-gray-200`;
              }
              return (
                <div key={idx} className={cls}>
                  ({x}, {y})
                </div>
              );
            })}
          </div>
        </div>

        {/* Basis weights */}
        {step.weights.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              基底多項式の値 L_i({step.targetX})
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {step.weights.map((w, idx) => {
                const base =
                  "w-20 h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors";
                const cls =
                  idx === step.currentBasis
                    ? `${base} bg-amber-50 border-amber-400`
                    : `${base} bg-white border-gray-200`;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className={cls}>{w.toFixed(3)}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      L_{idx}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Partial result */}
        <div className="mb-6 p-3 border border-border rounded">
          <span className="text-sm font-mono">
            f({step.targetX}) = <span className="font-bold">{step.partialResult.toFixed(4)}</span>
          </span>
        </div>

        {/* Result */}
        {step.result !== null && (
          <div className="mb-6 p-4 border border-emerald-500 bg-emerald-50 rounded">
            <span className="text-sm font-mono font-bold">
              f({step.targetX}) = {step.result.toFixed(4)}
            </span>
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
            <span>現在の基底</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>基底の値</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>結果</span>
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
      </div>
    </div>
  );
}
