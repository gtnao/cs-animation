"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "select_pivot"
  | "swap_rows"
  | "xor_eliminate"
  | "no_pivot"
  | "done";

interface Step {
  type: StepType;
  pivotRow: number;
  pivotCol: number;
  targetRow: number;
  matrix: number[][];
  rank: number;
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(mat: number[][]): Step[] {
  const n = mat.length;
  const m = mat[0].length;
  const steps: Step[] = [];
  const M = mat.map((r) => [...r]);

  steps.push({
    type: "init",
    pivotRow: -1,
    pivotCol: -1,
    targetRow: -1,
    matrix: M.map((r) => [...r]),
    rank: 0,
    description: `${n} x ${m} のビット行列 (GF(2) 上) に対してガウスの消去法を実行`,
  });

  let pivotRow = 0;
  let rank = 0;

  for (let col = 0; col < m && pivotRow < n; col++) {
    // Find pivot in this column
    let found = -1;
    for (let row = pivotRow; row < n; row++) {
      if (M[row][col] === 1) {
        found = row;
        break;
      }
    }

    if (found === -1) {
      steps.push({
        type: "no_pivot",
        pivotRow: pivotRow,
        pivotCol: col,
        targetRow: -1,
        matrix: M.map((r) => [...r]),
        rank,
        description: `列 ${col}: ピボットが見つからない (全て 0)。スキップ`,
      });
      continue;
    }

    steps.push({
      type: "select_pivot",
      pivotRow: found,
      pivotCol: col,
      targetRow: -1,
      matrix: M.map((r) => [...r]),
      rank,
      description: `列 ${col}: 行 ${found} をピボットに選択`,
    });

    if (found !== pivotRow) {
      [M[pivotRow], M[found]] = [M[found], M[pivotRow]];
      steps.push({
        type: "swap_rows",
        pivotRow: pivotRow,
        pivotCol: col,
        targetRow: found,
        matrix: M.map((r) => [...r]),
        rank,
        description: `行 ${pivotRow} と行 ${found} を交換`,
      });
    }

    // XOR eliminate all other rows
    for (let row = 0; row < n; row++) {
      if (row === pivotRow || M[row][col] === 0) continue;
      for (let j = 0; j < m; j++) {
        M[row][j] ^= M[pivotRow][j];
      }
      steps.push({
        type: "xor_eliminate",
        pivotRow: pivotRow,
        pivotCol: col,
        targetRow: row,
        matrix: M.map((r) => [...r]),
        rank,
        description: `行 ${row} XOR 行 ${pivotRow} で列 ${col} を消去`,
      });
    }

    rank++;
    pivotRow++;
  }

  steps.push({
    type: "done",
    pivotRow: -1,
    pivotCol: -1,
    targetRow: -1,
    matrix: M.map((r) => [...r]),
    rank,
    description: `完了。階数 (rank) = ${rank}`,
  });

  return steps;
}

// --- Parse ---

function parseBitMatrix(s: string): number[][] | null {
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
    if (rows.some((row) => row.some((v) => v !== 0 && v !== 1))) return null;
    if (rows.length === 0) return null;
    const cols = rows[0].length;
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
    "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (step.type === "xor_eliminate" && r === step.targetRow) {
    return `${base} bg-red-100 border-red-500`;
  }
  if (step.type === "select_pivot" && r === step.pivotRow && c === step.pivotCol) {
    return `${base} bg-amber-50 border-amber-400 font-bold`;
  }
  if (step.type === "swap_rows" && (r === step.pivotRow || r === step.targetRow)) {
    return `${base} bg-amber-50 border-amber-400`;
  }
  if (
    (step.type === "xor_eliminate" || step.type === "select_pivot") &&
    r === step.pivotRow
  ) {
    return `${base} bg-blue-100 border-blue-400`;
  }
  if (step.type === "done") {
    return `${base} bg-emerald-100 border-emerald-500`;
  }
  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function GaussianEliminationMod2AnimationPage() {
  const defaultInput = "1 0 1 1; 0 1 1 0; 1 1 0 1";
  const [input, setInput] = useState(defaultInput);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const mat = parseBitMatrix(s);
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

  return (
    <>
{/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <label className="text-xs text-muted-foreground">
              ビット行列 (0/1、行はセミコロン区切り)
            </label>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") run(input);
              }}
              placeholder="1 0 1 1; 0 1 1 0; 1 1 0 1"
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
            ビット行列 (GF(2))
          </div>
          <div className="flex flex-col gap-1">
            {step.matrix.map((row, r) => (
              <div key={r} className="flex gap-1">
                {row.map((val, c) => (
                  <div key={c} className={getCellClass(r, c, step)}>
                    {val}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Rank */}
        <div className="mb-3">
          <span className="text-sm text-muted-foreground">
            Rank: <span className="font-mono font-semibold text-foreground">{step.rank}</span>
          </span>
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
            <span>ピボット行</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>ピボット選択/交換</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>XOR消去対象</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>完了</span>
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
