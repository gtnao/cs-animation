"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "build_level"
  | "build_prefix"
  | "build_suffix"
  | "query_start"
  | "query_same"
  | "query_combine"
  | "query_result"
  | "done";

interface Step {
  type: StepType;
  table: number[][];
  n: number;
  levels: number;
  highlightCells: [number, number][];
  queryRange?: [number, number];
  description: string;
}

// --- Algorithm ---

function buildSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const n = arr.length;
  // Pad to power of 2
  let size = 1;
  while (size < n) size <<= 1;
  const padded = [...arr];
  while (padded.length < size) padded.push(0);

  const levels = Math.ceil(Math.log2(size)) + 1;
  const table: number[][] = Array.from({ length: levels }, () => new Array(size).fill(0));

  // Base: copy original
  for (let i = 0; i < size; i++) {
    table[0][i] = padded[i];
  }

  steps.push({
    type: "init",
    table: table.map((r) => [...r]),
    n,
    levels,
    highlightCells: [],
    description: `配列 [${arr.join(", ")}] から Disjoint Sparse Table を構築 (サイズ ${size} に拡張)`,
  });

  // Build each level
  for (let k = 1; k < levels; k++) {
    const blockSize = 1 << k;
    const halfBlock = blockSize >> 1;

    for (let block = 0; block * blockSize < size; block++) {
      const base = block * blockSize;
      const mid = base + halfBlock;

      // Suffix from mid-1 to base
      if (mid - 1 < size) {
        table[k][mid - 1] = padded[mid - 1];
        for (let i = mid - 2; i >= base; i--) {
          table[k][i] = padded[i] + table[k][i + 1];
        }
      }

      // Prefix from mid to base + blockSize - 1
      if (mid < size) {
        table[k][mid] = padded[mid];
        for (let i = mid + 1; i < Math.min(base + blockSize, size); i++) {
          table[k][i] = table[k][i - 1] + padded[i];
        }
      }

      steps.push({
        type: "build_level",
        table: table.map((r) => [...r]),
        n,
        levels,
        highlightCells: Array.from(
          { length: Math.min(blockSize, size - base) },
          (_, i) => [k, base + i] as [number, number]
        ),
        description: `レベル ${k}: ブロック [${base}, ${Math.min(base + blockSize, size) - 1}] (中心 ${mid}) の接頭辞和・接尾辞和を計算`,
      });
    }
  }

  return steps;
}

function querySteps(
  table: number[][],
  n: number,
  levels: number,
  ql: number,
  qr: number
): Step[] {
  const steps: Step[] = [];

  steps.push({
    type: "query_start",
    table: table.map((r) => [...r]),
    n,
    levels,
    highlightCells: [],
    queryRange: [ql, qr],
    description: `区間 [${ql}, ${qr}] の合計を求める`,
  });

  if (ql === qr) {
    steps.push({
      type: "query_same",
      table: table.map((r) => [...r]),
      n,
      levels,
      highlightCells: [[0, ql]],
      queryRange: [ql, qr],
      description: `同一要素: arr[${ql}] = ${table[0][ql]}`,
    });
    return steps;
  }

  // Find the level where l and r are in different halves
  const xor = ql ^ qr;
  const k = Math.floor(Math.log2(xor)) + 1;
  const result = table[k][ql] + table[k][qr];

  steps.push({
    type: "query_combine",
    table: table.map((r) => [...r]),
    n,
    levels,
    highlightCells: [[k, ql], [k, qr]],
    queryRange: [ql, qr],
    description: `レベル ${k}: table[${k}][${ql}] + table[${k}][${qr}] = ${table[k][ql]} + ${table[k][qr]} = ${result}`,
  });

  steps.push({
    type: "query_result",
    table: table.map((r) => [...r]),
    n,
    levels,
    highlightCells: [],
    queryRange: [ql, qr],
    description: `結果: sum([${ql}, ${qr}]) = ${result}`,
  });

  return steps;
}

// --- Component ---

export default function DisjointSparseTableAnimationPage() {
  const [input, setInput] = useState("3 1 4 1 5 9 2 6");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queryL, setQueryL] = useState("1");
  const [queryR, setQueryR] = useState("5");
  const [mode, setMode] = useState<"build" | "query">("build");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tableRef = useRef<number[][]>([]);
  const nRef = useRef(0);
  const levelsRef = useRef(0);

  const runBuild = useCallback((s: string) => {
    const arr = s.trim().split(/\s+/).map(Number).filter((x) => !isNaN(x));
    if (arr.length === 0) return;
    nRef.current = arr.length;
    const st = buildSteps(arr);
    const last = st[st.length - 1];
    tableRef.current = last.table;
    levelsRef.current = last.levels;
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
    setMode("build");
  }, []);

  const runQuery = useCallback(() => {
    const l = parseInt(queryL);
    const r = parseInt(queryR);
    if (isNaN(l) || isNaN(r) || l < 0 || r >= nRef.current || l > r) return;
    const st = querySteps(tableRef.current, nRef.current, levelsRef.current, l, r);
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
    setMode("query");
  }, [queryL, queryR]);

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
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  const highlightSet = new Set(step.highlightCells.map(([k, i]) => `${k},${i}`));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Disjoint Sparse Table</h1>
        <p className="text-sm text-muted-foreground mb-6">
          半群に対する静的な区間クエリを O(1) で処理するデータ構造
        </p>

        <div className="flex gap-2 mb-4">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runBuild(input); }} placeholder="配列を空白区切りで入力" className="font-mono max-w-xs" />
          <Button onClick={() => runBuild(input)} variant="outline">構築</Button>
        </div>
        <div className="flex gap-2 mb-8">
          <Input value={queryL} onChange={(e) => setQueryL(e.target.value)} placeholder="L" className="font-mono w-16" />
          <Input value={queryR} onChange={(e) => setQueryR(e.target.value)} placeholder="R" className="font-mono w-16" />
          <Button onClick={runQuery} variant="outline">区間和クエリ [L, R]</Button>
        </div>

        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">Disjoint Sparse Table</div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="text-xs font-mono text-muted-foreground px-1">k \ i</th>
                {Array.from({ length: step.n }, (_, i) => (
                  <th key={i} className="text-xs font-mono text-muted-foreground px-1">{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {step.table.map((row, k) => (
                <tr key={k}>
                  <td className="text-xs font-mono text-muted-foreground px-1 text-right">{k}</td>
                  {row.slice(0, step.n).map((v, i) => {
                    const isHL = highlightSet.has(`${k},${i}`);
                    let color = "bg-white border-gray-200";
                    if (isHL) {
                      if (step.type === "query_combine" || step.type === "query_same") color = "bg-emerald-100 border-emerald-500";
                      else color = "bg-blue-100 border-blue-400";
                    }
                    return (
                      <td key={i} className={`w-10 h-8 text-center border text-sm font-mono transition-colors ${color}`}>{v}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>モード: <span className="font-mono font-semibold text-foreground">{mode === "build" ? "構築" : "クエリ"}</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>処理中のセル</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>クエリに使用</span></div>
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
