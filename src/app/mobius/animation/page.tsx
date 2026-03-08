"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "factorize" | "evaluate" | "done";

interface Step {
  type: StepType;
  current: number;
  mu: number[];
  factors?: number[];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(n: number): Step[] {
  const steps: Step[] = [];
  const mu = new Array(n + 1).fill(0);
  mu[1] = 1;

  steps.push({
    type: "init",
    current: 1,
    mu: [...mu],
    description: `メビウス関数を計算。mu(1) = 1`,
  });

  for (let i = 2; i <= n; i++) {
    // Factorize
    let x = i;
    const factors: number[] = [];
    let squareFree = true;
    let d = 2;
    while (d * d <= x) {
      if (x % d === 0) {
        factors.push(d);
        x /= d;
        if (x % d === 0) {
          squareFree = false;
          break;
        }
      }
      d++;
    }
    if (x > 1 && squareFree) factors.push(x);

    steps.push({
      type: "factorize",
      current: i,
      mu: [...mu],
      factors: squareFree ? factors : [],
      description: squareFree
        ? `${i} を素因数分解: ${i} = ${factors.join(" × ")}${factors.length > 0 ? "" : "1"} (平方因子なし)`
        : `${i} は平方因子を持つ`,
    });

    if (!squareFree) {
      mu[i] = 0;
    } else {
      mu[i] = factors.length % 2 === 0 ? 1 : -1;
    }

    steps.push({
      type: "evaluate",
      current: i,
      mu: [...mu],
      description: !squareFree
        ? `mu(${i}) = 0 (平方因子あり)`
        : `mu(${i}) = ${mu[i]} (${factors.length} 個の素因数、${factors.length % 2 === 0 ? "偶数" : "奇数"}個)`,
    });
  }

  steps.push({
    type: "done",
    current: n + 1,
    mu: [...mu],
    description: `計算完了`,
  });

  return steps;
}

// --- Component ---

export default function MobiusAnimationPage() {
  const [input, setInput] = useState("20");
  const [n, setN] = useState(20);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const val = parseInt(s, 10);
    if (isNaN(val) || val < 1 || val > 50) return;
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
    }, 600);
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
            placeholder="N (1-50)"
            className="font-mono max-w-[120px]"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* Grid */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            メビウス関数 mu(n)
          </div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: n }, (_, i) => {
              const num = i + 1;
              const val = step.mu[num];
              let cls =
                "h-12 flex flex-col items-center justify-center border-2 text-xs font-mono transition-colors";
              if (num === step.current && step.type !== "done") {
                cls += " bg-blue-100 border-blue-400 font-bold";
              } else if (val === 1) {
                cls += " bg-emerald-100 border-emerald-500";
              } else if (val === -1) {
                cls += " bg-amber-50 border-amber-400";
              } else if (val === 0 && num > 1) {
                cls += " bg-red-100 border-red-500";
              } else {
                cls += " bg-white border-gray-200";
              }
              return (
                <div key={num} className={cls}>
                  <span>{num}</span>
                  <span className="text-[10px] font-bold">
                    {val !== 0 || num === 1 || (step.current > num || step.type === "done") ? val : "?"}
                  </span>
                </div>
              );
            })}
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
            <span>現在処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>mu = 1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>mu = -1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>mu = 0</span>
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
