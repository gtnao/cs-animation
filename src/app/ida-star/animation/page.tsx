"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

type StepType =
  | "init"
  | "new_threshold"
  | "visit"
  | "prune"
  | "found"
  | "done";

interface Step {
  type: StepType;
  grid: number[][];
  pos: [number, number];
  goal: [number, number];
  g: number;
  h: number;
  f: number;
  threshold: number;
  iteration: number;
  path: [number, number][];
  description: string;
}

// --- Grid and heuristic ---

const GRID_ROWS = 5;
const GRID_COLS = 7;

// 0 = open, 1 = wall
const DEFAULT_GRID = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 1, 1, 0, 1],
  [0, 0, 0, 0, 0, 0, 0],
];

const START: [number, number] = [0, 0];
const GOAL: [number, number] = [4, 6];

function manhattan(a: [number, number], b: [number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

const DIRS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

// --- Algorithm step generation ---

function generateSteps(
  grid: number[][],
  start: [number, number],
  goal: [number, number]
): Step[] {
  const steps: Step[] = [];
  const rows = grid.length;
  const cols = grid[0].length;

  const h0 = manhattan(start, goal);
  let threshold = h0;

  steps.push({
    type: "init",
    grid,
    pos: start,
    goal,
    g: 0,
    h: h0,
    f: h0,
    threshold,
    iteration: 0,
    path: [start],
    description: `スタート (${start[0]},${start[1]}) → ゴール (${goal[0]},${goal[1]})。初期閾値 = h(start) = ${h0}`,
  });

  let found = false;
  const MAX_STEPS = 80;

  for (let iter = 1; iter <= 10 && !found; iter++) {
    steps.push({
      type: "new_threshold",
      grid,
      pos: start,
      goal,
      g: 0,
      h: h0,
      f: h0,
      threshold,
      iteration: iter,
      path: [start],
      description: `反復 ${iter}: 閾値 = ${threshold}`,
    });

    let nextThreshold = Infinity;
    const visited = new Set<string>();
    const path: [number, number][] = [start];

    function dfs(pos: [number, number], g: number): boolean {
      if (steps.length > MAX_STEPS) return false;

      const h = manhattan(pos, goal);
      const f = g + h;

      steps.push({
        type: "visit",
        grid,
        pos,
        goal,
        g,
        h,
        f,
        threshold,
        iteration: iter,
        path: [...path],
        description: `(${pos[0]},${pos[1]}) を訪問: g=${g}, h=${h}, f=${f}`,
      });

      if (f > threshold) {
        nextThreshold = Math.min(nextThreshold, f);
        steps.push({
          type: "prune",
          grid,
          pos,
          goal,
          g,
          h,
          f,
          threshold,
          iteration: iter,
          path: [...path],
          description: `f=${f} > 閾値${threshold} → 枝刈り。次の閾値候補: ${f}`,
        });
        return false;
      }

      if (pos[0] === goal[0] && pos[1] === goal[1]) {
        steps.push({
          type: "found",
          grid,
          pos,
          goal,
          g,
          h: 0,
          f: g,
          threshold,
          iteration: iter,
          path: [...path],
          description: `ゴール到達! 最短距離 = ${g}`,
        });
        found = true;
        return true;
      }

      visited.add(`${pos[0]},${pos[1]}`);

      for (const [dr, dc] of DIRS) {
        const nr = pos[0] + dr;
        const nc = pos[1] + dc;
        if (
          nr >= 0 &&
          nr < rows &&
          nc >= 0 &&
          nc < cols &&
          grid[nr][nc] === 0 &&
          !visited.has(`${nr},${nc}`)
        ) {
          path.push([nr, nc]);
          if (dfs([nr, nc], g + 1)) return true;
          path.pop();
        }
      }

      visited.delete(`${pos[0]},${pos[1]}`);
      return false;
    }

    if (dfs(start, 0)) break;
    if (steps.length > MAX_STEPS) break;

    threshold = nextThreshold;
  }

  if (!found) {
    steps.push({
      type: "done",
      grid,
      pos: goal,
      goal,
      g: -1,
      h: 0,
      f: -1,
      threshold,
      iteration: 0,
      path: [],
      description: "探索完了 (ゴールに到達できない、またはステップ上限)",
    });
  } else {
    steps.push({
      type: "done",
      grid,
      pos: goal,
      goal,
      g: steps[steps.length - 1].g,
      h: 0,
      f: steps[steps.length - 1].g,
      threshold,
      iteration: 0,
      path: steps[steps.length - 1].path,
      description: `探索完了: 最短パスを発見 (距離 ${steps[steps.length - 1].g})`,
    });
  }

  return steps;
}

// --- Cell styling ---

function getCellClass(
  row: number,
  col: number,
  step: Step
): string {
  const base =
    "w-10 h-10 flex items-center justify-center border text-xs font-mono transition-colors";

  if (step.grid[row][col] === 1) {
    return `${base} bg-gray-800 border-gray-700 text-gray-400`;
  }

  const isStart = row === START[0] && col === START[1];
  const isGoal = row === step.goal[0] && col === step.goal[1];
  const isCurrent = row === step.pos[0] && col === step.pos[1];
  const isOnPath = step.path.some(([r, c]) => r === row && c === col);

  if (step.type === "found" && isOnPath) {
    return `${base} bg-emerald-100 border-emerald-500 font-bold`;
  }

  if (step.type === "done" && isOnPath) {
    return `${base} bg-emerald-100 border-emerald-500 font-bold`;
  }

  if (isCurrent && step.type === "prune") {
    return `${base} bg-red-100 border-red-500`;
  }

  if (isCurrent) {
    return `${base} bg-blue-100 border-blue-400`;
  }

  if (isStart || isGoal) {
    return `${base} bg-amber-50 border-amber-400 font-bold`;
  }

  if (isOnPath) {
    return `${base} bg-amber-50 border-amber-400`;
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function IDAStarAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    setSteps(generateSteps(DEFAULT_GRID, START, GOAL));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run();
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
    }, 400);
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">IDA*</h1>
        <p className="text-sm text-muted-foreground mb-6">
          反復深化と A* のヒューリスティックを組み合わせた探索アルゴリズム
        </p>

        {/* Grid */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            グリッド (S=スタート, G=ゴール)
          </div>
          <div className="inline-block">
            {step.grid.map((row, r) => (
              <div key={r} className="flex">
                {row.map((_, c) => (
                  <div key={c} className={getCellClass(r, c, step)}>
                    {r === START[0] && c === START[1]
                      ? "S"
                      : r === GOAL[0] && c === GOAL[1]
                        ? "G"
                        : step.grid[r][c] === 1
                          ? "#"
                          : ""}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3 flex-wrap">
          <span>
            閾値 ={" "}
            <span className="font-mono font-semibold text-foreground">
              {step.threshold}
            </span>
          </span>
          {step.type !== "done" && step.type !== "init" && step.type !== "new_threshold" && (
            <>
              <span>
                g ={" "}
                <span className="font-mono font-semibold text-foreground">
                  {step.g}
                </span>
              </span>
              <span>
                h ={" "}
                <span className="font-mono font-semibold text-foreground">
                  {step.h}
                </span>
              </span>
              <span>
                f ={" "}
                <span className="font-mono font-semibold text-foreground">
                  {step.f}
                </span>
              </span>
            </>
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
            <span>現在位置</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>現在のパス</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>最短パス</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>枝刈り</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-gray-800 border-2 border-gray-700" />
            <span>壁</span>
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
