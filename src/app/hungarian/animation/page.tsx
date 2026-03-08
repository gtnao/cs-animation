"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

type StepType =
  | "init"
  | "row_reduce"
  | "col_reduce"
  | "find_assignment"
  | "cover_lines"
  | "adjust_matrix"
  | "done";

interface Step {
  type: StepType;
  matrix: number[][];
  assignment: [number, number][];
  rowCovered: boolean[];
  colCovered: boolean[];
  totalCost: number;
  description: string;
  highlightCells: [number, number][];
}

const N = 4;

const ORIGINAL_MATRIX = [
  [8, 4, 7, 3],
  [5, 2, 3, 1],
  [9, 6, 8, 4],
  [6, 3, 5, 2],
];

const LABELS_ROW = ["W1", "W2", "W3", "W4"];
const LABELS_COL = ["T1", "T2", "T3", "T4"];

// --- Step generation ---

function generateSteps(): Step[] {
  const steps: Step[] = [];
  const mat = ORIGINAL_MATRIX.map((r) => [...r]);

  steps.push({
    type: "init",
    matrix: mat.map((r) => [...r]),
    assignment: [],
    rowCovered: new Array(N).fill(false),
    colCovered: new Array(N).fill(false),
    totalCost: 0,
    description: `コスト行列を初期化。ワーカーをタスクに割り当て、総コストを最小化します。`,
    highlightCells: [],
  });

  // Step 1: Row reduction
  for (let i = 0; i < N; i++) {
    const minVal = Math.min(...mat[i]);
    for (let j = 0; j < N; j++) {
      mat[i][j] -= minVal;
    }
  }

  steps.push({
    type: "row_reduce",
    matrix: mat.map((r) => [...r]),
    assignment: [],
    rowCovered: new Array(N).fill(false),
    colCovered: new Array(N).fill(false),
    totalCost: 0,
    description: "各行の最小値を引く (行簡約)。",
    highlightCells: mat.flatMap((r, i) => r.map((v, j) => (v === 0 ? [i, j] as [number, number] : null)).filter(Boolean) as [number, number][]),
  });

  // Step 2: Column reduction
  for (let j = 0; j < N; j++) {
    let minVal = Infinity;
    for (let i = 0; i < N; i++) minVal = Math.min(minVal, mat[i][j]);
    for (let i = 0; i < N; i++) mat[i][j] -= minVal;
  }

  steps.push({
    type: "col_reduce",
    matrix: mat.map((r) => [...r]),
    assignment: [],
    rowCovered: new Array(N).fill(false),
    colCovered: new Array(N).fill(false),
    totalCost: 0,
    description: "各列の最小値を引く (列簡約)。",
    highlightCells: mat.flatMap((r, i) => r.map((v, j) => (v === 0 ? [i, j] as [number, number] : null)).filter(Boolean) as [number, number][]),
  });

  // Try to find assignment
  let maxIter = 10;
  while (maxIter-- > 0) {
    // Try to find optimal assignment using greedy on zeros
    const assignment = findAssignment(mat);

    if (assignment.length === N) {
      let totalCost = 0;
      for (const [i, j] of assignment) {
        totalCost += ORIGINAL_MATRIX[i][j];
      }

      steps.push({
        type: "find_assignment",
        matrix: mat.map((r) => [...r]),
        assignment,
        rowCovered: new Array(N).fill(false),
        colCovered: new Array(N).fill(false),
        totalCost,
        description: `最適割当を発見! 割当: ${assignment.map(([i, j]) => `${LABELS_ROW[i]}→${LABELS_COL[j]}`).join(", ")}`,
        highlightCells: assignment,
      });
      break;
    }

    steps.push({
      type: "find_assignment",
      matrix: mat.map((r) => [...r]),
      assignment,
      rowCovered: new Array(N).fill(false),
      colCovered: new Array(N).fill(false),
      totalCost: 0,
      description: `${assignment.length} 個の割当しか見つからず (${N} 個必要)。被覆線を引きます。`,
      highlightCells: assignment,
    });

    // Cover zeros with minimum lines
    const { rowCovered, colCovered } = coverZeros(mat, assignment);

    steps.push({
      type: "cover_lines",
      matrix: mat.map((r) => [...r]),
      assignment,
      rowCovered: [...rowCovered],
      colCovered: [...colCovered],
      totalCost: 0,
      description: `最小被覆線を引く。被覆線の数 = ${rowCovered.filter(Boolean).length + colCovered.filter(Boolean).length}`,
      highlightCells: [],
    });

    // Adjust matrix
    let minUncovered = Infinity;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (!rowCovered[i] && !colCovered[j]) {
          minUncovered = Math.min(minUncovered, mat[i][j]);
        }
      }
    }

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (!rowCovered[i] && !colCovered[j]) {
          mat[i][j] -= minUncovered;
        } else if (rowCovered[i] && colCovered[j]) {
          mat[i][j] += minUncovered;
        }
      }
    }

    steps.push({
      type: "adjust_matrix",
      matrix: mat.map((r) => [...r]),
      assignment: [],
      rowCovered: [...rowCovered],
      colCovered: [...colCovered],
      totalCost: 0,
      description: `行列を調整: 未被覆要素から ${minUncovered} を引き、交差部分に ${minUncovered} を足す。`,
      highlightCells: mat.flatMap((r, i) => r.map((v, j) => (v === 0 ? [i, j] as [number, number] : null)).filter(Boolean) as [number, number][]),
    });
  }

  const finalAssignment = findAssignment(mat);
  let totalCost = 0;
  for (const [i, j] of finalAssignment) {
    totalCost += ORIGINAL_MATRIX[i][j];
  }

  steps.push({
    type: "done",
    matrix: mat.map((r) => [...r]),
    assignment: finalAssignment,
    rowCovered: new Array(N).fill(false),
    colCovered: new Array(N).fill(false),
    totalCost,
    description: `最小コスト = ${totalCost}`,
    highlightCells: finalAssignment,
  });

  return steps;
}

function findAssignment(mat: number[][]): [number, number][] {
  // Simple greedy matching on zeros
  const usedRow = new Array(N).fill(false);
  const usedCol = new Array(N).fill(false);
  const result: [number, number][] = [];

  // Try to find maximum matching on zero entries
  const matchRow = new Array(N).fill(-1);
  const matchCol = new Array(N).fill(-1);

  for (let i = 0; i < N; i++) {
    const visited = new Array(N).fill(false);
    augment(i, mat, matchRow, matchCol, visited);
  }

  for (let i = 0; i < N; i++) {
    if (matchRow[i] !== -1) {
      result.push([i, matchRow[i]]);
    }
  }

  return result;
}

function augment(
  u: number,
  mat: number[][],
  matchRow: number[],
  matchCol: number[],
  visited: boolean[]
): boolean {
  for (let v = 0; v < N; v++) {
    if (mat[u][v] === 0 && !visited[v]) {
      visited[v] = true;
      if (matchCol[v] === -1 || augment(matchCol[v], mat, matchRow, matchCol, visited)) {
        matchRow[u] = v;
        matchCol[v] = u;
        return true;
      }
    }
  }
  return false;
}

function coverZeros(mat: number[][], assignment: [number, number][]): { rowCovered: boolean[]; colCovered: boolean[] } {
  const rowCovered = new Array(N).fill(false);
  const colCovered = new Array(N).fill(false);
  const matchedRows = new Set(assignment.map(([i]) => i));
  const matchedCols = new Set(assignment.map(([, j]) => j));

  // Mark unmatched rows
  const markedRows = new Set<number>();
  const markedCols = new Set<number>();

  for (let i = 0; i < N; i++) {
    if (!matchedRows.has(i)) markedRows.add(i);
  }

  let changed = true;
  while (changed) {
    changed = false;
    // Mark columns with zeros in marked rows
    for (const i of markedRows) {
      for (let j = 0; j < N; j++) {
        if (mat[i][j] === 0 && !markedCols.has(j)) {
          markedCols.add(j);
          changed = true;
        }
      }
    }
    // Mark rows matched to marked columns
    for (const [i, j] of assignment) {
      if (markedCols.has(j) && !markedRows.has(i)) {
        markedRows.add(i);
        changed = true;
      }
    }
  }

  // Cover: unmarked rows + marked columns
  for (let i = 0; i < N; i++) {
    if (!markedRows.has(i)) rowCovered[i] = true;
  }
  for (let j = 0; j < N; j++) {
    if (markedCols.has(j)) colCovered[j] = true;
  }

  return { rowCovered, colCovered };
}

// --- Component ---

export default function HungarianAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    setSteps(generateSteps());
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(); }, [run]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 1500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  const isHighlighted = (i: number, j: number) =>
    step.highlightCells.some(([a, b]) => a === i && b === j);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">ハンガリアン法</h1>
        <p className="text-sm text-muted-foreground mb-6">二部グラフの最小重み完全マッチングを求めるアルゴリズム</p>

        {/* Cost matrix */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">元のコスト行列</div>
          <div className="overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="w-12 h-8"></th>
                  {LABELS_COL.map((l) => (
                    <th key={l} className="w-12 h-8 text-xs text-muted-foreground font-medium">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ORIGINAL_MATRIX.map((row, i) => (
                  <tr key={i}>
                    <td className="text-xs text-muted-foreground font-medium text-center">{LABELS_ROW[i]}</td>
                    {row.map((val, j) => (
                      <td key={j} className="w-12 h-10 text-center border border-gray-200 text-sm font-mono bg-white">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Working matrix */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">作業行列</div>
          <div className="overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="w-12 h-8"></th>
                  {LABELS_COL.map((l, j) => (
                    <th key={l} className={`w-12 h-8 text-xs font-medium ${step.colCovered[j] ? "text-blue-600 bg-blue-50" : "text-muted-foreground"}`}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {step.matrix.map((row, i) => (
                  <tr key={i}>
                    <td className={`text-xs font-medium text-center ${step.rowCovered[i] ? "text-blue-600 bg-blue-50" : "text-muted-foreground"}`}>{LABELS_ROW[i]}</td>
                    {row.map((val, j) => {
                      let bg = "bg-white";
                      let border = "border-gray-200";
                      if (isHighlighted(i, j)) {
                        if (step.type === "done" || step.type === "find_assignment") {
                          bg = "bg-emerald-100";
                          border = "border-emerald-500";
                        } else {
                          bg = "bg-amber-50";
                          border = "border-amber-400";
                        }
                      } else if (step.rowCovered[i] && step.colCovered[j]) {
                        bg = "bg-blue-100";
                        border = "border-blue-300";
                      } else if (step.rowCovered[i] || step.colCovered[j]) {
                        bg = "bg-blue-50";
                        border = "border-blue-200";
                      }
                      return (
                        <td key={j} className={`w-12 h-10 text-center border-2 ${border} text-sm font-mono ${bg} transition-colors`}>{val}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.totalCost > 0 && (
            <span>総コスト = <span className="font-mono font-semibold text-foreground">{step.totalCost}</span></span>
          )}
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>ゼロ要素</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-50 border-2 border-blue-200" /><span>被覆線</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>割当</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((p) => !p)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
      </div>
    </div>
  );
}
