"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "build_base"
  | "build_fill"
  | "query_start"
  | "query_overlap"
  | "query_result"
  | "done";

interface Step {
  type: StepType;
  table: number[][];
  n: number;
  logN: number;
  highlightCells: [number, number][];
  queryRange?: [number, number];
  description: string;
}

// --- Algorithm ---

function buildSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const n = arr.length;
  const logN = Math.floor(Math.log2(n)) + 1;
  const table: number[][] = Array.from({ length: logN }, () => new Array(n).fill(Infinity));

  steps.push({
    type: "init",
    table: table.map((r) => [...r]),
    n,
    logN,
    highlightCells: [],
    description: `配列 [${arr.join(", ")}] から Sparse Table を構築 (前処理 O(n log n)、クエリ O(1))`,
  });

  // Base case: k = 0
  for (let i = 0; i < n; i++) {
    table[0][i] = arr[i];
  }
  steps.push({
    type: "build_base",
    table: table.map((r) => [...r]),
    n,
    logN,
    highlightCells: Array.from({ length: n }, (_, i) => [0, i] as [number, number]),
    description: `k=0: 各要素をそのままコピー → table[0][i] = arr[i]`,
  });

  // Fill table
  for (let k = 1; k < logN; k++) {
    for (let i = 0; i + (1 << k) <= n; i++) {
      table[k][i] = Math.min(table[k - 1][i], table[k - 1][i + (1 << (k - 1))]);
      steps.push({
        type: "build_fill",
        table: table.map((r) => [...r]),
        n,
        logN,
        highlightCells: [
          [k, i],
          [k - 1, i],
          [k - 1, i + (1 << (k - 1))],
        ],
        description: `k=${k}, i=${i}: min(table[${k - 1}][${i}], table[${k - 1}][${i + (1 << (k - 1))}]) = min(${table[k - 1][i]}, ${table[k - 1][i + (1 << (k - 1))]}) = ${table[k][i]}`,
      });
    }
  }

  return steps;
}

function querySteps(
  table: number[][],
  n: number,
  logN: number,
  ql: number,
  qr: number
): Step[] {
  const steps: Step[] = [];
  const len = qr - ql + 1;
  const k = Math.floor(Math.log2(len));

  steps.push({
    type: "query_start",
    table: table.map((r) => [...r]),
    n,
    logN,
    highlightCells: [],
    queryRange: [ql, qr],
    description: `区間 [${ql}, ${qr}] の最小値を求める。区間長 = ${len}, k = floor(log2(${len})) = ${k}`,
  });

  const left = table[k][ql];
  const right = table[k][qr - (1 << k) + 1];

  steps.push({
    type: "query_overlap",
    table: table.map((r) => [...r]),
    n,
    logN,
    highlightCells: [
      [k, ql],
      [k, qr - (1 << k) + 1],
    ],
    queryRange: [ql, qr],
    description: `2つの重なる区間: table[${k}][${ql}] = ${left}, table[${k}][${qr - (1 << k) + 1}] = ${right}`,
  });

  const result = Math.min(left, right);
  steps.push({
    type: "query_result",
    table: table.map((r) => [...r]),
    n,
    logN,
    highlightCells: [],
    queryRange: [ql, qr],
    description: `結果: min(${left}, ${right}) = ${result}`,
  });

  return steps;
}

// --- Component ---

export default function SparseTableAnimationPage() {
  const [input, setInput] = useState("3 1 4 1 5 9 2 6");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queryL, setQueryL] = useState("2");
  const [queryR, setQueryR] = useState("6");
  const [mode, setMode] = useState<"build" | "query">("build");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tableRef = useRef<number[][]>([]);
  const nRef = useRef(0);
  const logNRef = useRef(0);

  const runBuild = useCallback((s: string) => {
    const arr = s.trim().split(/\s+/).map(Number).filter((x) => !isNaN(x));
    if (arr.length === 0) return;
    nRef.current = arr.length;
    logNRef.current = Math.floor(Math.log2(arr.length)) + 1;
    const st = buildSteps(arr);
    tableRef.current = st[st.length - 1].table;
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
    setMode("build");
  }, []);

  const runQuery = useCallback(() => {
    const l = parseInt(queryL);
    const r = parseInt(queryR);
    if (isNaN(l) || isNaN(r) || l < 0 || r >= nRef.current || l > r) return;
    const st = querySteps(tableRef.current, nRef.current, logNRef.current, l, r);
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
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 600);
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
    <>
<div className="flex gap-2 mb-4">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runBuild(input); }} placeholder="配列を空白区切りで入力" className="font-mono max-w-xs" />
          <Button onClick={() => runBuild(input)} variant="outline">構築</Button>
        </div>
        <div className="flex gap-2 mb-8">
          <Input value={queryL} onChange={(e) => setQueryL(e.target.value)} placeholder="L" className="font-mono w-16" />
          <Input value={queryR} onChange={(e) => setQueryR(e.target.value)} placeholder="R" className="font-mono w-16" />
          <Button onClick={runQuery} variant="outline">最小値クエリ [L, R]</Button>
        </div>

        {/* Table */}
        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">Sparse Table (行 k: 区間長 2^k)</div>
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
                  <td className="text-xs font-mono text-muted-foreground px-1 text-right">{k} (2^{k}={1 << k})</td>
                  {row.slice(0, step.n).map((v, i) => {
                    const isHL = highlightSet.has(`${k},${i}`);
                    const valid = i + (1 << k) <= step.n;
                    let color = valid ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 text-gray-300";
                    if (isHL) {
                      if (step.type === "query_overlap") color = "bg-emerald-100 border-emerald-500";
                      else color = "bg-blue-100 border-blue-400";
                    }
                    return (
                      <td key={i} className={`w-10 h-8 text-center border text-sm font-mono transition-colors ${color}`}>
                        {valid ? v : ""}
                      </td>
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
    </>
  );
}
