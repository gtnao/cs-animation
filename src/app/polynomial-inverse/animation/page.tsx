"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "base_case"
  | "newton_start"
  | "newton_compute"
  | "newton_result"
  | "verify"
  | "done";

interface Step {
  type: StepType;
  f: number[];
  g: number[];
  precision: number;
  targetPrecision: number;
  iteration: number;
  description: string;
}

// --- Helpers ---

function polyMul(a: number[], b: number[], maxLen: number): number[] {
  const result = new Array(maxLen).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (i + j < maxLen) {
        result[i + j] += a[i] * b[j];
      }
    }
  }
  return result;
}

function truncate(a: number[], len: number): number[] {
  const result = new Array(len).fill(0);
  for (let i = 0; i < Math.min(a.length, len); i++) {
    result[i] = a[i];
  }
  return result;
}

// --- Algorithm step generation ---

function generateSteps(fCoeffs: number[]): Step[] {
  const steps: Step[] = [];
  const f = [...fCoeffs];
  const targetN = f.length;

  if (f.length === 0 || f[0] === 0) {
    steps.push({
      type: "init",
      f: [...f],
      g: [],
      precision: 0,
      targetPrecision: targetN,
      iteration: 0,
      description: "f[0] = 0 のため逆元は存在しません",
    });
    return steps;
  }

  steps.push({
    type: "init",
    f: [...f],
    g: [],
    precision: 0,
    targetPrecision: targetN,
    iteration: 0,
    description: `f(x) = [${f.join(", ")}] の逆元 g(x) を mod x^${targetN} で求める`,
  });

  // Base case: g_1 = 1/f[0]
  const g0 = [1 / f[0]];
  let g = [...g0];
  let prec = 1;

  steps.push({
    type: "base_case",
    f: [...f],
    g: [...g],
    precision: prec,
    targetPrecision: targetN,
    iteration: 0,
    description: `初期値: g_1 = 1/f[0] = ${g[0].toFixed(4)}`,
  });

  let iter = 1;
  while (prec < targetN) {
    const newPrec = Math.min(prec * 2, targetN);

    steps.push({
      type: "newton_start",
      f: [...f],
      g: [...g],
      precision: prec,
      targetPrecision: targetN,
      iteration: iter,
      description: `ニュートン反復 ${iter}: 精度 ${prec} → ${newPrec}`,
    });

    // g_{k+1} = 2*g_k - g_k^2 * f  (mod x^newPrec)
    const fTrunc = truncate(f, newPrec);
    const gSquared = polyMul(g, g, newPrec);
    const gSqF = polyMul(gSquared, fTrunc, newPrec);

    steps.push({
      type: "newton_compute",
      f: [...f],
      g: [...g],
      precision: prec,
      targetPrecision: targetN,
      iteration: iter,
      description: `g^2 * f を計算し、g_{${iter + 1}} = 2g - g^2 * f を求める`,
    });

    const newG = new Array(newPrec).fill(0);
    for (let i = 0; i < newPrec; i++) {
      const gi = i < g.length ? g[i] : 0;
      newG[i] = 2 * gi - (i < gSqF.length ? gSqF[i] : 0);
    }

    g = newG;
    prec = newPrec;

    steps.push({
      type: "newton_result",
      f: [...f],
      g: [...g],
      precision: prec,
      targetPrecision: targetN,
      iteration: iter,
      description: `g = [${g.map((x) => x.toFixed(2)).join(", ")}] (精度 ${prec})`,
    });

    iter++;
  }

  // Verify
  const product = polyMul(f, g, targetN);
  steps.push({
    type: "verify",
    f: [...f],
    g: [...g],
    precision: prec,
    targetPrecision: targetN,
    iteration: iter,
    description: `検証: f * g mod x^${targetN} = [${product.map((x) => x.toFixed(2)).join(", ")}] (1, 0, 0, ... であれば正しい)`,
  });

  steps.push({
    type: "done",
    f: [...f],
    g: [...g],
    precision: prec,
    targetPrecision: targetN,
    iteration: iter,
    description: `完了: g(x) = [${g.map((x) => x.toFixed(4)).join(", ")}]`,
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step, target: "f" | "g"): string {
  const base =
    "min-w-[4rem] h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors px-1";

  if (target === "g") {
    if (step.type === "done") {
      return `${base} bg-emerald-100 border-emerald-500`;
    }
    if (step.type === "newton_result" && idx < step.precision) {
      return `${base} bg-blue-100 border-blue-400`;
    }
    if (idx < step.precision) {
      return `${base} bg-amber-50 border-amber-400`;
    }
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function PolynomialInverseAnimationPage() {
  const [input, setInput] = useState("1,1,1,1");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const coeffs = s
      .split(",")
      .map((x) => parseFloat(x.trim()))
      .filter((x) => !isNaN(x));
    if (coeffs.length === 0) return;
    setSteps(generateSteps(coeffs));
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
    }, 800);
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
        <h1 className="text-2xl font-bold mb-1">多項式の逆元・除算</h1>
        <p className="text-sm text-muted-foreground mb-6">
          形式的べき級数の逆元をニュートン法で求める
        </p>

        <div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="f(x) の係数 (例: 1,1,1,1)"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            f(x)
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.f.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step, "f")}>
                  {val.toFixed(2)}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  x^{idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            g(x) = 1/f(x) mod x^{step.targetPrecision} (精度: {step.precision}
            /{step.targetPrecision})
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.g.length > 0 ? (
              step.g.map((val, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={getCellClass(idx, step, "g")}>
                    {val.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    x^{idx}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                (まだ計算されていません)
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            反復{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.iteration}
            </span>
          </span>
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>新たに計算</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>確定済み項</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>完了</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep((prev) => Math.max(0, prev - 1));
              setIsPlaying(false);
            }}
            disabled={currentStep === 0}
          >
            ← 前へ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
              setIsPlaying(false);
            }}
            disabled={currentStep === steps.length - 1}
          >
            次へ →
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying((prev) => !prev)}
            disabled={currentStep === steps.length - 1}
          >
            {isPlaying ? "停止" : "再生"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep(0);
              setIsPlaying(false);
            }}
          >
            リセット
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
      </div>
    </div>
  );
}
