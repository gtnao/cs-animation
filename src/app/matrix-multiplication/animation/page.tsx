"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "select_cell"
  | "multiply_add"
  | "cell_done"
  | "done";

interface Step {
  type: StepType;
  row: number;
  col: number;
  k: number;
  A: number[][];
  B: number[][];
  C: number[][];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(A: number[][], B: number[][]): Step[] {
  const n = A.length;
  const m = B[0].length;
  const p = B.length;
  const steps: Step[] = [];
  const C: number[][] = Array.from({ length: n }, () => new Array(m).fill(0));

  steps.push({
    type: "init",
    row: -1,
    col: -1,
    k: -1,
    A: A.map((r) => [...r]),
    B: B.map((r) => [...r]),
    C: C.map((r) => [...r]),
    description: `${n}x${p} 行列 A と ${p}x${m} 行列 B の積を計算。結果は ${n}x${m} 行列`,
  });

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      steps.push({
        type: "select_cell",
        row: i,
        col: j,
        k: -1,
        A: A.map((r) => [...r]),
        B: B.map((r) => [...r]),
        C: C.map((r) => [...r]),
        description: `C[${i}][${j}] を計算開始。A の第 ${i} 行と B の第 ${j} 列の内積`,
      });

      for (let k = 0; k < p; k++) {
        C[i][j] += A[i][k] * B[k][j];
        steps.push({
          type: "multiply_add",
          row: i,
          col: j,
          k,
          A: A.map((r) => [...r]),
          B: B.map((r) => [...r]),
          C: C.map((r) => [...r]),
          description: `A[${i}][${k}] x B[${k}][${j}] = ${A[i][k]} x ${B[k][j]} = ${A[i][k] * B[k][j]} を加算。C[${i}][${j}] = ${C[i][j]}`,
        });
      }

      steps.push({
        type: "cell_done",
        row: i,
        col: j,
        k: p,
        A: A.map((r) => [...r]),
        B: B.map((r) => [...r]),
        C: C.map((r) => [...r]),
        description: `C[${i}][${j}] = ${C[i][j]} 確定`,
      });
    }
  }

  steps.push({
    type: "done",
    row: -1,
    col: -1,
    k: -1,
    A: A.map((r) => [...r]),
    B: B.map((r) => [...r]),
    C: C.map((r) => [...r]),
    description: "行列積の計算完了",
  });

  return steps;
}

// --- Parse matrix string ---

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
    const cols = rows[0].length;
    if (rows.some((row) => row.length !== cols)) return null;
    return rows;
  } catch {
    return null;
  }
}

// --- Cell styling ---

function getACellClass(
  r: number,
  c: number,
  step: Step
): string {
  const base =
    "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (step.type === "multiply_add" && r === step.row && c === step.k) {
    return `${base} bg-emerald-100 border-emerald-500 font-bold`;
  }
  if (
    (step.type === "select_cell" || step.type === "multiply_add" || step.type === "cell_done") &&
    r === step.row
  ) {
    return `${base} bg-blue-100 border-blue-400`;
  }
  return `${base} bg-white border-gray-200`;
}

function getBCellClass(
  r: number,
  c: number,
  step: Step
): string {
  const base =
    "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (step.type === "multiply_add" && r === step.k && c === step.col) {
    return `${base} bg-emerald-100 border-emerald-500 font-bold`;
  }
  if (
    (step.type === "select_cell" || step.type === "multiply_add" || step.type === "cell_done") &&
    c === step.col
  ) {
    return `${base} bg-blue-100 border-blue-400`;
  }
  return `${base} bg-white border-gray-200`;
}

function getCCellClass(
  r: number,
  c: number,
  step: Step,
  completed: boolean
): string {
  const base =
    "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (r === step.row && c === step.col) {
    if (step.type === "cell_done") {
      return `${base} bg-emerald-100 border-emerald-500 font-bold`;
    }
    return `${base} bg-amber-50 border-amber-400 font-bold`;
  }
  if (completed) {
    return `${base} bg-emerald-100 border-emerald-500`;
  }
  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function MatrixMultiplicationAnimationPage() {
  const defaultA = "1 2; 3 4";
  const defaultB = "5 6; 7 8";
  const [inputA, setInputA] = useState(defaultA);
  const [inputB, setInputB] = useState(defaultB);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((sA: string, sB: string) => {
    const A = parseMatrix(sA);
    const B = parseMatrix(sB);
    if (!A || !B) return;
    if (A[0].length !== B.length) return;
    setSteps(generateSteps(A, B));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(defaultA, defaultB);
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
    }, 600);
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

  // Determine which C cells are completed
  const isCellCompleted = (r: number, c: number): boolean => {
    if (step.type === "done") return true;
    if (step.row < 0) return false;
    const m = step.C[0].length;
    const currentIdx = step.row * m + step.col;
    const cellIdx = r * m + c;
    if (step.type === "cell_done") return cellIdx <= currentIdx;
    return cellIdx < currentIdx;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">行列積</h1>
        <p className="text-sm text-muted-foreground mb-6">
          2つの行列の積を計算するアルゴリズム
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <div>
            <label className="text-xs text-muted-foreground">行列 A (行はセミコロン区切り)</label>
            <Input
              value={inputA}
              onChange={(e) => setInputA(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") run(inputA, inputB);
              }}
              placeholder="1 2; 3 4"
              className="font-mono max-w-xs"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">行列 B (行はセミコロン区切り)</label>
            <Input
              value={inputB}
              onChange={(e) => setInputB(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") run(inputA, inputB);
              }}
              placeholder="5 6; 7 8"
              className="font-mono max-w-xs"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => run(inputA, inputB)} variant="outline">
              実行
            </Button>
          </div>
        </div>

        {/* Matrices */}
        <div className="flex flex-wrap gap-8 mb-6 items-start">
          {/* Matrix A */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              行列 A
            </div>
            <div className="flex flex-col gap-1">
              {step.A.map((row, r) => (
                <div key={r} className="flex gap-1">
                  {row.map((val, c) => (
                    <div key={c} className={getACellClass(r, c, step)}>
                      {val}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center text-2xl text-muted-foreground pt-6">
            x
          </div>

          {/* Matrix B */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              行列 B
            </div>
            <div className="flex flex-col gap-1">
              {step.B.map((row, r) => (
                <div key={r} className="flex gap-1">
                  {row.map((val, c) => (
                    <div key={c} className={getBCellClass(r, c, step)}>
                      {val}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center text-2xl text-muted-foreground pt-6">
            =
          </div>

          {/* Matrix C */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              結果 C
            </div>
            <div className="flex flex-col gap-1">
              {step.C.map((row, r) => (
                <div key={r} className="flex gap-1">
                  {row.map((val, c) => (
                    <div
                      key={c}
                      className={getCCellClass(r, c, step, isCellCompleted(r, c))}
                    >
                      {isCellCompleted(r, c) ||
                      (r === step.row && c === step.col)
                        ? val
                        : ""}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.row >= 0 && step.type !== "done" && (
            <span>
              C[{step.row}][{step.col}] を計算中
            </span>
          )}
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
            <span>処理中の行/列</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>計算中のセル</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>乗算対象/確定</span>
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
