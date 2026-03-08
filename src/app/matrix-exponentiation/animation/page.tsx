"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "check_bit"
  | "multiply_result"
  | "square_base"
  | "done";

interface Step {
  type: StepType;
  bit: number;
  exponent: number;
  binaryExp: string;
  currentBit: number;
  result: number[][];
  base: number[][];
  description: string;
}

// --- Matrix multiplication ---

function matMul(A: number[][], B: number[][]): number[][] {
  const n = A.length;
  const C: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return C;
}

function identityMatrix(n: number): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

// --- Algorithm step generation ---

function generateSteps(M: number[][], exp: number): Step[] {
  const n = M.length;
  const steps: Step[] = [];
  const binaryExp = exp.toString(2);

  let result = identityMatrix(n);
  let base = M.map((r) => [...r]);

  steps.push({
    type: "init",
    bit: -1,
    exponent: exp,
    binaryExp,
    currentBit: -1,
    result: result.map((r) => [...r]),
    base: base.map((r) => [...r]),
    description: `A^${exp} を計算。${exp} の二進表現: ${binaryExp}。結果を単位行列で初期化`,
  });

  for (let i = binaryExp.length - 1; i >= 0; i--) {
    const bitVal = binaryExp[i];
    const bitPos = binaryExp.length - 1 - i;

    steps.push({
      type: "check_bit",
      bit: bitPos,
      exponent: exp,
      binaryExp,
      currentBit: parseInt(bitVal),
      result: result.map((r) => [...r]),
      base: base.map((r) => [...r]),
      description: `ビット ${bitPos} (2^${bitPos} の位) を確認: ${bitVal}`,
    });

    if (bitVal === "1") {
      result = matMul(result, base);
      steps.push({
        type: "multiply_result",
        bit: bitPos,
        exponent: exp,
        binaryExp,
        currentBit: 1,
        result: result.map((r) => [...r]),
        base: base.map((r) => [...r]),
        description: `ビットが 1 なので result = result x base を計算`,
      });
    }

    if (i > 0) {
      base = matMul(base, base);
      steps.push({
        type: "square_base",
        bit: bitPos,
        exponent: exp,
        binaryExp,
        currentBit: parseInt(bitVal),
        result: result.map((r) => [...r]),
        base: base.map((r) => [...r]),
        description: `base = base x base (二乗) を計算。base は A^${Math.pow(2, bitPos + 1)} になった`,
      });
    }
  }

  steps.push({
    type: "done",
    bit: -1,
    exponent: exp,
    binaryExp,
    currentBit: -1,
    result: result.map((r) => [...r]),
    base: base.map((r) => [...r]),
    description: `A^${exp} の計算完了`,
  });

  return steps;
}

// --- Parse ---

function parseMatrix(s: string): number[][] | null {
  try {
    const rows = s
      .trim()
      .split(";")
      .map((row) =>
        row
          .trim()
          .split(/[\s,]+/)
          .map(Number)
      );
    if (rows.some((row) => row.some(isNaN))) return null;
    if (rows.length === 0) return null;
    const n = rows.length;
    if (rows.some((row) => row.length !== n)) return null;
    return rows;
  } catch {
    return null;
  }
}

// --- Cell styling ---

function getCellClass(highlight: boolean, done: boolean): string {
  const base =
    "w-14 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
  if (done) return `${base} bg-emerald-100 border-emerald-500`;
  if (highlight) return `${base} bg-blue-100 border-blue-400`;
  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function MatrixExponentiationAnimationPage() {
  const defaultM = "1 1; 1 0";
  const defaultExp = "6";
  const [inputM, setInputM] = useState(defaultM);
  const [inputExp, setInputExp] = useState(defaultExp);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((sM: string, sE: string) => {
    const M = parseMatrix(sM);
    const e = parseInt(sE);
    if (!M || isNaN(e) || e < 0) return;
    setSteps(generateSteps(M, e));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(defaultM, defaultExp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-advance
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

  // Keyboard shortcuts
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
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">行列累乗</h1>
        <p className="text-sm text-muted-foreground mb-6">
          繰り返し二乗法による行列のべき乗の高速計算
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <div>
            <label className="text-xs text-muted-foreground">正方行列 A (行はセミコロン区切り)</label>
            <Input
              value={inputM}
              onChange={(e) => setInputM(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") run(inputM, inputExp);
              }}
              placeholder="1 1; 1 0"
              className="font-mono max-w-xs"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">指数 n</label>
            <Input
              value={inputExp}
              onChange={(e) => setInputExp(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") run(inputM, inputExp);
              }}
              placeholder="6"
              className="font-mono max-w-[100px]"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => run(inputM, inputExp)} variant="outline">
              実行
            </Button>
          </div>
        </div>

        {/* Binary representation */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            指数 {step.exponent} の二進表現
          </div>
          <div className="flex gap-1">
            {step.binaryExp.split("").map((bit, idx) => {
              const bitPos = step.binaryExp.length - 1 - idx;
              const isActive = step.bit === bitPos && step.type !== "init" && step.type !== "done";
              const base =
                "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              const cls = isActive
                ? `${base} bg-amber-50 border-amber-400 font-bold`
                : `${base} bg-white border-gray-200`;
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{bit}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    2^{bitPos}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Matrices */}
        <div className="flex flex-wrap gap-8 mb-6 items-start">
          {/* Result */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              result
            </div>
            <div className="flex flex-col gap-1">
              {step.result.map((row, r) => (
                <div key={r} className="flex gap-1">
                  {row.map((val, c) => (
                    <div
                      key={c}
                      className={getCellClass(
                        step.type === "multiply_result",
                        step.type === "done"
                      )}
                    >
                      {val}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Base */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              base
            </div>
            <div className="flex flex-col gap-1">
              {step.base.map((row, r) => (
                <div key={r} className="flex gap-1">
                  {row.map((val, c) => (
                    <div
                      key={c}
                      className={getCellClass(
                        step.type === "square_base",
                        false
                      )}
                    >
                      {val}
                    </div>
                  ))}
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
            <span>更新された行列</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>処理中のビット</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>計算完了</span>
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
              setCurrentStep((prev) =>
                Math.min(steps.length - 1, prev + 1)
              );
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
