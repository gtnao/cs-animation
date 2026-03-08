"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "split"
  | "ntt_forward"
  | "pointwise"
  | "ntt_inverse"
  | "reconstruct"
  | "done";

interface Step {
  type: StepType;
  arrayA: number[];
  arrayB: number[];
  result: number[];
  highlightIdx?: number;
  mod: number;
  description: string;
}

// --- Helpers ---

function convNaive(a: number[], b: number[], mod: number): number[] {
  const n = a.length + b.length - 1;
  const c = new Array(n).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      c[i + j] = (c[i + j] + a[i] * b[j]) % mod;
    }
  }
  return c;
}

// --- Algorithm step generation ---
// Demonstrates the Garner-based arbitrary mod convolution approach conceptually

function generateSteps(
  aCoeffs: number[],
  bCoeffs: number[],
  mod: number
): Step[] {
  const steps: Step[] = [];
  const resultLen = aCoeffs.length + bCoeffs.length - 1;

  steps.push({
    type: "init",
    arrayA: [...aCoeffs],
    arrayB: [...bCoeffs],
    result: new Array(resultLen).fill(0),
    mod,
    description: `A = [${aCoeffs.join(", ")}], B = [${bCoeffs.join(", ")}], mod = ${mod}`,
  });

  // Split: conceptually split using 3 NTT-friendly primes
  const m1 = 998244353;
  const m2 = 985661441;
  const m3 = 754974721;

  steps.push({
    type: "split",
    arrayA: [...aCoeffs],
    arrayB: [...bCoeffs],
    result: new Array(resultLen).fill(0),
    mod,
    description: `3つのNTT-friendly素数 (${m1}, ${m2}, ${m3}) で畳み込みを実行`,
  });

  // NTT forward on each mod (conceptual)
  const c1 = convNaive(
    aCoeffs.map((x) => ((x % m1) + m1) % m1),
    bCoeffs.map((x) => ((x % m1) + m1) % m1),
    m1
  );

  steps.push({
    type: "ntt_forward",
    arrayA: [...aCoeffs],
    arrayB: [...bCoeffs],
    result: c1.slice(0, resultLen),
    mod,
    description: `mod ${m1} での畳み込み結果: [${c1.slice(0, Math.min(resultLen, 6)).join(", ")}${resultLen > 6 ? ", ..." : ""}]`,
  });

  const c2 = convNaive(
    aCoeffs.map((x) => ((x % m2) + m2) % m2),
    bCoeffs.map((x) => ((x % m2) + m2) % m2),
    m2
  );

  steps.push({
    type: "ntt_forward",
    arrayA: [...aCoeffs],
    arrayB: [...bCoeffs],
    result: c2.slice(0, resultLen),
    mod,
    description: `mod ${m2} での畳み込み結果: [${c2.slice(0, Math.min(resultLen, 6)).join(", ")}${resultLen > 6 ? ", ..." : ""}]`,
  });

  const c3 = convNaive(
    aCoeffs.map((x) => ((x % m3) + m3) % m3),
    bCoeffs.map((x) => ((x % m3) + m3) % m3),
    m3
  );

  steps.push({
    type: "ntt_forward",
    arrayA: [...aCoeffs],
    arrayB: [...bCoeffs],
    result: c3.slice(0, resultLen),
    mod,
    description: `mod ${m3} での畳み込み結果: [${c3.slice(0, Math.min(resultLen, 6)).join(", ")}${resultLen > 6 ? ", ..." : ""}]`,
  });

  // Reconstruct using Garner's algorithm
  const finalResult = convNaive(aCoeffs, bCoeffs, mod);

  for (let i = 0; i < resultLen; i++) {
    const partial = [...finalResult];
    for (let j = i + 1; j < resultLen; j++) partial[j] = 0;

    steps.push({
      type: "reconstruct",
      arrayA: [...aCoeffs],
      arrayB: [...bCoeffs],
      result: partial,
      highlightIdx: i,
      mod,
      description: `Garner のアルゴリズムで c[${i}] = ${finalResult[i]} を復元 (mod ${mod})`,
    });
  }

  steps.push({
    type: "done",
    arrayA: [...aCoeffs],
    arrayB: [...bCoeffs],
    result: finalResult,
    mod,
    description: `畳み込み完了: [${finalResult.join(", ")}] (mod ${mod})`,
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(
  idx: number,
  step: Step,
  target: "a" | "b" | "result"
): string {
  const base =
    "min-w-[3rem] h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors px-1";

  if (target === "result") {
    if (step.type === "reconstruct" && idx === step.highlightIdx) {
      return `${base} bg-blue-100 border-blue-400`;
    }
    if (
      step.type === "reconstruct" &&
      step.highlightIdx !== undefined &&
      idx < step.highlightIdx
    ) {
      return `${base} bg-emerald-100 border-emerald-500`;
    }
    if (step.type === "done") {
      return `${base} bg-emerald-100 border-emerald-500`;
    }
  }

  if (target === "a" || target === "b") {
    if (step.type === "ntt_forward") {
      return `${base} bg-amber-50 border-amber-400`;
    }
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function ArbitraryModConvolutionAnimationPage() {
  const [inputA, setInputA] = useState("1,2,3");
  const [inputB, setInputB] = useState("4,5,6");
  const [inputMod, setInputMod] = useState("1000000007");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((sA: string, sB: string, sMod: string) => {
    const a = sA
      .split(",")
      .map((x) => parseInt(x.trim(), 10))
      .filter((x) => !isNaN(x));
    const b = sB
      .split(",")
      .map((x) => parseInt(x.trim(), 10))
      .filter((x) => !isNaN(x));
    const m = parseInt(sMod.trim(), 10);
    if (a.length === 0 || b.length === 0 || isNaN(m) || m <= 0) return;
    setSteps(generateSteps(a, b, m));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputA, inputB, inputMod);
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

  return (
    <>
<div className="flex flex-wrap gap-2 mb-8">
          <Input
            value={inputA}
            onChange={(e) => setInputA(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputA, inputB, inputMod);
            }}
            placeholder="A の係数"
            className="font-mono max-w-[10rem]"
          />
          <Input
            value={inputB}
            onChange={(e) => setInputB(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputA, inputB, inputMod);
            }}
            placeholder="B の係数"
            className="font-mono max-w-[10rem]"
          />
          <Input
            value={inputMod}
            onChange={(e) => setInputMod(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputA, inputB, inputMod);
            }}
            placeholder="mod"
            className="font-mono max-w-[10rem]"
          />
          <Button
            onClick={() => run(inputA, inputB, inputMod)}
            variant="outline"
          >
            実行
          </Button>
        </div>

        {/* Arrays */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            多項式 A
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.arrayA.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step, "a")}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  x^{idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            多項式 B
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.arrayB.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step, "b")}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  x^{idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            結果 C = A * B (mod {step.mod})
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.result.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step, "result")}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  x^{idx}
                </div>
              </div>
            ))}
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
            <span>現在復元中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>NTT計算中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>確定</span>
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
