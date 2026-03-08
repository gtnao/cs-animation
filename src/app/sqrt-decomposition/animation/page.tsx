"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "build_block"
  | "query_start"
  | "query_partial_left"
  | "query_full_block"
  | "query_partial_right"
  | "query_result"
  | "update"
  | "done";

interface Step {
  type: StepType;
  arr: number[];
  blocks: number[];
  blockSize: number;
  n: number;
  highlightIndices: number[];
  highlightBlocks: number[];
  queryRange?: [number, number];
  description: string;
}

// --- Algorithm ---

function generateBuildSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const n = arr.length;
  const blockSize = Math.max(1, Math.floor(Math.sqrt(n)));
  const numBlocks = Math.ceil(n / blockSize);
  const blocks = new Array(numBlocks).fill(0);

  steps.push({
    type: "init",
    arr: [...arr],
    blocks: [...blocks],
    blockSize,
    n,
    highlightIndices: [],
    highlightBlocks: [],
    description: `配列サイズ ${n}, ブロックサイズ √${n} ≈ ${blockSize}, ブロック数 ${numBlocks}`,
  });

  for (let b = 0; b < numBlocks; b++) {
    const start = b * blockSize;
    const end = Math.min(start + blockSize, n);
    for (let i = start; i < end; i++) {
      blocks[b] += arr[i];
    }
    steps.push({
      type: "build_block",
      arr: [...arr],
      blocks: [...blocks],
      blockSize,
      n,
      highlightIndices: Array.from({ length: end - start }, (_, i) => start + i),
      highlightBlocks: [b],
      description: `ブロック ${b} (区間 [${start}, ${end - 1}]): 合計 = ${blocks[b]}`,
    });
  }

  return steps;
}

function generateQuerySteps(
  arr: number[],
  blocks: number[],
  blockSize: number,
  n: number,
  ql: number,
  qr: number
): Step[] {
  const steps: Step[] = [];

  steps.push({
    type: "query_start",
    arr: [...arr],
    blocks: [...blocks],
    blockSize,
    n,
    highlightIndices: [],
    highlightBlocks: [],
    queryRange: [ql, qr],
    description: `区間 [${ql}, ${qr}] の合計を求める`,
  });

  let sum = 0;
  const blockL = Math.floor(ql / blockSize);
  const blockR = Math.floor(qr / blockSize);

  if (blockL === blockR) {
    // Same block
    const indices: number[] = [];
    for (let i = ql; i <= qr; i++) {
      sum += arr[i];
      indices.push(i);
    }
    steps.push({
      type: "query_partial_left",
      arr: [...arr],
      blocks: [...blocks],
      blockSize,
      n,
      highlightIndices: indices,
      highlightBlocks: [],
      queryRange: [ql, qr],
      description: `同一ブロック内: 要素を個別に加算 → ${sum}`,
    });
  } else {
    // Left partial
    const leftIndices: number[] = [];
    for (let i = ql; i < (blockL + 1) * blockSize; i++) {
      sum += arr[i];
      leftIndices.push(i);
    }
    if (leftIndices.length > 0) {
      steps.push({
        type: "query_partial_left",
        arr: [...arr],
        blocks: [...blocks],
        blockSize,
        n,
        highlightIndices: leftIndices,
        highlightBlocks: [],
        queryRange: [ql, qr],
        description: `左端の端数 (${leftIndices.length} 要素): 累積和 = ${sum}`,
      });
    }

    // Full blocks
    for (let b = blockL + 1; b < blockR; b++) {
      sum += blocks[b];
      steps.push({
        type: "query_full_block",
        arr: [...arr],
        blocks: [...blocks],
        blockSize,
        n,
        highlightIndices: [],
        highlightBlocks: [b],
        queryRange: [ql, qr],
        description: `ブロック ${b} をまとめて加算: +${blocks[b]} → 累積和 = ${sum}`,
      });
    }

    // Right partial
    const rightIndices: number[] = [];
    for (let i = blockR * blockSize; i <= qr; i++) {
      sum += arr[i];
      rightIndices.push(i);
    }
    if (rightIndices.length > 0) {
      steps.push({
        type: "query_partial_right",
        arr: [...arr],
        blocks: [...blocks],
        blockSize,
        n,
        highlightIndices: rightIndices,
        highlightBlocks: [],
        queryRange: [ql, qr],
        description: `右端の端数 (${rightIndices.length} 要素): 累積和 = ${sum}`,
      });
    }
  }

  steps.push({
    type: "query_result",
    arr: [...arr],
    blocks: [...blocks],
    blockSize,
    n,
    highlightIndices: [],
    highlightBlocks: [],
    queryRange: [ql, qr],
    description: `クエリ結果: sum([${ql}, ${qr}]) = ${sum}`,
  });

  return steps;
}

// --- Component ---

export default function SqrtDecompositionAnimationPage() {
  const [input, setInput] = useState("3 1 4 1 5 9 2 6 5 3");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queryL, setQueryL] = useState("2");
  const [queryR, setQueryR] = useState("7");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arrRef = useRef<number[]>([]);
  const blocksRef = useRef<number[]>([]);
  const blockSizeRef = useRef(0);

  const runBuild = useCallback((s: string) => {
    const arr = s.trim().split(/\s+/).map(Number).filter((x) => !isNaN(x));
    if (arr.length === 0) return;
    arrRef.current = arr;
    const st = generateBuildSteps(arr);
    const last = st[st.length - 1];
    blocksRef.current = last.blocks;
    blockSizeRef.current = last.blockSize;
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const runQuery = useCallback(() => {
    const l = parseInt(queryL);
    const r = parseInt(queryR);
    const n = arrRef.current.length;
    if (isNaN(l) || isNaN(r) || l < 0 || r >= n || l > r) return;
    const st = generateQuerySteps(arrRef.current, blocksRef.current, blockSizeRef.current, n, l, r);
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
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

  const highlightSet = new Set(step.highlightIndices);
  const blockHighlightSet = new Set(step.highlightBlocks);

  return (
    <>
<div className="flex gap-2 mb-4">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runBuild(input); }} placeholder="配列を空白区切りで入力" className="font-mono max-w-md" />
          <Button onClick={() => runBuild(input)} variant="outline">構築</Button>
        </div>
        <div className="flex gap-2 mb-8">
          <Input value={queryL} onChange={(e) => setQueryL(e.target.value)} placeholder="L" className="font-mono w-16" />
          <Input value={queryR} onChange={(e) => setQueryR(e.target.value)} placeholder="R" className="font-mono w-16" />
          <Button onClick={runQuery} variant="outline">クエリ [L, R]</Button>
        </div>

        {/* Array with block grouping */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">配列 (ブロックサイズ = {step.blockSize})</div>
          <div className="flex gap-0.5 overflow-x-auto pb-1 flex-wrap">
            {step.arr.map((v, idx) => {
              const blockIdx = Math.floor(idx / step.blockSize);
              const isBlockStart = idx % step.blockSize === 0 && idx > 0;
              return (
                <div key={idx} className={`flex flex-col items-center gap-1 ${isBlockStart ? "ml-2" : ""}`}>
                  <div className={`w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors ${highlightSet.has(idx) ? "bg-amber-50 border-amber-400" : blockHighlightSet.has(blockIdx) ? "bg-emerald-100 border-emerald-500" : "bg-white border-gray-200"}`}>{v}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blocks */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">ブロック合計</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.blocks.map((v, b) => (
              <div key={b} className="flex flex-col items-center gap-1">
                <div className={`w-16 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors ${blockHighlightSet.has(b) ? "bg-emerald-100 border-emerald-500" : "bg-white border-gray-200"}`}>{v}</div>
                <div className="text-[10px] text-muted-foreground font-mono">B{b}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>端数要素</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>完全ブロック</span></div>
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
