"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "process_row"
  | "reduce_column"
  | "subproblem"
  | "interpolate"
  | "set_minimum"
  | "done";

interface Step {
  type: StepType;
  row: number;
  col: number;
  matrix: number[][];
  rowMin: number[];
  rowMinCol: number[];
  activeRows: number[];
  activeCols: number[];
  description: string;
}

// --- Generate a totally monotone matrix ---

function generateTMMatrix(n: number, m: number): number[][] {
  // Create a simple totally monotone matrix
  // C[i][j] = (i - j)^2 + noise that preserves total monotonicity
  const mat: number[][] = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      mat[i][j] = (i - j) * (i - j) + i + j;
    }
  }
  return mat;
}

// --- SMAWK-like steps for visualization (LARSCH is online SMAWK) ---

function generateSteps(n: number, m: number): Step[] {
  const steps: Step[] = [];
  const matrix = generateTMMatrix(n, m);
  const rowMin = new Array(n).fill(Infinity);
  const rowMinCol = new Array(n).fill(-1);

  steps.push({
    type: "init",
    row: -1,
    col: -1,
    matrix: matrix.map((r) => [...r]),
    rowMin: [...rowMin],
    rowMinCol: [...rowMinCol],
    activeRows: Array.from({ length: n }, (_, i) => i),
    activeCols: Array.from({ length: m }, (_, i) => i),
    description: `${n}x${m} の totally monotone 行列の各行最小値を求める。LARSCH はこれをオンラインで線形時間で行う`,
  });

  // Simulate the SMAWK/LARSCH algorithm step by step
  // Phase 1: REDUCE - eliminate columns
  let activeCols = Array.from({ length: m }, (_, i) => i);
  const activeRows = Array.from({ length: n }, (_, i) => i);

  // REDUCE step: keep at most n columns
  if (m > n) {
    const newCols: number[] = [];
    for (let j = 0; j < m; j++) {
      while (newCols.length > 0 && newCols.length > 0) {
        const lastCol = newCols[newCols.length - 1];
        const row = newCols.length - 1;
        if (row < n && matrix[row][lastCol] >= matrix[row][j]) {
          steps.push({
            type: "reduce_column",
            row,
            col: lastCol,
            matrix: matrix.map((r) => [...r]),
            rowMin: [...rowMin],
            rowMinCol: [...rowMinCol],
            activeRows,
            activeCols: [...newCols],
            description: `REDUCE: 列${lastCol}を列${j}が支配 (行${row}で ${matrix[row][lastCol]} >= ${matrix[row][j]})。列${lastCol}を除去`,
          });
          newCols.pop();
        } else {
          break;
        }
      }
      if (newCols.length < n) {
        newCols.push(j);
      }
    }
    activeCols = newCols;
  }

  steps.push({
    type: "subproblem",
    row: -1,
    col: -1,
    matrix: matrix.map((r) => [...r]),
    rowMin: [...rowMin],
    rowMinCol: [...rowMinCol],
    activeRows,
    activeCols: [...activeCols],
    description: `REDUCE完了。残り列: [${activeCols.join(", ")}]。奇数行の部分問題を再帰的に解く`,
  });

  // For visualization, solve row by row showing the monotonicity
  let lastOptCol = 0;
  for (let i = 0; i < n; i++) {
    let bestVal = Infinity;
    let bestCol = lastOptCol;

    // Search from lastOptCol onwards (monotonicity of row minima)
    const searchStart = lastOptCol;
    for (let jIdx = 0; jIdx < activeCols.length; jIdx++) {
      const j = activeCols[jIdx];
      if (j < searchStart && i > 0) continue;

      steps.push({
        type: "process_row",
        row: i,
        col: j,
        matrix: matrix.map((r) => [...r]),
        rowMin: [...rowMin],
        rowMinCol: [...rowMinCol],
        activeRows,
        activeCols,
        description: `行${i}: C[${i}][${j}] = ${matrix[i][j]} を確認${matrix[i][j] < bestVal ? " (新しい最小値)" : ""}`,
      });

      if (matrix[i][j] < bestVal) {
        bestVal = matrix[i][j];
        bestCol = j;
      }
    }

    rowMin[i] = bestVal;
    rowMinCol[i] = bestCol;
    lastOptCol = bestCol;

    steps.push({
      type: "set_minimum",
      row: i,
      col: bestCol,
      matrix: matrix.map((r) => [...r]),
      rowMin: [...rowMin],
      rowMinCol: [...rowMinCol],
      activeRows,
      activeCols,
      description: `行${i}の最小値: C[${i}][${bestCol}] = ${bestVal}。最適列=${bestCol}`,
    });
  }

  steps.push({
    type: "done",
    row: -1,
    col: -1,
    matrix: matrix.map((r) => [...r]),
    rowMin: [...rowMin],
    rowMinCol: [...rowMinCol],
    activeRows,
    activeCols,
    description: `完了。各行の最小値: [${rowMin.join(", ")}]`,
  });

  return steps;
}

// --- Component ---

export default function LARSCHAnimationPage() {
  const [nInput, setNInput] = useState("5");
  const [mInput, setMInput] = useState("6");
  const [matSize, setMatSize] = useState({ n: 5, m: 6 });
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((rows: number, cols: number) => {
    if (rows <= 0 || rows > 10 || cols <= 0 || cols > 10) return;
    setMatSize({ n: rows, m: cols });
    setSteps(generateSteps(rows, cols));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const handleRun = useCallback(() => {
    const rows = parseInt(nInput);
    const cols = parseInt(mInput);
    if (!isNaN(rows) && !isNaN(cols)) run(rows, cols);
  }, [nInput, mInput, run]);

  useEffect(() => {
    run(5, 6);
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
    }, 500);
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
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">LARSCH Algorithm</h1>
        <p className="text-sm text-muted-foreground mb-6">
          totally monotone 行列の各行最小値を求めるアルゴリズム
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input
            value={nInput}
            onChange={(e) => setNInput(e.target.value)}
            placeholder="行数"
            className="font-mono w-20"
          />
          <Input
            value={mInput}
            onChange={(e) => setMInput(e.target.value)}
            placeholder="列数"
            className="font-mono w-20"
          />
          <Button onClick={handleRun} variant="outline">
            実行
          </Button>
        </div>

        {/* Matrix display */}
        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            コスト行列 C[i][j] (totally monotone)
          </div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-10 h-8 text-xs text-muted-foreground font-mono">
                  i\j
                </th>
                {Array.from({ length: matSize.m }, (_, j) => (
                  <th
                    key={j}
                    className={`w-12 h-8 text-xs font-mono text-center ${
                      step.activeCols.includes(j)
                        ? "text-foreground"
                        : "text-muted-foreground line-through"
                    }`}
                  >
                    {j}
                  </th>
                ))}
                <th className="w-14 h-8 text-xs text-muted-foreground font-mono text-center">
                  min
                </th>
              </tr>
            </thead>
            <tbody>
              {step.matrix.map((row, i) => (
                <tr key={i}>
                  <td className="w-10 h-8 text-xs text-muted-foreground font-mono text-center">
                    {i}
                  </td>
                  {row.map((val, j) => {
                    let cls =
                      "w-12 h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors";
                    if (step.row === i && step.col === j) {
                      if (step.type === "set_minimum") {
                        cls +=
                          " bg-emerald-100 border-emerald-500 font-bold";
                      } else if (step.type === "reduce_column") {
                        cls += " bg-red-100 border-red-500";
                      } else {
                        cls += " bg-blue-100 border-blue-400";
                      }
                    } else if (
                      step.rowMinCol[i] === j &&
                      step.rowMin[i] < Infinity
                    ) {
                      cls +=
                        " bg-emerald-100 border-emerald-500 font-bold";
                    } else if (
                      step.row === i &&
                      step.type === "process_row"
                    ) {
                      cls += " bg-amber-50 border-amber-400";
                    } else if (!step.activeCols.includes(j)) {
                      cls +=
                        " bg-gray-100 border-gray-200 text-muted-foreground";
                    } else {
                      cls += " bg-white border-gray-200";
                    }
                    return (
                      <td key={j}>
                        <div className={cls}>{val}</div>
                      </td>
                    );
                  })}
                  <td>
                    <div
                      className={`w-14 h-10 flex items-center justify-center border-2 text-xs font-mono ${
                        step.rowMin[i] < Infinity
                          ? "bg-emerald-100 border-emerald-500 font-bold"
                          : "bg-gray-50 border-gray-200 text-muted-foreground"
                      }`}
                    >
                      {step.rowMin[i] < Infinity ? step.rowMin[i] : "-"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <span>現在確認中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>探索行</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>行最小値</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>除去された列</span>
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
      </div>
    </div>
  );
}
