"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "add_visit"
  | "add_update"
  | "sum_visit"
  | "sum_add"
  | "sum_result"
  | "done";

interface Step {
  type: StepType;
  grid: number[][];
  bit: number[][];
  rows: number;
  cols: number;
  highlightCells: [number, number][];
  description: string;
}

// --- Algorithm ---

function buildSteps(grid: number[][]): Step[] {
  const steps: Step[] = [];
  const rows = grid.length;
  const cols = grid[0].length;
  const bit: number[][] = Array.from({ length: rows + 1 }, () =>
    new Array(cols + 1).fill(0)
  );

  // Build BIT
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let x = i + 1;
      while (x <= rows) {
        let y = j + 1;
        while (y <= cols) {
          bit[x][y] += grid[i][j];
          y += y & (-y);
        }
        x += x & (-x);
      }
    }
  }

  steps.push({
    type: "init",
    grid: grid.map((r) => [...r]),
    bit: bit.map((r) => [...r]),
    rows,
    cols,
    highlightCells: [],
    description: `${rows}x${cols} の2次元BITを構築完了`,
  });

  return steps;
}

function addSteps(
  prevBit: number[][],
  grid: number[][],
  rows: number,
  cols: number,
  r: number,
  c: number,
  val: number
): Step[] {
  const steps: Step[] = [];
  const bit = prevBit.map((row) => [...row]);
  const newGrid = grid.map((row) => [...row]);
  newGrid[r][c] += val;

  steps.push({
    type: "add_visit",
    grid: newGrid,
    bit: bit.map((row) => [...row]),
    rows,
    cols,
    highlightCells: [[r, c]],
    description: `位置 (${r}, ${c}) に ${val} を加算する`,
  });

  const updated: [number, number][] = [];
  let x = r + 1;
  while (x <= rows) {
    let y = c + 1;
    while (y <= cols) {
      bit[x][y] += val;
      updated.push([x, y]);
      y += y & (-y);
    }
    x += x & (-x);
  }

  steps.push({
    type: "add_update",
    grid: newGrid,
    bit: bit.map((row) => [...row]),
    rows,
    cols,
    highlightCells: updated,
    description: `BIT の ${updated.length} セルを更新: ${updated.map(([a, b]) => `(${a},${b})`).join(", ")}`,
  });

  steps.push({
    type: "done",
    grid: newGrid,
    bit: bit.map((row) => [...row]),
    rows,
    cols,
    highlightCells: [],
    description: `加算完了`,
  });

  return steps;
}

function sumSteps(
  bit: number[][],
  grid: number[][],
  rows: number,
  cols: number,
  r: number,
  c: number
): Step[] {
  const steps: Step[] = [];

  steps.push({
    type: "sum_visit",
    grid: grid.map((row) => [...row]),
    bit: bit.map((row) => [...row]),
    rows,
    cols,
    highlightCells: [],
    description: `prefix sum [0..${r}][0..${c}] を求める`,
  });

  let sum = 0;
  const visited: [number, number][] = [];
  let x = r + 1;
  while (x > 0) {
    let y = c + 1;
    while (y > 0) {
      sum += bit[x][y];
      visited.push([x, y]);
      y -= y & (-y);
    }
    x -= x & (-x);
  }

  steps.push({
    type: "sum_add",
    grid: grid.map((row) => [...row]),
    bit: bit.map((row) => [...row]),
    rows,
    cols,
    highlightCells: visited,
    description: `${visited.length} セルの値を合計: ${visited.map(([a, b]) => `BIT[${a}][${b}]=${bit[a][b]}`).join(" + ")}`,
  });

  steps.push({
    type: "sum_result",
    grid: grid.map((row) => [...row]),
    bit: bit.map((row) => [...row]),
    rows,
    cols,
    highlightCells: [],
    description: `prefix sum [0..${r}][0..${c}] = ${sum}`,
  });

  return steps;
}

// --- Component ---

export default function FenwickTree2DAnimationPage() {
  const [input, setInput] = useState("1 2 3\n4 5 6\n7 8 9");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [addR, setAddR] = useState("1");
  const [addC, setAddC] = useState("1");
  const [addVal, setAddVal] = useState("10");
  const [sumR, setSumR] = useState("1");
  const [sumC, setSumC] = useState("2");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bitRef = useRef<number[][]>([]);
  const gridRef = useRef<number[][]>([]);
  const rowsRef = useRef(0);
  const colsRef = useRef(0);

  const runBuild = useCallback((s: string) => {
    const lines = s.trim().split("\n").filter((l) => l.trim());
    const grid = lines.map((l) => l.trim().split(/\s+/).map(Number).filter((x) => !isNaN(x)));
    if (grid.length === 0 || grid[0].length === 0) return;
    gridRef.current = grid;
    rowsRef.current = grid.length;
    colsRef.current = grid[0].length;
    const st = buildSteps(grid);
    bitRef.current = st[st.length - 1].bit;
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const runAdd = useCallback(() => {
    const r = parseInt(addR);
    const c = parseInt(addC);
    const v = parseInt(addVal);
    if (isNaN(r) || isNaN(c) || isNaN(v) || r < 0 || r >= rowsRef.current || c < 0 || c >= colsRef.current) return;
    const st = addSteps(bitRef.current, gridRef.current, rowsRef.current, colsRef.current, r, c, v);
    const last = st[st.length - 1];
    bitRef.current = last.bit;
    gridRef.current = last.grid;
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [addR, addC, addVal]);

  const runSum = useCallback(() => {
    const r = parseInt(sumR);
    const c = parseInt(sumC);
    if (isNaN(r) || isNaN(c) || r < 0 || r >= rowsRef.current || c < 0 || c >= colsRef.current) return;
    const st = sumSteps(bitRef.current, gridRef.current, rowsRef.current, colsRef.current, r, c);
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [sumR, sumC]);

  useEffect(() => {
    runBuild(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 700);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  const highlightSet = new Set(step.highlightCells.map(([r, c]) => `${r},${c}`));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">2次元BIT</h1>
        <p className="text-sm text-muted-foreground mb-6">
          2次元の累積和クエリと一点加算を処理するデータ構造
        </p>

        <div className="flex gap-2 mb-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="行ごとに空白区切りで入力"
            className="font-mono text-sm border border-border rounded px-2 py-1 w-48 h-20"
          />
          <Button onClick={() => runBuild(input)} variant="outline">構築</Button>
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Input value={addR} onChange={(e) => setAddR(e.target.value)} placeholder="行" className="font-mono w-14" />
          <Input value={addC} onChange={(e) => setAddC(e.target.value)} placeholder="列" className="font-mono w-14" />
          <Input value={addVal} onChange={(e) => setAddVal(e.target.value)} placeholder="値" className="font-mono w-16" />
          <Button onClick={runAdd} variant="outline">加算</Button>
        </div>
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input value={sumR} onChange={(e) => setSumR(e.target.value)} placeholder="行" className="font-mono w-14" />
          <Input value={sumC} onChange={(e) => setSumC(e.target.value)} placeholder="列" className="font-mono w-14" />
          <Button onClick={runSum} variant="outline">累積和 [0..r][0..c]</Button>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">元のグリッド</div>
            <table className="border-collapse">
              <tbody>
                {step.grid.map((row, i) => (
                  <tr key={i}>
                    {row.map((v, j) => (
                      <td key={j} className={`w-10 h-10 text-center border-2 text-sm font-mono ${highlightSet.has(`${i},${j}`) ? "bg-blue-100 border-blue-400" : "bg-white border-gray-200"}`}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">BIT 配列 (1-indexed)</div>
            <table className="border-collapse">
              <tbody>
                {step.bit.slice(1).map((row, i) => (
                  <tr key={i}>
                    {row.slice(1).map((v, j) => {
                      const bitI = i + 1;
                      const bitJ = j + 1;
                      const isHL = highlightSet.has(`${bitI},${bitJ}`);
                      let color = "bg-white border-gray-200";
                      if (isHL) {
                        if (step.type === "add_update") color = "bg-blue-100 border-blue-400";
                        else if (step.type === "sum_add") color = "bg-emerald-100 border-emerald-500";
                      }
                      return (
                        <td key={j} className={`w-10 h-10 text-center border-2 text-sm font-mono transition-colors ${color}`}>{v}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>更新中</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>累積和に加算</span></div>
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
