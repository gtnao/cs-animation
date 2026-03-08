"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "split"
  | "compute_z0"
  | "compute_z2"
  | "compute_z1"
  | "combine"
  | "done";

interface Step {
  type: StepType;
  arrayA: number[];
  arrayB: number[];
  result: number[];
  splitIdx?: number;
  highlightA?: [number, number];
  highlightB?: [number, number];
  z0?: number[];
  z1?: number[];
  z2?: number[];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(aCoeffs: number[], bCoeffs: number[]): Step[] {
  const steps: Step[] = [];
  const n = Math.max(aCoeffs.length, bCoeffs.length);
  const a = [...aCoeffs];
  const b = [...bCoeffs];
  while (a.length < n) a.push(0);
  while (b.length < n) b.push(0);

  const resultLen = a.length + b.length - 1;

  steps.push({
    type: "init",
    arrayA: [...a],
    arrayB: [...b],
    result: new Array(resultLen).fill(0),
    description: `A = [${a.join(", ")}], B = [${b.join(", ")}] の乗算を Karatsuba 法で行う`,
  });

  const mid = Math.ceil(n / 2);

  // Split
  const a0 = a.slice(0, mid);
  const a1 = a.slice(mid);
  const b0 = b.slice(0, mid);
  const b1 = b.slice(mid);

  steps.push({
    type: "split",
    arrayA: [...a],
    arrayB: [...b],
    result: new Array(resultLen).fill(0),
    splitIdx: mid,
    highlightA: [0, mid - 1],
    highlightB: [mid, n - 1],
    description: `分割: A0 = [${a0.join(", ")}], A1 = [${a1.join(", ")}], B0 = [${b0.join(", ")}], B1 = [${b1.join(", ")}] (分割位置 = ${mid})`,
  });

  // z0 = a0 * b0
  const z0: number[] = new Array(a0.length + b0.length - 1).fill(0);
  for (let i = 0; i < a0.length; i++) {
    for (let j = 0; j < b0.length; j++) {
      z0[i + j] += a0[i] * b0[j];
    }
  }

  steps.push({
    type: "compute_z0",
    arrayA: [...a],
    arrayB: [...b],
    result: new Array(resultLen).fill(0),
    z0: [...z0],
    highlightA: [0, mid - 1],
    description: `z0 = A0 * B0 = [${z0.join(", ")}]`,
  });

  // z2 = a1 * b1
  const z2Len = a1.length > 0 && b1.length > 0 ? a1.length + b1.length - 1 : 0;
  const z2: number[] = new Array(Math.max(z2Len, 1)).fill(0);
  for (let i = 0; i < a1.length; i++) {
    for (let j = 0; j < b1.length; j++) {
      z2[i + j] += a1[i] * b1[j];
    }
  }

  steps.push({
    type: "compute_z2",
    arrayA: [...a],
    arrayB: [...b],
    result: new Array(resultLen).fill(0),
    z2: [...z2],
    highlightB: [mid, n - 1],
    description: `z2 = A1 * B1 = [${z2.join(", ")}]`,
  });

  // z1 = (a0+a1)*(b0+b1) - z0 - z2
  const maxLen = Math.max(a0.length, a1.length);
  const sumA: number[] = new Array(maxLen).fill(0);
  const sumB: number[] = new Array(maxLen).fill(0);
  for (let i = 0; i < a0.length; i++) sumA[i] += a0[i];
  for (let i = 0; i < a1.length; i++) sumA[i] += a1[i];
  for (let i = 0; i < b0.length; i++) sumB[i] += b0[i];
  for (let i = 0; i < b1.length; i++) sumB[i] += b1[i];

  const prod: number[] = new Array(sumA.length + sumB.length - 1).fill(0);
  for (let i = 0; i < sumA.length; i++) {
    for (let j = 0; j < sumB.length; j++) {
      prod[i + j] += sumA[i] * sumB[j];
    }
  }

  const z1len = Math.max(prod.length, z0.length, z2.length);
  const z1: number[] = new Array(z1len).fill(0);
  for (let i = 0; i < prod.length; i++) z1[i] += prod[i];
  for (let i = 0; i < z0.length; i++) z1[i] -= z0[i];
  for (let i = 0; i < z2.length; i++) z1[i] -= z2[i];

  steps.push({
    type: "compute_z1",
    arrayA: [...a],
    arrayB: [...b],
    result: new Array(resultLen).fill(0),
    z0: [...z0],
    z1: [...z1],
    z2: [...z2],
    description: `z1 = (A0+A1)*(B0+B1) - z0 - z2 = [${z1.join(", ")}]`,
  });

  // Combine: result = z0 + z1*x^mid + z2*x^(2*mid)
  const result: number[] = new Array(resultLen).fill(0);
  for (let i = 0; i < z0.length; i++) result[i] += z0[i];
  for (let i = 0; i < z1.length; i++) {
    if (i + mid < resultLen) result[i + mid] += z1[i];
  }
  for (let i = 0; i < z2.length; i++) {
    if (i + 2 * mid < resultLen) result[i + 2 * mid] += z2[i];
  }

  steps.push({
    type: "combine",
    arrayA: [...a],
    arrayB: [...b],
    result: [...result],
    z0: [...z0],
    z1: [...z1],
    z2: [...z2],
    splitIdx: mid,
    description: `結合: C = z0 + z1 * x^${mid} + z2 * x^${2 * mid}`,
  });

  steps.push({
    type: "done",
    arrayA: [...a],
    arrayB: [...b],
    result: [...result],
    description: `Karatsuba法 完了: C = [${result.join(", ")}]`,
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
    if (step.type === "done") {
      return `${base} bg-emerald-100 border-emerald-500`;
    }
    if (step.type === "combine") {
      return `${base} bg-blue-100 border-blue-400`;
    }
  }

  if (target === "a" && step.splitIdx !== undefined) {
    if (step.type === "split" || step.type === "compute_z0") {
      if (idx < step.splitIdx) return `${base} bg-amber-50 border-amber-400`;
      return `${base} bg-blue-100 border-blue-400`;
    }
  }

  if (target === "b" && step.splitIdx !== undefined) {
    if (step.type === "split" || step.type === "compute_z2") {
      if (idx < step.splitIdx) return `${base} bg-amber-50 border-amber-400`;
      return `${base} bg-blue-100 border-blue-400`;
    }
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function KaratsubaAnimationPage() {
  const [inputA, setInputA] = useState("1,2,3,4");
  const [inputB, setInputB] = useState("5,6,7,8");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((sA: string, sB: string) => {
    const a = sA
      .split(",")
      .map((x) => parseInt(x.trim(), 10))
      .filter((x) => !isNaN(x));
    const b = sB
      .split(",")
      .map((x) => parseInt(x.trim(), 10))
      .filter((x) => !isNaN(x));
    if (a.length === 0 || b.length === 0) return;
    setSteps(generateSteps(a, b));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputA, inputB);
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
            value={inputA}
            onChange={(e) => setInputA(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputA, inputB);
            }}
            placeholder="A の係数"
            className="font-mono max-w-[12rem]"
          />
          <Input
            value={inputB}
            onChange={(e) => setInputB(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputA, inputB);
            }}
            placeholder="B の係数"
            className="font-mono max-w-[12rem]"
          />
          <Button onClick={() => run(inputA, inputB)} variant="outline">
            実行
          </Button>
        </div>

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
            結果 C = A * B
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

        {/* Sub-results */}
        {(step.z0 || step.z1 || step.z2) && (
          <div className="mb-6 p-3 bg-muted/50 border border-border rounded">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              部分積
            </div>
            {step.z0 && (
              <div className="text-xs font-mono mb-1">
                z0 = [{step.z0.join(", ")}]
              </div>
            )}
            {step.z1 && (
              <div className="text-xs font-mono mb-1">
                z1 = [{step.z1.join(", ")}]
              </div>
            )}
            {step.z2 && (
              <div className="text-xs font-mono">
                z2 = [{step.z2.join(", ")}]
              </div>
            )}
          </div>
        )}

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
            <span>現在処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>下位部分</span>
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
