"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "select_pivot"
  | "swap_rows"
  | "scale_pivot"
  | "eliminate"
  | "forward_done"
  | "back_substitute"
  | "done";

interface Step {
  type: StepType;
  pivotRow: number;
  pivotCol: number;
  targetRow: number;
  matrix: number[][];
  solution: number[];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(augmented: number[][]): Step[] {
  const n = augmented.length;
  const m = augmented[0].length;
  const steps: Step[] = [];
  const mat = augmented.map((r) => [...r]);
  const solution: number[] = new Array(n).fill(0);

  steps.push({
    type: "init",
    pivotRow: -1,
    pivotCol: -1,
    targetRow: -1,
    matrix: mat.map((r) => [...r]),
    solution: [...solution],
    description: `${n} x ${m - 1} の拡大係数行列に対してガウスの消去法を実行`,
  });

  // Forward elimination
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    let maxVal = Math.abs(mat[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(mat[row][col]) > maxVal) {
        maxVal = Math.abs(mat[row][col]);
        maxRow = row;
      }
    }

    steps.push({
      type: "select_pivot",
      pivotRow: maxRow,
      pivotCol: col,
      targetRow: -1,
      matrix: mat.map((r) => [...r]),
      solution: [...solution],
      description: `列 ${col} のピボットを選択: 行 ${maxRow} (値 = ${mat[maxRow][col].toFixed(2)})`,
    });

    if (maxRow !== col) {
      [mat[col], mat[maxRow]] = [mat[maxRow], mat[col]];
      steps.push({
        type: "swap_rows",
        pivotRow: col,
        pivotCol: col,
        targetRow: maxRow,
        matrix: mat.map((r) => [...r]),
        solution: [...solution],
        description: `行 ${col} と行 ${maxRow} を交換`,
      });
    }

    if (Math.abs(mat[col][col]) < 1e-10) continue;

    const pivotVal = mat[col][col];
    for (let j = col; j < m; j++) {
      mat[col][j] /= pivotVal;
    }
    steps.push({
      type: "scale_pivot",
      pivotRow: col,
      pivotCol: col,
      targetRow: -1,
      matrix: mat.map((r) => [...r]),
      solution: [...solution],
      description: `行 ${col} を ${pivotVal.toFixed(2)} で割ってピボットを 1 にする`,
    });

    for (let row = col + 1; row < n; row++) {
      if (Math.abs(mat[row][col]) < 1e-10) continue;
      const factor = mat[row][col];
      for (let j = col; j < m; j++) {
        mat[row][j] -= factor * mat[col][j];
      }
      steps.push({
        type: "eliminate",
        pivotRow: col,
        pivotCol: col,
        targetRow: row,
        matrix: mat.map((r) => [...r]),
        solution: [...solution],
        description: `行 ${row} から行 ${col} の ${factor.toFixed(2)} 倍を引いて列 ${col} を消去`,
      });
    }
  }

  steps.push({
    type: "forward_done",
    pivotRow: -1,
    pivotCol: -1,
    targetRow: -1,
    matrix: mat.map((r) => [...r]),
    solution: [...solution],
    description: "前進消去完了。上三角行列が得られた。後退代入を開始",
  });

  // Back substitution
  for (let i = n - 1; i >= 0; i--) {
    solution[i] = mat[i][m - 1];
    for (let j = i + 1; j < n; j++) {
      solution[i] -= mat[i][j] * solution[j];
    }
    steps.push({
      type: "back_substitute",
      pivotRow: i,
      pivotCol: i,
      targetRow: -1,
      matrix: mat.map((r) => [...r]),
      solution: [...solution],
      description: `x${i} = ${solution[i].toFixed(4)}`,
    });
  }

  steps.push({
    type: "done",
    pivotRow: -1,
    pivotCol: -1,
    targetRow: -1,
    matrix: mat.map((r) => [...r]),
    solution: [...solution],
    description: `解: [${solution.map((v) => v.toFixed(4)).join(", ")}]`,
  });

  return steps;
}

// --- Parse augmented matrix ---

function parseAugmented(s: string): number[][] | null {
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
    if (cols !== rows.length + 1) return null;
    if (rows.some((row) => row.length !== cols)) return null;
    return rows;
  } catch {
    return null;
  }
}

// --- Cell styling ---

function getCellClass(
  r: number,
  c: number,
  step: Step
): string {
  const base =
    "w-16 h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors";

  if (step.type === "eliminate" && r === step.targetRow) {
    return `${base} bg-red-100 border-red-500`;
  }
  if (step.type === "select_pivot" && r === step.pivotRow && c === step.pivotCol) {
    return `${base} bg-amber-50 border-amber-400 font-bold`;
  }
  if (step.type === "swap_rows" && (r === step.pivotRow || r === step.targetRow)) {
    return `${base} bg-amber-50 border-amber-400`;
  }
  if (step.type === "scale_pivot" && r === step.pivotRow) {
    return `${base} bg-blue-100 border-blue-400`;
  }
  if (step.type === "back_substitute" && r === step.pivotRow) {
    return `${base} bg-emerald-100 border-emerald-500`;
  }
  if (step.type === "eliminate" && r === step.pivotRow) {
    return `${base} bg-blue-100 border-blue-400`;
  }
  if (step.type === "done") {
    return `${base} bg-emerald-100 border-emerald-500`;
  }
  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function GaussianEliminationAnimationPage() {
  const defaultInput = "2 1 -1 8; -3 -1 2 -11; -2 1 2 -3";
  const [input, setInput] = useState(defaultInput);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const mat = parseAugmented(s);
    if (!mat) return;
    setSteps(generateSteps(mat));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(defaultInput);
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
    }, 700);
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

  const n = step.matrix.length;
  const m = step.matrix[0].length;

  return (
    <>
{/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <label className="text-xs text-muted-foreground">
              拡大係数行列 (行はセミコロン区切り、例: 2 1 -1 8; -3 -1 2 -11; -2 1 2 -3)
            </label>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") run(input);
              }}
              placeholder="2 1 -1 8; -3 -1 2 -11; -2 1 2 -3"
              className="font-mono"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => run(input)} variant="outline">
              実行
            </Button>
          </div>
        </div>

        {/* Matrix */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            拡大係数行列 [A | b]
          </div>
          <div className="overflow-x-auto">
            <div className="flex flex-col gap-1">
              {step.matrix.map((row, r) => (
                <div key={r} className="flex gap-1 items-center">
                  {row.map((val, c) => (
                    <div key={c} className="flex items-center">
                      {c === m - 1 && (
                        <div className="w-2 border-l-2 border-gray-400 h-10 mr-1" />
                      )}
                      <div className={getCellClass(r, c, step)}>
                        {val.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Solution */}
        {step.solution.some((v) => v !== 0) && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              解ベクトル
            </div>
            <div className="flex gap-2">
              {step.solution.map((val, i) => {
                const solved =
                  step.type === "done" ||
                  (step.type === "back_substitute" && i >= step.pivotRow);
                const active =
                  step.type === "back_substitute" && i === step.pivotRow;
                const base =
                  "px-3 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
                const cls = active
                  ? `${base} bg-emerald-100 border-emerald-500 font-bold`
                  : solved
                  ? `${base} bg-emerald-100 border-emerald-500`
                  : `${base} bg-gray-50 border-gray-200 text-muted-foreground`;
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={cls}>
                      {solved ? val.toFixed(4) : "?"}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      x{i}
                    </div>
                  </div>
                );
              })}
            </div>
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
            <span>ピボット行</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>ピボット選択/交換</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>消去対象行</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>確定</span>
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
    </>
  );
}
