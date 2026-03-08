"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface GridCell {
  row: number;
  col: number;
  wall: boolean;
}

interface Step {
  type: "init" | "extract" | "explore" | "found" | "done";
  grid: GridCell[][];
  open: [number, number][]; // [row, col]
  closed: [number, number][];
  current?: [number, number];
  g: number[][];
  f: number[][];
  path: [number, number][];
  description: string;
}

const INF = 999999;

// --- Default grid ---

const ROWS = 8;
const COLS = 10;
const START: [number, number] = [1, 1];
const GOAL: [number, number] = [6, 8];

function createDefaultGrid(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < COLS; c++) {
      row.push({ row: r, col: c, wall: false });
    }
    grid.push(row);
  }
  // Add walls
  const walls = [
    [2, 3], [3, 3], [4, 3], [5, 3],
    [2, 6], [3, 6], [4, 6],
    [5, 5], [5, 6],
  ];
  for (const [r, c] of walls) {
    grid[r][c].wall = true;
  }
  return grid;
}

// --- Heuristic (Manhattan distance) ---

function heuristic(r: number, c: number): number {
  return Math.abs(r - GOAL[0]) + Math.abs(c - GOAL[1]);
}

// --- Step generation ---

function generateSteps(grid: GridCell[][]): Step[] {
  const steps: Step[] = [];
  const g: number[][] = Array.from({ length: ROWS }, () =>
    new Array(COLS).fill(INF)
  );
  const f: number[][] = Array.from({ length: ROWS }, () =>
    new Array(COLS).fill(INF)
  );
  const parent: ([number, number] | null)[][] = Array.from(
    { length: ROWS },
    () => new Array(COLS).fill(null)
  );
  const closed: boolean[][] = Array.from({ length: ROWS }, () =>
    new Array(COLS).fill(false)
  );

  const openSet: [number, number][] = [];
  const closedSet: [number, number][] = [];

  g[START[0]][START[1]] = 0;
  f[START[0]][START[1]] = heuristic(START[0], START[1]);
  openSet.push(START);

  steps.push({
    type: "init",
    grid: grid.map((r) => r.map((c) => ({ ...c }))),
    open: [...openSet],
    closed: [],
    g: g.map((r) => [...r]),
    f: f.map((r) => [...r]),
    path: [],
    description: `始点 (${START[0]}, ${START[1]}) をオープンリストに追加。h = ${heuristic(START[0], START[1])}`,
  });

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (openSet.length > 0) {
    // Find min f
    let minIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      const [r1, c1] = openSet[i];
      const [r0, c0] = openSet[minIdx];
      if (f[r1][c1] < f[r0][c0]) {
        minIdx = i;
      }
    }
    const [cr, cc] = openSet.splice(minIdx, 1)[0];
    closed[cr][cc] = true;
    closedSet.push([cr, cc]);

    steps.push({
      type: "extract",
      grid: grid.map((r) => r.map((c) => ({ ...c }))),
      open: openSet.map((x) => [...x] as [number, number]),
      closed: closedSet.map((x) => [...x] as [number, number]),
      current: [cr, cc],
      g: g.map((r) => [...r]),
      f: f.map((r) => [...r]),
      path: [],
      description: `(${cr}, ${cc}) を取り出す: g=${g[cr][cc]}, h=${heuristic(cr, cc)}, f=${f[cr][cc]}`,
    });

    if (cr === GOAL[0] && cc === GOAL[1]) {
      // Reconstruct path
      const path: [number, number][] = [];
      let cur: [number, number] | null = GOAL;
      while (cur) {
        path.push(cur);
        cur = parent[cur[0]][cur[1]];
      }
      path.reverse();

      steps.push({
        type: "found",
        grid: grid.map((r) => r.map((c) => ({ ...c }))),
        open: openSet.map((x) => [...x] as [number, number]),
        closed: closedSet.map((x) => [...x] as [number, number]),
        current: GOAL,
        g: g.map((r) => [...r]),
        f: f.map((r) => [...r]),
        path,
        description: `ゴール到達！最短距離 = ${g[GOAL[0]][GOAL[1]]}`,
      });
      return steps;
    }

    for (const [dr, dc] of dirs) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (
        nr < 0 ||
        nr >= ROWS ||
        nc < 0 ||
        nc >= COLS ||
        grid[nr][nc].wall ||
        closed[nr][nc]
      )
        continue;

      const tentG = g[cr][cc] + 1;
      if (tentG < g[nr][nc]) {
        g[nr][nc] = tentG;
        f[nr][nc] = tentG + heuristic(nr, nc);
        parent[nr][nc] = [cr, cc];
        if (!openSet.some(([r, c]) => r === nr && c === nc)) {
          openSet.push([nr, nc]);
        }

        steps.push({
          type: "explore",
          grid: grid.map((r) => r.map((c) => ({ ...c }))),
          open: openSet.map((x) => [...x] as [number, number]),
          closed: closedSet.map((x) => [...x] as [number, number]),
          current: [cr, cc],
          g: g.map((r) => [...r]),
          f: f.map((r) => [...r]),
          path: [],
          description: `(${nr}, ${nc}) を更新: g=${tentG}, h=${heuristic(nr, nc)}, f=${f[nr][nc]}`,
        });
      }
    }
  }

  steps.push({
    type: "done",
    grid: grid.map((r) => r.map((c) => ({ ...c }))),
    open: [],
    closed: closedSet.map((x) => [...x] as [number, number]),
    g: g.map((r) => [...r]),
    f: f.map((r) => [...r]),
    path: [],
    description: "ゴールに到達できません。",
  });

  return steps;
}

// --- Cell color ---

function getCellColor(
  row: number,
  col: number,
  step: Step
): string {
  if (step.grid[row][col].wall) return "bg-gray-800 border-gray-700";

  // Path
  if (step.path.some(([r, c]) => r === row && c === col)) {
    return "bg-emerald-200 border-emerald-500";
  }

  // Start & Goal
  if (row === START[0] && col === START[1])
    return "bg-blue-200 border-blue-500";
  if (row === GOAL[0] && col === GOAL[1])
    return "bg-red-200 border-red-500";

  // Current
  if (step.current && step.current[0] === row && step.current[1] === col)
    return "bg-blue-100 border-blue-400";

  // Open
  if (step.open.some(([r, c]) => r === row && c === col))
    return "bg-amber-50 border-amber-400";

  // Closed
  if (step.closed.some(([r, c]) => r === row && c === col))
    return "bg-emerald-100 border-emerald-500";

  return "bg-white border-gray-200";
}

// --- Component ---

export default function AStarAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    const grid = createDefaultGrid();
    setSteps(generateSteps(grid));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run();
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
    }, 300);
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
<div className="text-sm text-muted-foreground mb-4">
          始点: ({START[0]}, {START[1]})　ゴール: ({GOAL[0]}, {GOAL[1]})
          　ヒューリスティック: マンハッタン距離
        </div>

        {/* Grid */}
        <div className="mb-6 border border-border rounded p-4 overflow-x-auto">
          <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${COLS}, 2.5rem)` }}>
            {Array.from({ length: ROWS }, (_, r) =>
              Array.from({ length: COLS }, (_, c) => {
                const color = getCellColor(r, c, step);
                const gVal = step.g[r][c];
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-10 h-10 flex items-center justify-center border-2 text-[10px] font-mono ${color}`}
                  >
                    {step.grid[r][c].wall
                      ? ""
                      : gVal < INF
                        ? gVal
                        : ""}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            Open:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.open.length}
            </span>
          </span>
          <span>
            Closed:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.closed.length}
            </span>
          </span>
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
            <div className="w-3.5 h-3.5 bg-blue-200 border-2 border-blue-500" />
            <span>始点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-200 border-2 border-red-500" />
            <span>ゴール</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>現在のノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>オープン</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>クローズ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-gray-800 border-2 border-gray-700" />
            <span>壁</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-200 border-2 border-emerald-500" />
            <span>最短経路</span>
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
