"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "compute_dp" | "use_recurrence" | "done";

interface Step {
  type: StepType;
  n: number;
  catalan: number[];
  currentIndex: number;
  iIdx: number;
  jIdx: number;
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(n: number): Step[] {
  const steps: Step[] = [];
  const c: number[] = new Array(n + 1).fill(0);
  c[0] = 1;

  steps.push({
    type: "init",
    n,
    catalan: [...c],
    currentIndex: 0,
    iIdx: -1,
    jIdx: -1,
    description: `カタラン数 C(0) ~ C(${n}) を漸化式で計算。C(0) = 1`,
  });

  for (let i = 1; i <= n; i++) {
    for (let j = 0; j < i; j++) {
      const prev = c[i];
      c[i] += c[j] * c[i - 1 - j];

      steps.push({
        type: "use_recurrence",
        n,
        catalan: [...c],
        currentIndex: i,
        iIdx: j,
        jIdx: i - 1 - j,
        description: `C(${i}) += C(${j}) * C(${i - 1 - j}) = ${c[j]} * ${c[i - 1 - j]} = ${c[j] * c[i - 1 - j]}  →  C(${i}) = ${c[i]}`,
      });
    }

    steps.push({
      type: "compute_dp",
      n,
      catalan: [...c],
      currentIndex: i,
      iIdx: -1,
      jIdx: -1,
      description: `C(${i}) = ${c[i]} 確定`,
    });
  }

  steps.push({
    type: "done",
    n,
    catalan: [...c],
    currentIndex: -1,
    iIdx: -1,
    jIdx: -1,
    description: `計算完了: C(${n}) = ${c[n]}`,
  });

  return steps;
}

// --- Component ---

export default function CatalanNumberAnimationPage() {
  const [input, setInput] = useState("5");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const val = parseInt(s, 10);
    if (isNaN(val) || val < 0 || val > 12) return;
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

        {/* Catalan array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            カタラン数 C(i)
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.catalan.map((val, idx) => {
              const base =
                "w-14 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              let cls: string;
              if (idx === step.currentIndex && step.type === "compute_dp") {
                cls = `${base} bg-emerald-100 border-emerald-500 font-bold`;
              } else if (idx === step.currentIndex) {
                cls = `${base} bg-blue-100 border-blue-400`;
              } else if (idx === step.iIdx || idx === step.jIdx) {
                cls = `${base} bg-amber-50 border-amber-400`;
              } else if (step.type === "done" && idx === step.n) {
                cls = `${base} bg-emerald-100 border-emerald-500 font-bold`;
              } else if (val > 0) {
                cls = `${base} bg-white border-gray-300`;
              } else {
                cls = `${base} bg-gray-50 border-gray-200 text-muted-foreground`;
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{val > 0 ? val : "–"}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {idx}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.currentIndex >= 0 && step.type !== "done" && (
            <span>
              計算中: C(<span className="font-mono font-semibold text-foreground">{step.currentIndex}</span>)
            </span>
          )}
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
            <span>現在の計算対象</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>参照中の値</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>確定</span>
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
