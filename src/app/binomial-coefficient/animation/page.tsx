"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "build_factorial"
  | "build_inverse"
  | "compute_numer"
  | "compute_denom"
  | "compute_result"
  | "done";

interface Step {
  type: StepType;
  n: number;
  k: number;
  mod: number;
  factorial: number[];
  invFactorial: number[];
  currentIndex: number;
  result: number | null;
  description: string;
}

// --- Algorithm step generation ---

function modpow(base: number, exp: number, mod: number): number {
  let result = 1;
  base = ((base % mod) + mod) % mod;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % mod;
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
}

function generateSteps(n: number, k: number, mod: number): Step[] {
  if (k > n) {
    return [
      {
        type: "init",
        n,
        k,
        mod,
        factorial: [],
        invFactorial: [],
        currentIndex: -1,
        result: null,
        description: `C(${n}, ${k}) mod ${mod} を計算。k > n なので結果は 0`,
      },
      {
        type: "done",
        n,
        k,
        mod,
        factorial: [],
        invFactorial: [],
        currentIndex: -1,
        result: 0,
        description: `結果: C(${n}, ${k}) mod ${mod} = 0`,
      },
    ];
  }

  const steps: Step[] = [];
  const fact: number[] = new Array(n + 1).fill(0);
  const inv: number[] = new Array(n + 1).fill(0);

  steps.push({
    type: "init",
    n,
    k,
    mod,
    factorial: [...fact],
    invFactorial: [...inv],
    currentIndex: -1,
    result: null,
    description: `C(${n}, ${k}) mod ${mod} を計算する。まず階乗テーブルを構築`,
  });

  // Build factorial table
  fact[0] = 1;
  for (let i = 1; i <= n; i++) {
    fact[i] = (fact[i - 1] * i) % mod;
    if (i <= 8 || i === n || i === k || i === n - k) {
      steps.push({
        type: "build_factorial",
        n,
        k,
        mod,
        factorial: [...fact],
        invFactorial: [...inv],
        currentIndex: i,
        result: null,
        description: `${i}! = ${fact[i - 1]} * ${i} = ${fact[i]} (mod ${mod})`,
      });
    }
  }

  // Build inverse factorial table
  inv[n] = modpow(fact[n], mod - 2, mod);
  steps.push({
    type: "build_inverse",
    n,
    k,
    mod,
    factorial: [...fact],
    invFactorial: [...inv],
    currentIndex: n,
    result: null,
    description: `(${n}!)^{-1} = ${fact[n]}^{${mod - 2}} mod ${mod} = ${inv[n]} (フェルマーの小定理)`,
  });

  for (let i = n - 1; i >= 0; i--) {
    inv[i] = (inv[i + 1] * (i + 1)) % mod;
    if (i <= 3 || i === k || i === n - k || i === 0) {
      steps.push({
        type: "build_inverse",
        n,
        k,
        mod,
        factorial: [...fact],
        invFactorial: [...inv],
        currentIndex: i,
        result: null,
        description: `(${i}!)^{-1} = (${i + 1}!)^{-1} * ${i + 1} = ${inv[i + 1]} * ${i + 1} = ${inv[i]} (mod ${mod})`,
      });
    }
  }

  // Compute result
  const numer = fact[n];
  steps.push({
    type: "compute_numer",
    n,
    k,
    mod,
    factorial: [...fact],
    invFactorial: [...inv],
    currentIndex: n,
    result: null,
    description: `分子: ${n}! = ${numer}`,
  });

  const denom = (inv[k] * inv[n - k]) % mod;
  steps.push({
    type: "compute_denom",
    n,
    k,
    mod,
    factorial: [...fact],
    invFactorial: [...inv],
    currentIndex: k,
    result: null,
    description: `分母の逆元: (${k}!)^{-1} * (${n - k}!)^{-1} = ${inv[k]} * ${inv[n - k]} = ${denom} (mod ${mod})`,
  });

  const result = (numer * denom) % mod;
  steps.push({
    type: "compute_result",
    n,
    k,
    mod,
    factorial: [...fact],
    invFactorial: [...inv],
    currentIndex: -1,
    result,
    description: `C(${n}, ${k}) = ${numer} * ${denom} = ${result} (mod ${mod})`,
  });

  steps.push({
    type: "done",
    n,
    k,
    mod,
    factorial: [...fact],
    invFactorial: [...inv],
    currentIndex: -1,
    result,
    description: `計算完了: C(${n}, ${k}) mod ${mod} = ${result}`,
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step, isInverse: boolean): string {
  const base =
    "w-12 h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors";

  if (idx === step.currentIndex) {
    if (step.type === "build_factorial" && !isInverse) {
      return `${base} bg-blue-100 border-blue-400`;
    }
    if (step.type === "build_inverse" && isInverse) {
      return `${base} bg-blue-100 border-blue-400`;
    }
    if (step.type === "compute_numer" && !isInverse) {
      return `${base} bg-emerald-100 border-emerald-500`;
    }
    if (step.type === "compute_denom" && isInverse) {
      return `${base} bg-amber-50 border-amber-400`;
    }
  }

  if (step.type === "compute_result" || step.type === "done") {
    if (!isInverse && idx === step.n) return `${base} bg-emerald-100 border-emerald-500`;
    if (isInverse && (idx === step.k || idx === step.n - step.k))
      return `${base} bg-amber-50 border-amber-400`;
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function BinomialCoefficientAnimationPage() {
  const [inputN, setInputN] = useState("10");
  const [inputK, setInputK] = useState("3");
  const [inputMod, setInputMod] = useState("13");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((nStr: string, kStr: string, modStr: string) => {
    const n = parseInt(nStr, 10);
    const k = parseInt(kStr, 10);
    const mod = parseInt(modStr, 10);
    if (isNaN(n) || isNaN(k) || isNaN(mod) || n < 0 || k < 0 || mod < 2) return;
    if (n > 20) return;
    setSteps(generateSteps(n, k, mod));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputN, inputK, inputMod);
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

  const displayLen = Math.min(step.factorial.length, 15);

  return (
    <>
{/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-sm">n:</span>
            <Input
              value={inputN}
              onChange={(e) => setInputN(e.target.value)}
              className="font-mono w-20"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">k:</span>
            <Input
              value={inputK}
              onChange={(e) => setInputK(e.target.value)}
              className="font-mono w-20"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">mod:</span>
            <Input
              value={inputMod}
              onChange={(e) => setInputMod(e.target.value)}
              className="font-mono w-20"
            />
          </div>
          <Button onClick={() => run(inputN, inputK, inputMod)} variant="outline">
            実行
          </Button>
        </div>

        {/* Factorial Table */}
        {step.factorial.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              階乗テーブル i!  mod {step.mod}
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {step.factorial.slice(0, displayLen).map((val, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={getCellClass(idx, step, false)}>
                    {val || "–"}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {idx}
                  </div>
                </div>
              ))}
              {step.factorial.length > displayLen && (
                <div className="flex items-center text-muted-foreground text-xs px-2">...</div>
              )}
            </div>
          </div>
        )}

        {/* Inverse Factorial Table */}
        {step.invFactorial.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              逆元テーブル (i!)^(-1) mod {step.mod}
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {step.invFactorial.slice(0, displayLen).map((val, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={getCellClass(idx, step, true)}>
                    {val || "–"}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {idx}
                  </div>
                </div>
              ))}
              {step.invFactorial.length > displayLen && (
                <div className="flex items-center text-muted-foreground text-xs px-2">...</div>
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {step.result !== null && (
          <div className="mb-6 p-4 border border-emerald-500 bg-emerald-50 rounded">
            <span className="text-sm font-mono font-bold">
              C({step.n}, {step.k}) mod {step.mod} = {step.result}
            </span>
          </div>
        )}

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
            <span>現在の計算位置</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>分母 (逆元)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>分子</span>
          </div>
        </div>

        {/* Controls */}
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
