"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "check_coprime" | "count" | "done";

interface Step {
  type: StepType;
  n: number;
  current: number;
  coprimes: number[];
  phi: number;
  description: string;
}

// --- GCD ---

function gcd(a: number, b: number): number {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

// --- Algorithm step generation ---

function generateSteps(n: number): Step[] {
  const steps: Step[] = [];
  const coprimes: number[] = [];

  steps.push({
    type: "init",
    n,
    current: 0,
    coprimes: [],
    phi: 0,
    description: `phi(${n}) を求める: 1 から ${n} の中で ${n} と互いに素な数を数える`,
  });

  for (let i = 1; i <= n; i++) {
    const g = gcd(i, n);
    const isCoprime = g === 1;

    if (isCoprime) {
      coprimes.push(i);
    }

    steps.push({
      type: "check_coprime",
      n,
      current: i,
      coprimes: [...coprimes],
      phi: coprimes.length,
      description: isCoprime
        ? `gcd(${i}, ${n}) = 1 → 互いに素`
        : `gcd(${i}, ${n}) = ${g} → 互いに素でない`,
    });
  }

  steps.push({
    type: "done",
    n,
    current: n,
    coprimes: [...coprimes],
    phi: coprimes.length,
    description: `phi(${n}) = ${coprimes.length}`,
  });

  return steps;
}

// --- Component ---

export default function EulerTotientAnimationPage() {
  const [input, setInput] = useState("12");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const val = parseInt(s, 10);
    if (isNaN(val) || val < 1 || val > 60) return;
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
    }, 400);
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

  const cols = Math.min(10, step.n);

  return (
    <>
{/* Input */}
        <div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="n (1-60)"
            className="font-mono max-w-[120px]"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* Number grid */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            1 から {step.n} までの数
          </div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: step.n }, (_, i) => {
              const num = i + 1;
              let cls =
                "h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors";
              if (num === step.current && step.type === "check_coprime") {
                const isCoprime = step.coprimes.includes(num);
                cls += isCoprime
                  ? " bg-emerald-100 border-emerald-500 font-bold"
                  : " bg-red-100 border-red-500";
              } else if (step.coprimes.includes(num)) {
                cls += " bg-emerald-100 border-emerald-500";
              } else if (num < step.current || step.type === "done") {
                cls += " bg-gray-100 border-gray-300 text-muted-foreground";
              } else {
                cls += " bg-white border-gray-200";
              }
              return (
                <div key={num} className={cls}>
                  {num}
                </div>
              );
            })}
          </div>
        </div>

        {/* Result */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            結果
          </div>
          <div
            className={`inline-block px-6 py-3 border-2 rounded font-mono text-lg font-bold ${
              step.type === "done"
                ? "bg-emerald-100 border-emerald-500"
                : "bg-amber-50 border-amber-400"
            }`}
          >
            phi({step.n}) = {step.phi}
          </div>
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
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>互いに素</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>互いに素でない</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200" />
            <span>未処理</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>
            ← 前へ
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>
            次へ →
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>
            {isPlaying ? "停止" : "再生"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>
            リセット
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
    </>
  );
}
