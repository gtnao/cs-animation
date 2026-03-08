"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "process_bit" | "update" | "done";

interface Step {
  type: StepType;
  bit: number;
  mask: number;
  dp: number[];
  description: string;
  highlightMask?: number;
  referenceMask?: number;
}

// --- Algorithm ---

function generateSteps(a: number[], n: number): Step[] {
  const steps: Step[] = [];
  const size = 1 << n;
  const dp = [...a];

  steps.push({
    type: "init",
    bit: -1,
    mask: -1,
    dp: [...dp],
    description: `SOS DP: ${n}ビット、配列サイズ${size}。各マスクについて全部分集合の総和を求める`,
  });

  for (let bit = 0; bit < n; bit++) {
    steps.push({
      type: "process_bit",
      bit,
      mask: -1,
      dp: [...dp],
      description: `ビット${bit}を処理。ビット${bit}が立っているマスクについて、ビット${bit}を落としたマスクの値を加算`,
    });

    for (let mask = 0; mask < size; mask++) {
      if (mask & (1 << bit)) {
        const from = mask ^ (1 << bit);
        dp[mask] += dp[from];

        steps.push({
          type: "update",
          bit,
          mask,
          dp: [...dp],
          description: `dp[${mask.toString(2).padStart(n, "0")}] += dp[${from.toString(2).padStart(n, "0")}] → ${dp[mask]}`,
          highlightMask: mask,
          referenceMask: from,
        });
      }
    }
  }

  steps.push({
    type: "done",
    bit: n,
    mask: -1,
    dp: [...dp],
    description: `完了。dp[mask] = Σ a[sub] for all sub ⊆ mask`,
  });

  return steps;
}

// --- Component ---

export default function SOSDPAnimationPage() {
  const [nInput, setNInput] = useState("3");
  const [arrInput, setArrInput] = useState("1 2 3 4 5 6 7 8");
  const [n, setN] = useState(3);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    const newN = Math.max(1, Math.min(parseInt(nInput) || 3, 4));
    const size = 1 << newN;
    const parsed = arrInput.trim().split(/[\s,]+/).map(Number);
    const arr = Array.from({ length: size }, (_, i) => parsed[i] || i + 1);
    setN(newN);
    setSteps(generateSteps(arr, newN));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [nInput, arrInput]);

  useEffect(() => {
    setSteps(generateSteps([1, 2, 3, 4, 5, 6, 7, 8], 3));
    setCurrentStep(0);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 400);
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

  const size = 1 << n;

  return (
    <>
<div className="flex flex-wrap gap-2 mb-8">
          <Input value={nInput} onChange={(e) => setNInput(e.target.value)} placeholder="ビット数" className="font-mono w-20" />
          <Input value={arrInput} onChange={(e) => setArrInput(e.target.value)} placeholder="配列値" className="font-mono max-w-xs" />
          <Button onClick={run} variant="outline">実行</Button>
        </div>

        {/* DP array */}
        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">dp 配列</div>
          <div className="flex gap-1">
            {Array.from({ length: size }, (_, mask) => {
              const base = "w-14 h-12 flex flex-col items-center justify-center border text-xs font-mono transition-colors";
              let cls = `${base} bg-white border-gray-200`;
              if (step.highlightMask === mask) cls = `${base} bg-blue-100 border-blue-400 font-bold`;
              else if (step.referenceMask === mask) cls = `${base} bg-amber-50 border-amber-400`;
              return (
                <div key={mask} className="flex flex-col items-center gap-1">
                  <div className={cls}>{step.dp[mask]}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{mask.toString(2).padStart(n, "0")}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.bit >= 0 && step.type !== "done" && (
            <span>ビット = <span className="font-mono font-semibold text-foreground">{step.bit}</span></span>
          )}
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>更新先</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>参照元</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
    </>
  );
}
