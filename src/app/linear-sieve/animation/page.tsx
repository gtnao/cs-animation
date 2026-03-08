"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "check" | "mark" | "skip" | "done";

interface Step {
  type: StepType;
  i: number;
  primeIdx?: number;
  marking?: number;
  primes: number[];
  lpf: number[]; // lowest prime factor
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(n: number): Step[] {
  const steps: Step[] = [];
  const lpf = new Array(n + 1).fill(0);
  const primes: number[] = [];

  steps.push({
    type: "init",
    i: 2,
    primes: [],
    lpf: [...lpf],
    description: `線形篩を開始。2 から ${n} まで処理する`,
  });

  for (let i = 2; i <= n; i++) {
    if (lpf[i] === 0) {
      lpf[i] = i;
      primes.push(i);
      steps.push({
        type: "check",
        i,
        primes: [...primes],
        lpf: [...lpf],
        description: `${i} は素数 (最小素因数が未設定)。素数リストに追加`,
      });
    } else {
      steps.push({
        type: "check",
        i,
        primes: [...primes],
        lpf: [...lpf],
        description: `${i} は合成数 (最小素因数 = ${lpf[i]})`,
      });
    }

    for (let j = 0; j < primes.length; j++) {
      const p = primes[j];
      if (p > lpf[i] || i * p > n) break;
      lpf[i * p] = p;
      steps.push({
        type: "mark",
        i,
        primeIdx: j,
        marking: i * p,
        primes: [...primes],
        lpf: [...lpf],
        description: `${i} × ${p} = ${i * p} をマーク (最小素因数 = ${p})`,
      });
    }
  }

  steps.push({
    type: "done",
    i: n + 1,
    primes: [...primes],
    lpf: [...lpf],
    description: `完了。${primes.length} 個の素数が見つかった`,
  });

  return steps;
}

// --- Component ---

export default function LinearSieveAnimationPage() {
  const [input, setInput] = useState("30");
  const [n, setN] = useState(30);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const val = parseInt(s, 10);
    if (isNaN(val) || val < 2 || val > 100) return;
    setN(val);
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

  const cols = Math.min(10, n);

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
            placeholder="N (2-100)"
            className="font-mono max-w-[120px]"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* Number grid */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            数の配列 (最小素因数)
          </div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: n + 1 }, (_, i) => {
              if (i < 2) return null;
              let cls =
                "h-12 flex flex-col items-center justify-center border-2 text-xs font-mono transition-colors";
              if (i === step.marking) {
                cls += " bg-red-100 border-red-500";
              } else if (i === step.i && step.type !== "done") {
                cls += " bg-blue-100 border-blue-400 font-bold";
              } else if (step.lpf[i] === i && step.lpf[i] !== 0) {
                cls += " bg-emerald-100 border-emerald-500";
              } else if (step.lpf[i] !== 0) {
                cls += " bg-gray-100 border-gray-300 text-muted-foreground";
              } else {
                cls += " bg-white border-gray-200";
              }
              return (
                <div key={i} className={cls}>
                  <span>{i}</span>
                  {step.lpf[i] !== 0 && (
                    <span className="text-[9px] text-muted-foreground">
                      lpf={step.lpf[i]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Prime list */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            素数リスト
          </div>
          <div className="flex flex-wrap gap-1">
            {step.primes.map((p, idx) => (
              <div
                key={idx}
                className="px-2 py-1 bg-emerald-100 border-2 border-emerald-500 text-xs font-mono rounded"
              >
                {p}
              </div>
            ))}
            {step.primes.length === 0 && (
              <span className="text-xs text-muted-foreground">（まだ空）</span>
            )}
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>現在の i</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>素数</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>マーク中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-gray-100 border-2 border-gray-300" />
            <span>合成数</span>
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
