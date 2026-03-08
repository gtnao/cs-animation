"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "build_tree"
  | "evaluate_node"
  | "compute_remainder"
  | "extract_result"
  | "done";

interface Step {
  type: StepType;
  coeffs: number[];
  points: number[];
  treeNodes: string[];
  currentNode: number;
  remainders: string[];
  results: (number | null)[];
  description: string;
}

// --- Algorithm: naive multipoint evaluation for visualization ---

function evaluatePoly(coeffs: number[], x: number): number {
  // coeffs[i] = coefficient of x^i
  let result = 0;
  let power = 1;
  for (let i = 0; i < coeffs.length; i++) {
    result += coeffs[i] * power;
    power *= x;
  }
  return result;
}

function polyToString(coeffs: number[]): string {
  const terms: string[] = [];
  for (let i = coeffs.length - 1; i >= 0; i--) {
    if (coeffs[i] === 0) continue;
    if (i === 0) {
      terms.push(`${coeffs[i]}`);
    } else if (i === 1) {
      terms.push(coeffs[i] === 1 ? "x" : `${coeffs[i]}x`);
    } else {
      terms.push(coeffs[i] === 1 ? `x^${i}` : `${coeffs[i]}x^${i}`);
    }
  }
  return terms.length > 0 ? terms.join(" + ") : "0";
}

function generateSteps(coeffs: number[], points: number[]): Step[] {
  const steps: Step[] = [];
  const n = points.length;

  steps.push({
    type: "init",
    coeffs,
    points,
    treeNodes: [],
    currentNode: -1,
    remainders: [],
    results: new Array(n).fill(null),
    description: `多項式 f(x) = ${polyToString(coeffs)} を ${n} 点で評価する`,
  });

  // Build subproduct tree (conceptual, shown as strings)
  // For visualization, we show the tree structure
  // Leaves: (x - x_i) for each point
  const leaves = points.map((p) => p >= 0 ? `(x - ${p})` : `(x + ${-p})`);
  const treeNodes: string[] = [];
  const treeLevel: string[][] = [leaves];

  // Build up
  let currentLevel = leaves;
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        nextLevel.push(`${currentLevel[i]} * ${currentLevel[i + 1]}`);
      } else {
        nextLevel.push(currentLevel[i]);
      }
    }
    treeLevel.push(nextLevel);
    currentLevel = nextLevel;
  }

  // Flatten tree for display
  for (const level of treeLevel) {
    for (const node of level) {
      treeNodes.push(node);
    }
  }

  steps.push({
    type: "build_tree",
    coeffs,
    points,
    treeNodes,
    currentNode: -1,
    remainders: [],
    results: new Array(n).fill(null),
    description: `部分積木を構築: 葉は各 (x - x_i)、上に向かって積を計算`,
  });

  // Show evaluation at each point (using Horner's method for visualization)
  const results: (number | null)[] = new Array(n).fill(null);
  const remainders: string[] = [];

  for (let i = 0; i < n; i++) {
    const x = points[i];

    // Show polynomial remainder conceptually
    steps.push({
      type: "compute_remainder",
      coeffs,
      points,
      treeNodes,
      currentNode: i,
      remainders: [...remainders],
      results: [...results],
      description: `f(x) mod (x - ${x}) を計算中 (余りが f(${x}) に等しい)`,
    });

    const val = evaluatePoly(coeffs, x);
    results[i] = val;
    remainders.push(`f(${x}) = ${val}`);

    steps.push({
      type: "extract_result",
      coeffs,
      points,
      treeNodes,
      currentNode: i,
      remainders: [...remainders],
      results: [...results],
      description: `f(${x}) = ${val}`,
    });
  }

  steps.push({
    type: "done",
    coeffs,
    points,
    treeNodes,
    currentNode: -1,
    remainders: [...remainders],
    results: [...results],
    description: `計算完了: 全 ${n} 点の評価が終了`,
  });

  return steps;
}

function parseCoeffs(input: string): number[] {
  return input.split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
}

function parsePoints(input: string): number[] {
  return input.split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
}

// --- Component ---

export default function MultipointEvaluationAnimationPage() {
  const [inputCoeffs, setInputCoeffs] = useState("1,0,1");
  const [inputPoints, setInputPoints] = useState("0,1,2,3,-1");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((cStr: string, pStr: string) => {
    const coeffs = parseCoeffs(cStr);
    const points = parsePoints(pStr);
    if (coeffs.length === 0 || points.length === 0 || points.length > 8) return;
    setSteps(generateSteps(coeffs, points));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputCoeffs, inputPoints);
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
        <h1 className="text-2xl font-bold mb-1">Multipoint Evaluation</h1>
        <p className="text-sm text-muted-foreground mb-6">
          多項式を複数の点で同時に評価する過程を可視化
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-sm">係数 (a0,a1,...):</span>
            <Input
              value={inputCoeffs}
              onChange={(e) => setInputCoeffs(e.target.value)}
              placeholder="1,0,1"
              className="font-mono w-36"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">評価点:</span>
            <Input
              value={inputPoints}
              onChange={(e) => setInputPoints(e.target.value)}
              placeholder="0,1,2,3"
              className="font-mono w-36"
            />
          </div>
          <Button onClick={() => run(inputCoeffs, inputPoints)} variant="outline">
            実行
          </Button>
        </div>

        {/* Polynomial */}
        <div className="mb-6 p-3 border border-border rounded">
          <span className="text-sm font-mono">
            f(x) = {polyToString(step.coeffs)}
          </span>
        </div>

        {/* Points and Results */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            評価点と結果
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.points.map((p, idx) => {
              const base =
                "w-16 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              let cls: string;
              if (idx === step.currentNode) {
                cls = `${base} bg-blue-100 border-blue-400 font-bold`;
              } else if (step.results[idx] !== null) {
                cls = `${base} bg-emerald-100 border-emerald-500`;
              } else {
                cls = `${base} bg-white border-gray-200`;
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>
                    x={p}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {step.results[idx] !== null ? `f=${step.results[idx]}` : "–"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Remainders log */}
        {step.remainders.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              計算結果
            </div>
            <div className="space-y-1">
              {step.remainders.map((r, idx) => (
                <div
                  key={idx}
                  className={`text-sm font-mono px-2 py-1 rounded ${
                    idx === step.remainders.length - 1 && step.type === "extract_result"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-muted-foreground"
                  }`}
                >
                  {r}
                </div>
              ))}
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
            <span>現在評価中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>評価完了</span>
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
