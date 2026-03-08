"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "build_adjacency"
  | "build_degree"
  | "build_laplacian"
  | "remove_row_col"
  | "compute_det"
  | "done";

interface Step {
  type: StepType;
  nVertices: number;
  edges: [number, number][];
  adjacency: number[][];
  degree: number[];
  laplacian: number[][];
  cofactor: number[][];
  currentRow: number;
  currentCol: number;
  determinant: number | null;
  description: string;
}

// --- Algorithm ---

function determinant(matrix: number[][]): number {
  const n = matrix.length;
  if (n === 0) return 1;
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

  // Gaussian elimination
  const m = matrix.map((r) => [...r]);
  let det = 1;
  for (let col = 0; col < n; col++) {
    let pivotRow = -1;
    for (let row = col; row < n; row++) {
      if (Math.abs(m[row][col]) > 1e-10) {
        pivotRow = row;
        break;
      }
    }
    if (pivotRow === -1) return 0;
    if (pivotRow !== col) {
      [m[col], m[pivotRow]] = [m[pivotRow], m[col]];
      det *= -1;
    }
    det *= m[col][col];
    const pivot = m[col][col];
    for (let row = col + 1; row < n; row++) {
      const factor = m[row][col] / pivot;
      for (let j = col; j < n; j++) {
        m[row][j] -= factor * m[col][j];
      }
    }
  }
  return Math.round(det);
}

function generateSteps(nVertices: number, edges: [number, number][]): Step[] {
  const steps: Step[] = [];
  const n = nVertices;

  const adj: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const deg: number[] = new Array(n).fill(0);

  steps.push({
    type: "init",
    nVertices: n,
    edges,
    adjacency: adj.map((r) => [...r]),
    degree: [...deg],
    laplacian: [],
    cofactor: [],
    currentRow: -1,
    currentCol: -1,
    determinant: null,
    description: `${n} 頂点 ${edges.length} 辺のグラフに対して行列木定理を適用`,
  });

  // Build adjacency matrix
  for (const [u, v] of edges) {
    adj[u][v] = (adj[u][v] || 0) + 1;
    adj[v][u] = (adj[v][u] || 0) + 1;
    deg[u]++;
    deg[v]++;
  }

  steps.push({
    type: "build_adjacency",
    nVertices: n,
    edges,
    adjacency: adj.map((r) => [...r]),
    degree: [...deg],
    laplacian: [],
    cofactor: [],
    currentRow: -1,
    currentCol: -1,
    determinant: null,
    description: `隣接行列 A を構築`,
  });

  steps.push({
    type: "build_degree",
    nVertices: n,
    edges,
    adjacency: adj.map((r) => [...r]),
    degree: [...deg],
    laplacian: [],
    cofactor: [],
    currentRow: -1,
    currentCol: -1,
    determinant: null,
    description: `次数行列 D を構築: [${deg.join(", ")}]`,
  });

  // Build Laplacian L = D - A
  const lap: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? deg[i] : 0) - adj[i][j])
  );

  steps.push({
    type: "build_laplacian",
    nVertices: n,
    edges,
    adjacency: adj.map((r) => [...r]),
    degree: [...deg],
    laplacian: lap.map((r) => [...r]),
    cofactor: [],
    currentRow: -1,
    currentCol: -1,
    determinant: null,
    description: `ラプラシアン行列 L = D - A を構築`,
  });

  // Remove last row and column for cofactor
  const cofactor: number[][] = [];
  for (let i = 0; i < n - 1; i++) {
    cofactor.push(lap[i].slice(0, n - 1));
  }

  steps.push({
    type: "remove_row_col",
    nVertices: n,
    edges,
    adjacency: adj.map((r) => [...r]),
    degree: [...deg],
    laplacian: lap.map((r) => [...r]),
    cofactor: cofactor.map((r) => [...r]),
    currentRow: n - 1,
    currentCol: n - 1,
    determinant: null,
    description: `行 ${n - 1} と列 ${n - 1} を削除して (${n - 1})x(${n - 1}) の小行列を得る`,
  });

  const det = determinant(cofactor);

  steps.push({
    type: "compute_det",
    nVertices: n,
    edges,
    adjacency: adj.map((r) => [...r]),
    degree: [...deg],
    laplacian: lap.map((r) => [...r]),
    cofactor: cofactor.map((r) => [...r]),
    currentRow: -1,
    currentCol: -1,
    determinant: det,
    description: `小行列の行列式 = ${det}`,
  });

  steps.push({
    type: "done",
    nVertices: n,
    edges,
    adjacency: adj.map((r) => [...r]),
    degree: [...deg],
    laplacian: lap.map((r) => [...r]),
    cofactor: cofactor.map((r) => [...r]),
    currentRow: -1,
    currentCol: -1,
    determinant: det,
    description: `計算完了: 全域木の個数 = ${det}`,
  });

  return steps;
}

function parseEdges(input: string): [number, number][] {
  const edges: [number, number][] = [];
  const parts = input.split(",").map((s) => s.trim());
  for (const part of parts) {
    const match = part.match(/(\d+)-(\d+)/);
    if (match) {
      edges.push([parseInt(match[1], 10), parseInt(match[2], 10)]);
    }
  }
  return edges;
}

// --- Component ---

export default function MatrixTreeTheoremAnimationPage() {
  const [inputV, setInputV] = useState("4");
  const [inputE, setInputE] = useState("0-1,0-2,0-3,1-2,2-3");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((vStr: string, eStr: string) => {
    const v = parseInt(vStr, 10);
    if (isNaN(v) || v < 2 || v > 6) return;
    const edges = parseEdges(eStr);
    setSteps(generateSteps(v, edges));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputV, inputE);
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

  const renderMatrix = (matrix: number[][], label: string, highlight?: { row: number; col: number }) => (
    <div className="mb-4">
      <div className="text-xs font-medium text-muted-foreground mb-2">{label}</div>
      <table className="border-collapse">
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              {row.map((val, j) => {
                const base = "w-10 h-10 text-center border-2 text-sm font-mono transition-colors";
                let cls: string;
                if (highlight && (i === highlight.row || j === highlight.col)) {
                  cls = `${base} bg-red-100 border-red-500`;
                } else if (i === j && val > 0) {
                  cls = `${base} bg-amber-50 border-amber-400`;
                } else {
                  cls = `${base} bg-white border-gray-200`;
                }
                return <td key={j} className={cls}>{val}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
{/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-sm">頂点数:</span>
            <Input value={inputV} onChange={(e) => setInputV(e.target.value)} className="font-mono w-20" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">辺:</span>
            <Input value={inputE} onChange={(e) => setInputE(e.target.value)} placeholder="0-1,0-2,1-2" className="font-mono w-48" />
          </div>
          <Button onClick={() => run(inputV, inputE)} variant="outline">
            実行
          </Button>
        </div>

        {/* Matrices */}
        <div className="flex flex-wrap gap-6 mb-6">
          {step.adjacency.length > 0 && step.type !== "init" &&
            renderMatrix(step.adjacency, "隣接行列 A")}
          {step.laplacian.length > 0 &&
            renderMatrix(
              step.laplacian,
              "ラプラシアン L = D - A",
              step.type === "remove_row_col"
                ? { row: step.currentRow, col: step.currentCol }
                : undefined
            )}
          {step.cofactor.length > 0 &&
            renderMatrix(step.cofactor, "余因子行列 (削除後)")}
        </div>

        {/* Result */}
        {step.determinant !== null && (
          <div className="mb-6 p-4 border border-emerald-500 bg-emerald-50 rounded">
            <span className="text-sm font-mono font-bold">
              全域木の個数 = {step.determinant}
            </span>
          </div>
        )}

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        {/* Description */}
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>対角要素 (次数)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>削除対象の行/列</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>結果</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
    </>
  );
}
