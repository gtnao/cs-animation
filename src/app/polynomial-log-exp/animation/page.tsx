"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "derivative"
  | "inverse"
  | "multiply"
  | "integrate"
  | "log_done"
  | "exp_newton_start"
  | "exp_newton_step"
  | "exp_done"
  | "done";

interface Step {
  type: StepType;
  f: number[];
  result: number[];
  mode: "log" | "exp";
  precision: number;
  targetPrecision: number;
  description: string;
}

// --- Helpers ---

function polyMul(a: number[], b: number[], maxLen: number): number[] {
  const result = new Array(maxLen).fill(0);
  for (let i = 0; i < Math.min(a.length, maxLen); i++) {
    for (let j = 0; j < Math.min(b.length, maxLen); j++) {
      if (i + j < maxLen) {
        result[i + j] += a[i] * b[j];
      }
    }
  }
  return result;
}

function polyDerivative(a: number[]): number[] {
  if (a.length <= 1) return [0];
  const result = new Array(a.length - 1).fill(0);
  for (let i = 1; i < a.length; i++) {
    result[i - 1] = a[i] * i;
  }
  return result;
}

function polyIntegral(a: number[]): number[] {
  const result = new Array(a.length + 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    result[i + 1] = a[i] / (i + 1);
  }
  return result;
}

function polyInverse(a: number[], n: number): number[] {
  if (a.length === 0 || a[0] === 0) return new Array(n).fill(0);
  let g = [1 / a[0]];
  let prec = 1;
  while (prec < n) {
    const newPrec = Math.min(prec * 2, n);
    const fTrunc = a.slice(0, newPrec);
    while (fTrunc.length < newPrec) fTrunc.push(0);
    const gSq = polyMul(g, g, newPrec);
    const gSqF = polyMul(gSq, fTrunc, newPrec);
    const newG = new Array(newPrec).fill(0);
    for (let i = 0; i < newPrec; i++) {
      const gi = i < g.length ? g[i] : 0;
      newG[i] = 2 * gi - (i < gSqF.length ? gSqF[i] : 0);
    }
    g = newG;
    prec = newPrec;
  }
  return g.slice(0, n);
}

// --- Algorithm step generation for log ---

function generateLogSteps(fCoeffs: number[]): Step[] {
  const steps: Step[] = [];
  const f = [...fCoeffs];
  const n = f.length;

  steps.push({
    type: "init",
    f: [...f],
    result: [],
    mode: "log",
    precision: 0,
    targetPrecision: n,
    description: `log(f(x)) を求める。f(x) = [${f.map((x) => x.toFixed(2)).join(", ")}], f[0] = ${f[0]} (1 である必要がある)`,
  });

  // Step 1: f'(x)
  const fPrime = polyDerivative(f);
  steps.push({
    type: "derivative",
    f: [...f],
    result: fPrime.map((x) => Math.round(x * 10000) / 10000),
    mode: "log",
    precision: n - 1,
    targetPrecision: n,
    description: `f'(x) = [${fPrime.map((x) => x.toFixed(2)).join(", ")}]`,
  });

  // Step 2: 1/f(x)
  const fInv = polyInverse(f, n);
  steps.push({
    type: "inverse",
    f: [...f],
    result: fInv.map((x) => Math.round(x * 10000) / 10000),
    mode: "log",
    precision: n,
    targetPrecision: n,
    description: `1/f(x) = [${fInv.map((x) => x.toFixed(4)).join(", ")}]`,
  });

  // Step 3: f'(x) / f(x)
  const quotient = polyMul(fPrime, fInv, n);
  steps.push({
    type: "multiply",
    f: [...f],
    result: quotient.map((x) => Math.round(x * 10000) / 10000),
    mode: "log",
    precision: n,
    targetPrecision: n,
    description: `f'(x) / f(x) = [${quotient.map((x) => x.toFixed(4)).join(", ")}]`,
  });

  // Step 4: integral
  const logResult = polyIntegral(quotient).slice(0, n);
  steps.push({
    type: "integrate",
    f: [...f],
    result: logResult.map((x) => Math.round(x * 10000) / 10000),
    mode: "log",
    precision: n,
    targetPrecision: n,
    description: `log(f(x)) = integrate(f'/f) = [${logResult.map((x) => x.toFixed(4)).join(", ")}]`,
  });

  steps.push({
    type: "log_done",
    f: [...f],
    result: logResult.map((x) => Math.round(x * 10000) / 10000),
    mode: "log",
    precision: n,
    targetPrecision: n,
    description: `log 計算完了`,
  });

  return steps;
}

// --- Algorithm step generation for exp ---

function generateExpSteps(fCoeffs: number[]): Step[] {
  const steps: Step[] = [];
  const f = [...fCoeffs];
  const n = f.length;

  steps.push({
    type: "init",
    f: [...f],
    result: [],
    mode: "exp",
    precision: 0,
    targetPrecision: n,
    description: `exp(f(x)) を求める。f(x) = [${f.map((x) => x.toFixed(2)).join(", ")}], f[0] = ${f[0]} (0 である必要がある)`,
  });

  // Newton's method: g_{k+1} = g_k * (1 - log(g_k) + f)
  let g = [1];
  let prec = 1;
  let iter = 0;

  steps.push({
    type: "exp_newton_start",
    f: [...f],
    result: [...g],
    mode: "exp",
    precision: prec,
    targetPrecision: n,
    description: `初期値: g_0 = [1]`,
  });

  while (prec < n) {
    const newPrec = Math.min(prec * 2, n);
    iter++;

    // Compute log(g) mod x^newPrec
    const gPadded = new Array(newPrec).fill(0);
    for (let i = 0; i < g.length; i++) gPadded[i] = g[i];

    const gPrime = polyDerivative(gPadded);
    const gInv = polyInverse(gPadded, newPrec);
    const gQuot = polyMul(gPrime, gInv, newPrec);
    const logG = polyIntegral(gQuot).slice(0, newPrec);

    // 1 - log(g) + f
    const diff = new Array(newPrec).fill(0);
    diff[0] = 1;
    for (let i = 0; i < newPrec; i++) {
      diff[i] -= i < logG.length ? logG[i] : 0;
      diff[i] += i < f.length ? f[i] : 0;
    }

    const newG = polyMul(gPadded, diff, newPrec);

    g = newG.slice(0, newPrec);
    prec = newPrec;

    steps.push({
      type: "exp_newton_step",
      f: [...f],
      result: g.map((x) => Math.round(x * 10000) / 10000),
      mode: "exp",
      precision: prec,
      targetPrecision: n,
      description: `ニュートン反復 ${iter}: g = g * (1 - log(g) + f) mod x^${prec}`,
    });
  }

  steps.push({
    type: "exp_done",
    f: [...f],
    result: g.slice(0, n).map((x) => Math.round(x * 10000) / 10000),
    mode: "exp",
    precision: n,
    targetPrecision: n,
    description: `exp 計算完了`,
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step, target: "f" | "result"): string {
  const base =
    "min-w-[4rem] h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors px-1";

  if (target === "result") {
    if (step.type === "log_done" || step.type === "exp_done") {
      return `${base} bg-emerald-100 border-emerald-500`;
    }
    if (
      step.type === "exp_newton_step" ||
      step.type === "integrate" ||
      step.type === "multiply"
    ) {
      if (idx < step.precision) {
        return `${base} bg-blue-100 border-blue-400`;
      }
    }
    if (step.type === "derivative" || step.type === "inverse") {
      return `${base} bg-amber-50 border-amber-400`;
    }
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function PolynomialLogExpAnimationPage() {
  const [input, setInput] = useState("1,1,0.5,0.167");
  const [mode, setMode] = useState<"log" | "exp">("log");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(
    (s: string, m: "log" | "exp") => {
      const coeffs = s
        .split(",")
        .map((x) => parseFloat(x.trim()))
        .filter((x) => !isNaN(x));
      if (coeffs.length === 0) return;
      if (m === "log") {
        setSteps(generateLogSteps(coeffs));
      } else {
        setSteps(generateExpSteps(coeffs));
      }
      setCurrentStep(0);
      setIsPlaying(false);
    },
    []
  );

  useEffect(() => {
    run(input, mode);
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
    <>
<div className="flex flex-wrap gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input, mode);
            }}
            placeholder="係数 (例: 1,1,0.5,0.167)"
            className="font-mono max-w-xs"
          />
          <Button
            onClick={() => {
              const newMode = mode === "log" ? "exp" : "log";
              setMode(newMode);
              run(input, newMode);
            }}
            variant="outline"
          >
            {mode === "log" ? "log" : "exp"} モード
          </Button>
          <Button onClick={() => run(input, mode)} variant="outline">
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
            {step.mode === "log" ? "log(f(x))" : "exp(f(x))"} (精度:{" "}
            {step.precision}/{step.targetPrecision})
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.result.length > 0 ? (
              step.result.map((val, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={getCellClass(idx, step, "result")}>
                    {val.toFixed(3)}
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
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>現在計算中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>中間結果</span>
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
    </>
  );
}
