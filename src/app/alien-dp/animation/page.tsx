"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "try_lambda" | "solve_dp" | "found" | "done";

interface Step {
  type: StepType;
  lambda: number;
  dp: number[];
  count: number[];
  optValue: number;
  optCount: number;
  description: string;
}

// --- Algorithm ---

function generateSteps(arr: number[], targetK: number): Step[] {
  const steps: Step[] = [];
  const n = arr.length;

  steps.push({
    type: "init",
    lambda: 0,
    dp: [],
    count: [],
    optValue: 0,
    optCount: 0,
    description: `Alien DP: ${n}要素から${targetK}区間を選ぶ最適化。ラグランジュ緩和で個数制約を除去`,
  });

  // Binary search on lambda
  let lo = -1000, hi = 1000;
  const iterations = 8;

  for (let iter = 0; iter < iterations; iter++) {
    const lambda = (lo + hi) / 2;

    // Solve relaxed problem: dp[i] = min cost with penalty lambda per segment
    const dp = new Array(n + 1).fill(0);
    const cnt = new Array(n + 1).fill(0);

    for (let i = 1; i <= n; i++) {
      dp[i] = dp[i - 1]; // don't start segment here
      cnt[i] = cnt[i - 1];
      for (let j = 0; j < i; j++) {
        const segCost = arr.slice(j, i).reduce((a, b) => a + b, 0);
        const val = dp[j] + segCost + lambda;
        if (val < dp[i] || (val === dp[i] && cnt[j] + 1 < cnt[i])) {
          dp[i] = val;
          cnt[i] = cnt[j] + 1;
        }
      }
    }

    steps.push({
      type: "try_lambda",
      lambda: Math.round(lambda * 100) / 100,
      dp: dp.map(v => Math.round(v * 100) / 100),
      count: [...cnt],
      optValue: Math.round(dp[n] * 100) / 100,
      optCount: cnt[n],
      description: `lambda=${(Math.round(lambda * 100) / 100)}: 緩和後の最適値=${Math.round(dp[n] * 100) / 100}, 使用区間数=${cnt[n]}`,
    });

    if (cnt[n] <= targetK) {
      hi = lambda;
    } else {
      lo = lambda;
    }
  }

  steps.push({
    type: "done",
    lambda: Math.round((lo + hi) / 2 * 100) / 100,
    dp: [],
    count: [],
    optValue: 0,
    optCount: targetK,
    description: `完了。最適なlambda ≈ ${Math.round((lo + hi) / 2 * 100) / 100}`,
  });

  return steps;
}

// --- Component ---

export default function AlienDPAnimationPage() {
  const [arrInput, setArrInput] = useState("3 -1 4 -1 5 -9 2 6");
  const [kInput, setKInput] = useState("3");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    const arr = arrInput.trim().split(/[\s,]+/).map(Number).filter(x => !isNaN(x));
    const k = Math.max(1, parseInt(kInput) || 3);
    if (arr.length === 0) return;
    setSteps(generateSteps(arr, k));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [arrInput, kInput]);

  useEffect(() => {
    setSteps(generateSteps([3, -1, 4, -1, 5, -9, 2, 6], 3));
    setCurrentStep(0);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((prev) => !prev); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Alien DP</h1>
        <p className="text-sm text-muted-foreground mb-6">ラグランジュ緩和で個数制約を除去する最適化テクニック</p>

        <div className="flex flex-wrap gap-2 mb-8">
          <Input value={arrInput} onChange={(e) => setArrInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="配列" className="font-mono max-w-xs" />
          <Input value={kInput} onChange={(e) => setKInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="K" className="font-mono w-16" />
          <Button onClick={run} variant="outline">実行</Button>
        </div>

        {/* Lambda search visualization */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">二分探索の状態</div>
          <div className="p-3 border border-gray-200 rounded bg-white">
            <div className="text-sm font-mono">
              lambda = {step.lambda}
            </div>
            {step.dp.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">緩和後DP値: </span>
                <span className="text-xs font-mono">{step.optValue}</span>
                <span className="text-xs text-muted-foreground ml-4">使用区間数: </span>
                <span className="text-xs font-mono">{step.optCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* DP values */}
        {step.dp.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">緩和DP / 区間数</div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {step.dp.map((val, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className="w-14 h-10 flex items-center justify-center border bg-white border-gray-200 text-xs font-mono">
                    {val}
                  </div>
                  <div className="w-14 h-6 flex items-center justify-center text-[10px] text-muted-foreground font-mono">
                    k={step.count[idx]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
      </div>
    </div>
  );
}
