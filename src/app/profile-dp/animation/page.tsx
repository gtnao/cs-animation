"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "process_column"
  | "transition"
  | "update_profile"
  | "done";

interface Step {
  type: StepType;
  col: number;
  profile: number;
  nextProfile: number;
  dpCurrent: Map<number, number>;
  rows: number;
  cols: number;
  grid: boolean[][];
  description: string;
  highlightCells?: [number, number][];
}

// --- Algorithm: Count ways to tile an MxN grid with 1x2 dominoes ---
// Profile DP on columns. Profile is a bitmask of M bits.

function profileToString(profile: number, rows: number): string {
  return profile.toString(2).padStart(rows, "0");
}

function generateSteps(rows: number, cols: number): Step[] {
  const steps: Step[] = [];

  // dp[profile] = number of ways to fill columns 0..col-1 such that
  // the "broken profile" at column col is given by profile
  // bit i = 1 means cell (i, col) is already filled by a horizontal domino from col-1

  let dp = new Map<number, number>();
  dp.set(0, 1); // initially no cells are pre-filled

  const grid: boolean[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(false)
  );

  steps.push({
    type: "init",
    col: 0,
    profile: 0,
    nextProfile: 0,
    dpCurrent: new Map(dp),
    rows,
    cols,
    grid: grid.map((r) => [...r]),
    description: `${rows}x${cols} グリッドを 1x2 ドミノでタイリングする方法の数を数える。列ごとにプロファイル (ビットマスク) で状態管理`,
  });

  for (let col = 0; col < cols; col++) {
    const newDp = new Map<number, number>();

    steps.push({
      type: "process_column",
      col,
      profile: 0,
      nextProfile: 0,
      dpCurrent: new Map(dp),
      rows,
      cols,
      grid: grid.map((r) => [...r]),
      description: `列${col}を処理。現在 ${dp.size} 個のプロファイル状態`,
    });

    // For each current profile, try all valid placements in this column
    for (const [profile, ways] of dp.entries()) {
      // Enumerate all valid next profiles by trying to fill column col
      // Given the incoming profile, fill cells top-to-bottom
      const fillColumn = (
        row: number,
        inProfile: number,
        outProfile: number
      ) => {
        if (row === rows) {
          // Complete column filled
          const prev = newDp.get(outProfile) || 0;
          newDp.set(outProfile, prev + ways);
          return;
        }

        // Check if cell (row, col) is already filled (bit set in inProfile)
        if ((inProfile >> row) & 1) {
          // Already filled by horizontal domino from previous column
          fillColumn(row + 1, inProfile, outProfile);
          return;
        }

        // Option 1: Place horizontal domino (row, col)-(row, col+1)
        if (col + 1 < cols) {
          fillColumn(row + 1, inProfile, outProfile | (1 << row));
        }

        // Option 2: Place vertical domino (row, col)-(row+1, col)
        if (row + 1 < rows && !((inProfile >> (row + 1)) & 1)) {
          fillColumn(row + 2, inProfile, outProfile);
        }

        // Option 3: leave empty? Not valid for full tiling. Actually we must fill all cells.
        // But we need to allow it and check at end... Let me simplify:
        // Actually for domino tiling, every cell must be covered.
        // With profile DP, we process cell by cell and must place a domino covering each uncovered cell.
      };

      fillColumn(0, profile, 0);
    }

    if (newDp.size > 0) {
      steps.push({
        type: "update_profile",
        col,
        profile: 0,
        nextProfile: 0,
        dpCurrent: new Map(newDp),
        rows,
        cols,
        grid: grid.map((r) => [...r]),
        description: `列${col}処理完了。次の列に ${newDp.size} 個のプロファイル状態を渡す`,
      });
    }

    dp = newDp;
  }

  // Answer is dp[0] (no cells protruding beyond the last column)
  const answer = dp.get(0) || 0;

  steps.push({
    type: "done",
    col: cols,
    profile: 0,
    nextProfile: 0,
    dpCurrent: new Map(dp),
    rows,
    cols,
    grid: grid.map((r) => [...r]),
    description: `完了。${rows}x${cols} グリッドのドミノタイリング数 = ${answer}`,
  });

  return steps;
}

// --- Component ---

export default function ProfileDPAnimationPage() {
  const [rowsInput, setRowsInput] = useState("3");
  const [colsInput, setColsInput] = useState("4");
  const [gridSize, setGridSize] = useState({ rows: 3, cols: 4 });
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((r: number, c: number) => {
    if (r <= 0 || r > 8 || c <= 0 || c > 8) return;
    setGridSize({ rows: r, cols: c });
    setSteps(generateSteps(r, c));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const handleRun = useCallback(() => {
    const r = parseInt(rowsInput);
    const c = parseInt(colsInput);
    if (!isNaN(r) && !isNaN(c)) run(r, c);
  }, [rowsInput, colsInput, run]);

  useEffect(() => {
    run(3, 4);
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

  // Get sorted profiles for display
  const profiles = Array.from(step.dpCurrent.entries()).sort(
    (a, b) => a[0] - b[0]
  );

  return (
    <>
{/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input
            value={rowsInput}
            onChange={(e) => setRowsInput(e.target.value)}
            placeholder="行数"
            className="font-mono w-20"
          />
          <Input
            value={colsInput}
            onChange={(e) => setColsInput(e.target.value)}
            placeholder="列数"
            className="font-mono w-20"
          />
          <Button onClick={handleRun} variant="outline">
            実行
          </Button>
        </div>

        {/* Grid display */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {gridSize.rows} x {gridSize.cols} グリッド
          </div>
          <div className="inline-grid gap-1" style={{
            gridTemplateColumns: `repeat(${gridSize.cols}, 2.5rem)`,
          }}>
            {Array.from({ length: gridSize.rows * gridSize.cols }, (_, idx) => {
              const r = Math.floor(idx / gridSize.cols);
              const c = idx % gridSize.cols;
              let cls =
                "w-10 h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors";
              if (step.col === c) {
                cls += " bg-blue-100 border-blue-400";
              } else if (c < step.col) {
                cls += " bg-emerald-100 border-emerald-500";
              } else {
                cls += " bg-white border-gray-200";
              }
              return (
                <div key={idx} className={cls}>
                  {r},{c}
                </div>
              );
            })}
          </div>
        </div>

        {/* Profile states */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            プロファイル状態 (ビットマスク → 方法数)
          </div>
          <div className="flex flex-wrap gap-2">
            {profiles.length === 0 ? (
              <div className="text-xs text-muted-foreground">(なし)</div>
            ) : (
              profiles.slice(0, 20).map(([prof, ways]) => (
                <div
                  key={prof}
                  className="px-3 py-2 border-2 rounded text-xs font-mono bg-white border-gray-200"
                >
                  <div className="text-muted-foreground">
                    {profileToString(prof, gridSize.rows)}
                  </div>
                  <div className="font-bold">{ways}</div>
                </div>
              ))
            )}
            {profiles.length > 20 && (
              <div className="text-xs text-muted-foreground self-center">
                ... 他 {profiles.length - 20} 状態
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.col < gridSize.cols && (
            <span>
              処理中の列:{" "}
              <span className="font-mono font-semibold text-foreground">
                {step.col}
              </span>
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
            <span>処理中の列</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>処理済みの列</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200" />
            <span>未処理の列</span>
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
