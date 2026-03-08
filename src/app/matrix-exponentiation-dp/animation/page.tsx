"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type Matrix = number[][];

type StepType =
  | "init"
  | "show_recurrence"
  | "build_matrix"
  | "binary_step"
  | "multiply"
  | "result"
  | "done";

interface Step {
  type: StepType;
  n: number;
  currentMatrix: Matrix;
  resultVector: number[];
  bitPos: number;
  description: string;
}

// --- Matrix operations ---

function matMul(a: Matrix, b: Matrix, mod: number): Matrix {
  const n = a.length;
  const result: Matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        result[i][j] = (result[i][j] + a[i][k] * b[k][j]) % mod;
      }
    }
  }
  return result;
}

function matVecMul(a: Matrix, v: number[], mod: number): number[] {
  const n = a.length;
  const result = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      result[i] = (result[i] + a[i][j] * v[j]) % mod;
    }
  }
  return result;
}

function identityMatrix(n: number): Matrix {
  const m: Matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) m[i][i] = 1;
  return m;
}

// --- Generate steps for Fibonacci-like recurrence via matrix exponentiation ---
// F(n) = F(n-1) + F(n-2), F(0)=0, F(1)=1
// Matrix: [[1,1],[1,0]]^n * [F(1), F(0)]^T = [F(n+1), F(n)]^T

function generateSteps(targetN: number): Step[] {
  const MOD = 1000000007;
  const steps: Step[] = [];

  const baseMatrix: Matrix = [
    [1, 1],
    [1, 0],
  ];
  const baseVector = [1, 0]; // [F(1), F(0)]

  steps.push({
    type: "init",
    n: targetN,
    currentMatrix: baseMatrix,
    resultVector: baseVector,
    bitPos: -1,
    description: `F(${targetN}) を行列累乗で求める。F(n)=F(n-1)+F(n-2), F(0)=0, F(1)=1`,
  });

  steps.push({
    type: "show_recurrence",
    n: targetN,
    currentMatrix: baseMatrix,
    resultVector: baseVector,
    bitPos: -1,
    description: `遷移行列 A = [[1,1],[1,0]]。A^n * [F(1),F(0)]^T = [F(n+1),F(n)]^T`,
  });

  steps.push({
    type: "build_matrix",
    n: targetN,
    currentMatrix: baseMatrix,
    resultVector: baseVector,
    bitPos: -1,
    description: `A^${targetN} を繰り返し二乗法で計算。${targetN} の2進表現を下位ビットから処理`,
  });

  // Fast exponentiation
  let result = identityMatrix(2);
  let base = baseMatrix.map((row) => [...row]);
  let remaining = targetN;
  let bitIndex = 0;

  while (remaining > 0) {
    const bit = remaining & 1;

    steps.push({
      type: "binary_step",
      n: targetN,
      currentMatrix: base.map((row) => [...row]),
      resultVector: [...baseVector],
      bitPos: bitIndex,
      description: `ビット${bitIndex}: ${targetN}の2進第${bitIndex}ビット = ${bit}${bit ? " → result に掛ける" : " → スキップ"}`,
    });

    if (bit) {
      result = matMul(result, base, MOD);
      steps.push({
        type: "multiply",
        n: targetN,
        currentMatrix: base.map((row) => [...row]),
        resultVector: matVecMul(result, baseVector, MOD),
        bitPos: bitIndex,
        description: `result = result * A^(2^${bitIndex})。中間結果: [${matVecMul(result, baseVector, MOD).join(", ")}]`,
      });
    }

    base = matMul(base, base, MOD);
    remaining >>= 1;
    bitIndex++;
  }

  const finalVec = matVecMul(result, baseVector, MOD);

  steps.push({
    type: "result",
    n: targetN,
    currentMatrix: result.map((row) => [...row]),
    resultVector: finalVec,
    bitPos: -1,
    description: `A^${targetN} * [1, 0]^T = [${finalVec.join(", ")}]。F(${targetN}) = ${finalVec[1]}`,
  });

  steps.push({
    type: "done",
    n: targetN,
    currentMatrix: result.map((row) => [...row]),
    resultVector: finalVec,
    bitPos: -1,
    description: `完了。F(${targetN}) = ${finalVec[1]} (mod 10^9+7)`,
  });

  return steps;
}

// --- Component ---

export default function MatrixExponentiationDPAnimationPage() {
  const [input, setInput] = useState("10");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((val: number) => {
    if (val < 0 || val > 1000000) return;
    setSteps(generateSteps(val));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const handleRun = useCallback(() => {
    const val = parseInt(input.trim());
    if (!isNaN(val)) run(val);
  }, [input, run]);

  useEffect(() => {
    run(10);
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

  // Binary representation
  const binary = step.n.toString(2);

  return (
    <>
{/* Input */}
        <div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRun();
            }}
            placeholder="n (F(n) を求める)"
            className="font-mono w-40"
          />
          <Button onClick={handleRun} variant="outline">
            実行
          </Button>
        </div>

        {/* Binary representation */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            n = {step.n} の2進表現
          </div>
          <div className="flex gap-1">
            {binary.split("").map((bit, idx) => {
              const bitPosition = binary.length - 1 - idx;
              let cls =
                "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              if (step.bitPos === bitPosition) {
                cls += " bg-blue-100 border-blue-400 font-bold";
              } else {
                cls += " bg-white border-gray-200";
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{bit}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    2^{bitPosition}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Matrix display */}
        <div className="mb-6 flex gap-8 flex-wrap">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              現在の行列 (A^(2^k))
            </div>
            <div className="inline-grid grid-cols-2 gap-1">
              {step.currentMatrix.flat().map((val, idx) => (
                <div
                  key={idx}
                  className="w-20 h-10 flex items-center justify-center border-2 bg-white border-gray-200 text-xs font-mono"
                >
                  {val}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              結果ベクトル [F(n+1), F(n)]
            </div>
            <div className="flex flex-col gap-1">
              {step.resultVector.map((val, idx) => (
                <div
                  key={idx}
                  className={`w-20 h-10 flex items-center justify-center border-2 text-xs font-mono ${
                    step.type === "result" || step.type === "done"
                      ? idx === 1
                        ? "bg-emerald-100 border-emerald-500 font-bold"
                        : "bg-white border-gray-300"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {val}
                </div>
              ))}
            </div>
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
            <span>処理中のビット</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>最終結果</span>
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
