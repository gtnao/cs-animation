"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "decompose_n"
  | "decompose_k"
  | "compute_binom"
  | "multiply"
  | "done";

interface Step {
  type: StepType;
  n: number;
  k: number;
  p: number;
  nDigits: number[];
  kDigits: number[];
  currentDigit: number;
  binomials: number[];
  partialResult: number;
  description: string;
}

// --- Algorithm ---

function smallBinom(n: number, k: number, p: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * ((n - i) % p)) % p;
    let inv = 1;
    let base = (i + 1) % p;
    let exp = p - 2;
    while (exp > 0) {
      if (exp % 2 === 1) inv = (inv * base) % p;
      exp = Math.floor(exp / 2);
      base = (base * base) % p;
    }
    result = (result * inv) % p;
  }
  return result;
}

function generateSteps(n: number, k: number, p: number): Step[] {
  const steps: Step[] = [];

  steps.push({
    type: "init",
    n,
    k,
    p,
    nDigits: [],
    kDigits: [],
    currentDigit: -1,
    binomials: [],
    partialResult: 1,
    description: `Lucasの定理で C(${n}, ${k}) mod ${p} を計算する`,
  });

  if (k > n) {
    steps.push({
      type: "done",
      n,
      k,
      p,
      nDigits: [],
      kDigits: [],
      currentDigit: -1,
      binomials: [],
      partialResult: 0,
      description: `k > n なので C(${n}, ${k}) = 0`,
    });
    return steps;
  }

  // Decompose n in base p
  const nDigits: number[] = [];
  const kDigits: number[] = [];
  let tempN = n;
  let tempK = k;

  while (tempN > 0 || tempK > 0) {
    nDigits.push(tempN % p);
    kDigits.push(tempK % p);
    tempN = Math.floor(tempN / p);
    tempK = Math.floor(tempK / p);
  }

  steps.push({
    type: "decompose_n",
    n,
    k,
    p,
    nDigits: [...nDigits],
    kDigits: [],
    currentDigit: -1,
    binomials: [],
    partialResult: 1,
    description: `n = ${n} を ${p} 進展開: ${[...nDigits].reverse().join(", ")} (下位桁から: ${nDigits.join(", ")})`,
  });

  steps.push({
    type: "decompose_k",
    n,
    k,
    p,
    nDigits: [...nDigits],
    kDigits: [...kDigits],
    currentDigit: -1,
    binomials: [],
    partialResult: 1,
    description: `k = ${k} を ${p} 進展開: ${[...kDigits].reverse().join(", ")} (下位桁から: ${kDigits.join(", ")})`,
  });

  // Compute product of C(n_i, k_i) mod p
  const binomials: number[] = [];
  let result = 1;

  for (let i = 0; i < nDigits.length; i++) {
    const ni = nDigits[i];
    const ki = kDigits[i];
    const b = smallBinom(ni, ki, p);
    binomials.push(b);

    steps.push({
      type: "compute_binom",
      n,
      k,
      p,
      nDigits: [...nDigits],
      kDigits: [...kDigits],
      currentDigit: i,
      binomials: [...binomials],
      partialResult: result,
      description: `桁 ${i}: C(${ni}, ${ki}) mod ${p} = ${b}`,
    });

    result = (result * b) % p;

    if (result === 0) {
      steps.push({
        type: "multiply",
        n,
        k,
        p,
        nDigits: [...nDigits],
        kDigits: [...kDigits],
        currentDigit: i,
        binomials: [...binomials],
        partialResult: 0,
        description: `累積積 = ${result}。0 が含まれるため結果は 0`,
      });
      break;
    }

    steps.push({
      type: "multiply",
      n,
      k,
      p,
      nDigits: [...nDigits],
      kDigits: [...kDigits],
      currentDigit: i,
      binomials: [...binomials],
      partialResult: result,
      description: `累積積を更新: ${i === 0 ? b : `... * ${b}`} = ${result} (mod ${p})`,
    });
  }

  steps.push({
    type: "done",
    n,
    k,
    p,
    nDigits: [...nDigits],
    kDigits: [...kDigits],
    currentDigit: -1,
    binomials: [...binomials],
    partialResult: result,
    description: `計算完了: C(${n}, ${k}) mod ${p} = ${result}`,
  });

  return steps;
}

// --- Component ---

export default function LucasTheoremAnimationPage() {
  const [inputN, setInputN] = useState("10");
  const [inputK, setInputK] = useState("3");
  const [inputP, setInputP] = useState("3");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((nStr: string, kStr: string, pStr: string) => {
    const n = parseInt(nStr, 10);
    const k = parseInt(kStr, 10);
    const p = parseInt(pStr, 10);
    if (isNaN(n) || isNaN(k) || isNaN(p) || n < 0 || k < 0 || p < 2) return;
    if (n > 1000) return;
    setSteps(generateSteps(n, k, p));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputN, inputK, inputP);
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
    }, 700);
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
        <div className="flex gap-2 mb-8 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-sm">n:</span>
            <Input value={inputN} onChange={(e) => setInputN(e.target.value)} className="font-mono w-24" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">k:</span>
            <Input value={inputK} onChange={(e) => setInputK(e.target.value)} className="font-mono w-24" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">p:</span>
            <Input value={inputP} onChange={(e) => setInputP(e.target.value)} className="font-mono w-24" />
          </div>
          <Button onClick={() => run(inputN, inputK, inputP)} variant="outline">
            実行
          </Button>
        </div>

        {/* Digit decomposition */}
        {step.nDigits.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              {step.p} 進展開 (下位桁から)
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono w-8">n:</span>
                <div className="flex gap-1">
                  {step.nDigits.map((d, idx) => {
                    const base = "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
                    let cls = `${base} bg-white border-gray-200`;
                    if (idx === step.currentDigit) cls = `${base} bg-blue-100 border-blue-400`;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <div className={cls}>{d}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {step.kDigits.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono w-8">k:</span>
                  <div className="flex gap-1">
                    {step.kDigits.map((d, idx) => {
                      const base = "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
                      let cls = `${base} bg-white border-gray-200`;
                      if (idx === step.currentDigit) cls = `${base} bg-blue-100 border-blue-400`;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div className={cls}>{d}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Binomial values */}
        {step.binomials.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              各桁の二項係数 C(n_i, k_i) mod {step.p}
            </div>
            <div className="flex gap-1">
              {step.binomials.map((b, idx) => {
                const base = "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
                const cls = idx === step.currentDigit
                  ? `${base} bg-emerald-100 border-emerald-500`
                  : b === 0
                    ? `${base} bg-red-100 border-red-500`
                    : `${base} bg-white border-gray-200`;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className={cls}>{b}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Partial result */}
        {step.type !== "init" && step.type !== "decompose_n" && step.type !== "decompose_k" && (
          <div className="mb-6 p-3 border border-border rounded">
            <span className="text-sm font-mono">
              累積積 = <span className="font-bold">{step.partialResult}</span> (mod {step.p})
            </span>
          </div>
        )}

        {/* Result */}
        {step.type === "done" && (
          <div className="mb-6 p-4 border border-emerald-500 bg-emerald-50 rounded">
            <span className="text-sm font-mono font-bold">
              C({step.n}, {step.k}) mod {step.p} = {step.partialResult}
            </span>
          </div>
        )}

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
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
            <span>現在の桁</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>計算済み</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>0 (結果が0になる)</span>
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
