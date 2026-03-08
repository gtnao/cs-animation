"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "ext_gcd" | "merge" | "done" | "no_solution";

interface Step {
  type: StepType;
  currentR: number;
  currentM: number;
  processingIdx: number;
  equations: { r: number; m: number }[];
  description: string;
}

// --- Extended GCD ---

function extGcd(a: number, b: number): [number, number, number] {
  if (b === 0) return [a, 1, 0];
  const [g, x1, y1] = extGcd(b, a % b);
  return [g, y1, x1 - Math.floor(a / b) * y1];
}

// --- Algorithm step generation ---

function generateSteps(
  equations: { r: number; m: number }[]
): Step[] {
  if (equations.length === 0) return [];
  const steps: Step[] = [];

  let r = ((equations[0].r % equations[0].m) + equations[0].m) % equations[0].m;
  let m = equations[0].m;

  steps.push({
    type: "init",
    currentR: r,
    currentM: m,
    processingIdx: 0,
    equations,
    description: `初期値: x ≡ ${r} (mod ${m})`,
  });

  for (let i = 1; i < equations.length; i++) {
    const r2 = ((equations[i].r % equations[i].m) + equations[i].m) % equations[i].m;
    const m2 = equations[i].m;

    const [g, p, _q] = extGcd(m, m2);

    steps.push({
      type: "ext_gcd",
      currentR: r,
      currentM: m,
      processingIdx: i,
      equations,
      description: `x ≡ ${r} (mod ${m}) と x ≡ ${r2} (mod ${m2}) を統合。gcd(${m}, ${m2}) = ${g}`,
    });

    if ((r2 - r) % g !== 0) {
      steps.push({
        type: "no_solution",
        currentR: 0,
        currentM: 0,
        processingIdx: i,
        equations,
        description: `(${r2} - ${r}) = ${r2 - r} は gcd = ${g} で割り切れないため解なし`,
      });
      return steps;
    }

    const lcm = (m / g) * m2;
    const diff = r2 - r;
    const newR = (r + m * (((p * (diff / g)) % (m2 / g) + (m2 / g)) % (m2 / g))) % lcm;

    steps.push({
      type: "merge",
      currentR: ((newR % lcm) + lcm) % lcm,
      currentM: lcm,
      processingIdx: i,
      equations,
      description: `統合結果: x ≡ ${((newR % lcm) + lcm) % lcm} (mod ${lcm})`,
    });

    r = ((newR % lcm) + lcm) % lcm;
    m = lcm;
  }

  steps.push({
    type: "done",
    currentR: r,
    currentM: m,
    processingIdx: equations.length,
    equations,
    description: `完了: x ≡ ${r} (mod ${m})。最小の非負整数解は x = ${r}`,
  });

  return steps;
}

// --- Component ---

export default function CRTAnimationPage() {
  const [inputEqs, setInputEqs] = useState("2,3;3,5;2,7");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parseInput = (s: string): { r: number; m: number }[] => {
    return s
      .split(";")
      .map((pair) => {
        const [r, m] = pair.split(",").map(Number);
        return { r, m };
      })
      .filter(({ r, m }) => !isNaN(r) && !isNaN(m) && m > 0);
  };

  const run = useCallback((s: string) => {
    const eqs = parseInput(s);
    if (eqs.length === 0) return;
    setSteps(generateSteps(eqs));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputEqs);
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
    }, 1000);
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
        <div className="flex gap-2 mb-2">
          <Input
            value={inputEqs}
            onChange={(e) => setInputEqs(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputEqs);
            }}
            placeholder="r1,m1;r2,m2;..."
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(inputEqs)} variant="outline">
            実行
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-8">
          「余り,法」をセミコロンで区切って入力 (例: 2,3;3,5;2,7)
        </p>

        {/* Equations */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            合同式
          </div>
          <div className="flex flex-wrap gap-2">
            {step.equations.map((eq, idx) => {
              let cls = "px-4 py-2 border-2 rounded font-mono text-sm transition-colors";
              if (idx === step.processingIdx && step.type !== "done") {
                cls += " bg-blue-100 border-blue-400";
              } else if (idx < step.processingIdx) {
                cls += " bg-emerald-100 border-emerald-500";
              } else {
                cls += " bg-white border-gray-200";
              }
              return (
                <div key={idx} className={cls}>
                  x ≡ {eq.r} (mod {eq.m})
                </div>
              );
            })}
          </div>
        </div>

        {/* Current merged result */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            現在の統合結果
          </div>
          <div
            className={`inline-block px-6 py-3 border-2 rounded font-mono text-lg font-bold ${
              step.type === "done"
                ? "bg-emerald-100 border-emerald-500"
                : step.type === "no_solution"
                ? "bg-red-100 border-red-500"
                : "bg-amber-50 border-amber-400"
            }`}
          >
            {step.type === "no_solution"
              ? "解なし"
              : `x ≡ ${step.currentR} (mod ${step.currentM})`}
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
            <span>統合済み</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>現在の結果</span>
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
