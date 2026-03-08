"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "check_prime" | "mark_composite" | "next" | "done";

interface Step {
  type: StepType;
  current: number;
  marking?: number;
  isPrime: boolean[];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(n: number): Step[] {
  const steps: Step[] = [];
  const isPrime = new Array(n + 1).fill(true);
  isPrime[0] = false;
  if (n >= 1) isPrime[1] = false;

  steps.push({
    type: "init",
    current: 2,
    isPrime: [...isPrime],
    description: `2 から ${n} までの数を素数候補として初期化`,
  });

  for (let i = 2; i * i <= n; i++) {
    if (isPrime[i]) {
      steps.push({
        type: "check_prime",
        current: i,
        isPrime: [...isPrime],
        description: `${i} は素数。${i} の倍数を消去する`,
      });

      for (let j = i * i; j <= n; j += i) {
        if (isPrime[j]) {
          isPrime[j] = false;
          steps.push({
            type: "mark_composite",
            current: i,
            marking: j,
            isPrime: [...isPrime],
            description: `${j} = ${i} × ${j / i} を合成数としてマーク`,
          });
        }
      }
    } else {
      steps.push({
        type: "next",
        current: i,
        isPrime: [...isPrime],
        description: `${i} は既に合成数としてマーク済み。スキップ`,
      });
    }
  }

  steps.push({
    type: "done",
    current: -1,
    isPrime: [...isPrime],
    description: `篩完了。${isPrime.filter((v, i) => v && i >= 2).length} 個の素数が見つかった`,
  });

  return steps;
}

// --- Component ---

export default function SieveAnimationPage() {
  const [input, setInput] = useState("50");
  const [n, setN] = useState(50);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const val = parseInt(s, 10);
    if (isNaN(val) || val < 2 || val > 200) return;
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

  // Compute grid columns
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
            placeholder="N (2-200)"
            className="font-mono max-w-[120px]"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* Number grid */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            数の配列
          </div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: n + 1 }, (_, i) => {
              if (i < 2) return null;
              let cls =
                "h-9 flex items-center justify-center border-2 text-xs font-mono transition-colors";
              if (i === step.marking) {
                cls += " bg-red-100 border-red-500";
              } else if (i === step.current && step.type !== "done") {
                cls += " bg-blue-100 border-blue-400 font-bold";
              } else if (step.isPrime[i]) {
                cls += " bg-emerald-100 border-emerald-500";
              } else {
                cls += " bg-gray-100 border-gray-300 text-muted-foreground line-through";
              }
              return (
                <div key={i} className={cls}>
                  {i}
                </div>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.current >= 2 && step.type !== "done" && (
            <span>
              処理中: <span className="font-mono font-semibold text-foreground">{step.current}</span>
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
            <span>現在処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>素数</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>消去中</span>
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
