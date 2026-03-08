"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

type StepType = "init" | "reduce" | "recurse" | "interpolate" | "done";

interface Step {
  type: StepType;
  matrix: number[][];
  activeRows: number[];
  activeCols: number[];
  rowMin: number[];
  description: string;
  highlightRow?: number;
  highlightCol?: number;
}

// --- Algorithm ---

function generateSteps(): Step[] {
  const steps: Step[] = [];
  // Example Monge matrix (satisfies A[i][j] + A[i'][j'] <= A[i][j'] + A[i'][j] for i<i', j<j')
  const matrix = [
    [10, 17, 24, 28, 34],
    [14, 12, 22, 25, 30],
    [20, 16, 13, 21, 27],
    [28, 22, 18, 14, 23],
    [38, 30, 26, 20, 15],
  ];
  const n = matrix.length;
  const m = matrix[0].length;
  const rowMin = new Array(n).fill(-1);

  steps.push({
    type: "init",
    matrix: matrix.map(r => [...r]),
    activeRows: Array.from({ length: n }, (_, i) => i),
    activeCols: Array.from({ length: m }, (_, i) => i),
    rowMin: [...rowMin],
    description: `SMAWK: ${n}x${m} Monge行列の各行最小値を求める`,
  });

  // Simplified SMAWK visualization
  // Step 1: REDUCE - eliminate columns
  const keptCols = [0, 1, 2, 3, 4]; // In this example, no reduction needed

  steps.push({
    type: "reduce",
    matrix: matrix.map(r => [...r]),
    activeRows: Array.from({ length: n }, (_, i) => i),
    activeCols: [...keptCols],
    rowMin: [...rowMin],
    description: `REDUCE: 列数を行数以下に削減。この例では${keptCols.length}列を保持`,
  });

  // Step 2: Recursion on odd rows
  const oddRows = [1, 3];
  for (const row of oddRows) {
    let minVal = Infinity;
    let minCol = 0;
    for (let j = 0; j < m; j++) {
      if (matrix[row][j] < minVal) {
        minVal = matrix[row][j];
        minCol = j;
      }
    }
    rowMin[row] = minCol;

    steps.push({
      type: "recurse",
      matrix: matrix.map(r => [...r]),
      activeRows: [...oddRows],
      activeCols: [...keptCols],
      rowMin: [...rowMin],
      description: `奇数行${row}の最小値: 列${minCol} (値=${minVal})`,
      highlightRow: row,
      highlightCol: minCol,
    });
  }

  // Step 3: Interpolation for even rows
  const evenRows = [0, 2, 4];
  for (const row of evenRows) {
    // Search between neighboring odd rows' min columns
    let lo = 0;
    let hi = m - 1;
    if (row > 0 && rowMin[row - 1] >= 0) lo = rowMin[row - 1];
    if (row < n - 1 && rowMin[row + 1] >= 0) hi = rowMin[row + 1];

    let minVal = Infinity;
    let minCol = lo;
    for (let j = lo; j <= hi; j++) {
      if (matrix[row][j] < minVal) {
        minVal = matrix[row][j];
        minCol = j;
      }
    }
    rowMin[row] = minCol;

    steps.push({
      type: "interpolate",
      matrix: matrix.map(r => [...r]),
      activeRows: [...evenRows],
      activeCols: [...keptCols],
      rowMin: [...rowMin],
      description: `偶数行${row}: 列[${lo},${hi}]で探索 → 列${minCol} (値=${minVal})`,
      highlightRow: row,
      highlightCol: minCol,
    });
  }

  steps.push({
    type: "done",
    matrix: matrix.map(r => [...r]),
    activeRows: Array.from({ length: n }, (_, i) => i),
    activeCols: [...keptCols],
    rowMin: [...rowMin],
    description: `完了。各行の最小値位置: [${rowMin.join(", ")}]`,
  });

  return steps;
}

// --- Component ---

export default function MongeSMAWKAnimationPage() {
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
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((prev) => !prev); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  const n = step.matrix.length;
  const m = step.matrix[0].length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Monge性とSMAWK</h1>
        <p className="text-sm text-muted-foreground mb-6">Monge行列の行最小値を線形時間で求める</p>

        <Button onClick={run} variant="outline" className="mb-8">リセット</Button>

        {/* Matrix */}
        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">Monge 行列</div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-12 h-8 text-xs text-muted-foreground font-normal"></th>
                {Array.from({ length: m }, (_, j) => (
                  <th key={j} className="w-14 h-8 text-xs text-muted-foreground font-normal">{j}</th>
                ))}
                <th className="w-14 h-8 text-xs text-muted-foreground font-normal">min列</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: n }, (_, i) => (
                <tr key={i}>
                  <td className="w-12 h-10 text-xs text-muted-foreground text-center">{i}</td>
                  {Array.from({ length: m }, (_, j) => {
                    const base = "w-14 h-10 flex items-center justify-center border text-xs font-mono transition-colors";
                    let cls = `${base} bg-white border-gray-200`;
                    if (step.highlightRow === i && step.highlightCol === j) {
                      cls = `${base} bg-blue-100 border-blue-400 font-bold`;
                    } else if (step.rowMin[i] === j && step.rowMin[i] >= 0) {
                      cls = `${base} bg-emerald-100 border-emerald-500 font-bold`;
                    }
                    return <td key={j}><div className={cls}>{step.matrix[i][j]}</div></td>;
                  })}
                  <td className="w-14 h-10 text-xs text-center font-mono">
                    {step.rowMin[i] >= 0 ? step.rowMin[i] : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>現在探索中</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>行最小値確定</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
      </div>
    </div>
  );
}
