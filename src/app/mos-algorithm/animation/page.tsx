"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "sort_queries"
  | "expand_right"
  | "shrink_right"
  | "expand_left"
  | "shrink_left"
  | "answer_query"
  | "done";

interface Query {
  l: number;
  r: number;
  idx: number;
  origIdx?: number;
}

interface Step {
  type: StepType;
  arr: number[];
  curL: number;
  curR: number;
  currentDistinct: number;
  queries: Query[];
  currentQueryIdx: number;
  answers: (number | null)[];
  highlightIndices: number[];
  description: string;
}

// --- Algorithm ---

function generateSteps(arr: number[], queries: Query[]): Step[] {
  const steps: Step[] = [];
  const n = arr.length;
  const blockSize = Math.max(1, Math.floor(Math.sqrt(n)));

  steps.push({
    type: "init",
    arr: [...arr],
    curL: 0,
    curR: -1,
    currentDistinct: 0,
    queries: [...queries],
    currentQueryIdx: -1,
    answers: new Array(queries.length).fill(null),
    highlightIndices: [],
    description: `配列 [${arr.join(", ")}] に対して ${queries.length} 個のクエリを処理 (ブロックサイズ = ${blockSize})`,
  });

  // Sort queries by Mo's order
  const sortedQueries = queries.map((q, i) => ({ ...q, origIdx: i }));
  sortedQueries.sort((a, b) => {
    const blockA = Math.floor(a.l / blockSize);
    const blockB = Math.floor(b.l / blockSize);
    if (blockA !== blockB) return blockA - blockB;
    return blockA % 2 === 0 ? a.r - b.r : b.r - a.r;
  });

  steps.push({
    type: "sort_queries",
    arr: [...arr],
    curL: 0,
    curR: -1,
    currentDistinct: 0,
    queries: sortedQueries,
    currentQueryIdx: -1,
    answers: new Array(queries.length).fill(null),
    highlightIndices: [],
    description: `クエリをソート: ${sortedQueries.map((q) => `[${q.l},${q.r}]`).join(", ")}`,
  });

  // Process queries
  let curL = 0;
  let curR = -1;
  const cnt: Map<number, number> = new Map();
  let distinct = 0;
  const answers: (number | null)[] = new Array(queries.length).fill(null);

  function add(idx: number) {
    const v = arr[idx];
    const c = cnt.get(v) || 0;
    if (c === 0) distinct++;
    cnt.set(v, c + 1);
  }

  function remove(idx: number) {
    const v = arr[idx];
    const c = cnt.get(v) || 0;
    if (c === 1) distinct--;
    cnt.set(v, c - 1);
  }

  for (let qi = 0; qi < sortedQueries.length; qi++) {
    const { l, r, origIdx } = sortedQueries[qi];

    // Expand right
    while (curR < r) {
      curR++;
      add(curR);
      steps.push({
        type: "expand_right",
        arr: [...arr],
        curL,
        curR,
        currentDistinct: distinct,
        queries: sortedQueries,
        currentQueryIdx: qi,
        answers: [...answers],
        highlightIndices: [curR],
        description: `右に拡張: idx ${curR} (値 ${arr[curR]}) を追加 → 種類数 = ${distinct}`,
      });
    }

    // Shrink right
    while (curR > r) {
      remove(curR);
      steps.push({
        type: "shrink_right",
        arr: [...arr],
        curL,
        curR,
        currentDistinct: distinct,
        queries: sortedQueries,
        currentQueryIdx: qi,
        answers: [...answers],
        highlightIndices: [curR],
        description: `右を縮小: idx ${curR} (値 ${arr[curR]}) を除去 → 種類数 = ${distinct}`,
      });
      curR--;
    }

    // Expand left
    while (curL > l) {
      curL--;
      add(curL);
      steps.push({
        type: "expand_left",
        arr: [...arr],
        curL,
        curR,
        currentDistinct: distinct,
        queries: sortedQueries,
        currentQueryIdx: qi,
        answers: [...answers],
        highlightIndices: [curL],
        description: `左に拡張: idx ${curL} (値 ${arr[curL]}) を追加 → 種類数 = ${distinct}`,
      });
    }

    // Shrink left
    while (curL < l) {
      remove(curL);
      steps.push({
        type: "shrink_left",
        arr: [...arr],
        curL,
        curR,
        currentDistinct: distinct,
        queries: sortedQueries,
        currentQueryIdx: qi,
        answers: [...answers],
        highlightIndices: [curL],
        description: `左を縮小: idx ${curL} (値 ${arr[curL]}) を除去 → 種類数 = ${distinct}`,
      });
      curL++;
    }

    answers[origIdx] = distinct;
    steps.push({
      type: "answer_query",
      arr: [...arr],
      curL,
      curR,
      currentDistinct: distinct,
      queries: sortedQueries,
      currentQueryIdx: qi,
      answers: [...answers],
      highlightIndices: [],
      description: `クエリ [${l}, ${r}] の答え = ${distinct} (異なる値の種類数)`,
    });
  }

  steps.push({
    type: "done",
    arr: [...arr],
    curL,
    curR,
    currentDistinct: distinct,
    queries: sortedQueries,
    currentQueryIdx: -1,
    answers: [...answers],
    highlightIndices: [],
    description: `全クエリ完了。答え: ${answers.join(", ")}`,
  });

  return steps;
}

// --- Component ---

export default function MosAlgorithmAnimationPage() {
  const [arrInput, setArrInput] = useState("1 2 1 3 2 1 4");
  const [queryInput, setQueryInput] = useState("0 3\n1 5\n2 6");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    const arr = arrInput.trim().split(/\s+/).map(Number).filter((x) => !isNaN(x));
    if (arr.length === 0) return;
    const qLines = queryInput.trim().split("\n").filter((l) => l.trim());
    const queries: Query[] = qLines.map((line, idx) => {
      const parts = line.trim().split(/\s+/).map(Number);
      return { l: parts[0], r: parts[1], idx };
    }).filter((q) => !isNaN(q.l) && !isNaN(q.r));
    if (queries.length === 0) return;
    const st = generateSteps(arr, queries);
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [arrInput, queryInput]);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 400);
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

  const highlightSet = new Set(step.highlightIndices);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Mo&apos;s Algorithm</h1>
        <p className="text-sm text-muted-foreground mb-6">
          オフラインの区間クエリを平方分割で効率的に処理するアルゴリズム
        </p>

        <div className="flex gap-2 mb-4">
          <Input value={arrInput} onChange={(e) => setArrInput(e.target.value)} placeholder="配列を空白区切りで" className="font-mono max-w-xs" />
        </div>
        <div className="flex gap-2 mb-4">
          <textarea value={queryInput} onChange={(e) => setQueryInput(e.target.value)} placeholder="L R (1行1クエリ)" className="font-mono text-sm border border-border rounded px-2 py-1 w-48 h-20" />
          <Button onClick={run} variant="outline">実行</Button>
        </div>

        {/* Array */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">配列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.arr.map((v, idx) => {
              const inRange = idx >= step.curL && idx <= step.curR;
              let color = "bg-white border-gray-200";
              if (highlightSet.has(idx)) {
                if (step.type === "expand_right" || step.type === "expand_left") color = "bg-emerald-100 border-emerald-500";
                else color = "bg-red-100 border-red-500";
              } else if (inRange) {
                color = "bg-amber-50 border-amber-400";
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors ${color}`}>{v}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current window info */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>ウィンドウ: <span className="font-mono font-semibold text-foreground">[{step.curL}, {step.curR}]</span></span>
          <span>種類数: <span className="font-mono font-semibold text-foreground">{step.currentDistinct}</span></span>
          {step.currentQueryIdx >= 0 && (
            <span>処理中: <span className="font-mono font-semibold text-foreground">Q{step.currentQueryIdx}</span></span>
          )}
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        {/* Queries */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">クエリ (ソート後)</div>
          <div className="flex gap-2 flex-wrap">
            {step.queries.map((q, i) => (
              <div key={i} className={`px-2 py-1 border rounded text-xs font-mono ${i === step.currentQueryIdx ? "bg-blue-100 border-blue-400" : step.answers[q.origIdx ?? q.idx] !== null ? "bg-emerald-50 border-emerald-300" : "bg-white border-gray-200"}`}>
                [{q.l},{q.r}]{step.answers[q.origIdx ?? q.idx] !== null ? ` = ${step.answers[q.origIdx ?? q.idx]}` : ""}
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>現在のウィンドウ</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>追加</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>除去</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>処理中のクエリ</span></div>
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
