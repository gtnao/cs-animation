"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "build_leaf"
  | "build_merge"
  | "query_visit"
  | "query_outside"
  | "query_inside"
  | "query_partial"
  | "query_result"
  | "done";

interface Step {
  type: StepType;
  tree: number[][];
  n: number;
  highlightNodes: number[];
  queryRange?: [number, number];
  queryVal?: number;
  description: string;
}

// --- Algorithm ---

function buildSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const n = arr.length;
  const tree: number[][] = new Array(4 * n).fill(null).map(() => []);

  steps.push({
    type: "init",
    tree: tree.map((a) => [...a]),
    n,
    highlightNodes: [],
    description: `配列 [${arr.join(", ")}] から Merge Sort Tree を構築する`,
  });

  function build(node: number, start: number, end: number) {
    if (start === end) {
      tree[node] = [arr[start]];
      steps.push({
        type: "build_leaf",
        tree: tree.map((a) => [...a]),
        n,
        highlightNodes: [node],
        description: `葉ノード ${node}: [${arr[start]}]`,
      });
      return;
    }
    const mid = Math.floor((start + end) / 2);
    build(2 * node, start, mid);
    build(2 * node + 1, mid + 1, end);
    // Merge sorted arrays
    const left = tree[2 * node];
    const right = tree[2 * node + 1];
    const merged: number[] = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) merged.push(left[i++]);
      else merged.push(right[j++]);
    }
    while (i < left.length) merged.push(left[i++]);
    while (j < right.length) merged.push(right[j++]);
    tree[node] = merged;
    steps.push({
      type: "build_merge",
      tree: tree.map((a) => [...a]),
      n,
      highlightNodes: [node, 2 * node, 2 * node + 1],
      description: `ノード ${node}: [${left.join(",")}] と [${right.join(",")}] をマージ → [${merged.join(",")}]`,
    });
  }

  build(1, 0, n - 1);
  return steps;
}

function querySteps(
  builtTree: number[][],
  n: number,
  ql: number,
  qr: number,
  x: number
): Step[] {
  const steps: Step[] = [];
  const tree = builtTree;

  steps.push({
    type: "query_visit",
    tree: tree.map((a) => [...a]),
    n,
    highlightNodes: [],
    queryRange: [ql, qr],
    queryVal: x,
    description: `区間 [${ql}, ${qr}] で ${x} 以下の要素数を求める`,
  });

  function countLessEqual(sortedArr: number[], x: number): number {
    let lo = 0, hi = sortedArr.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (sortedArr[mid] <= x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  function query(node: number, start: number, end: number, l: number, r: number): number {
    if (r < start || end < l) {
      steps.push({
        type: "query_outside",
        tree: tree.map((a) => [...a]),
        n,
        highlightNodes: [node],
        queryRange: [ql, qr],
        queryVal: x,
        description: `ノード ${node} (区間 [${start}, ${end}]): 区間外 → 0`,
      });
      return 0;
    }
    if (l <= start && end <= r) {
      const cnt = countLessEqual(tree[node], x);
      steps.push({
        type: "query_inside",
        tree: tree.map((a) => [...a]),
        n,
        highlightNodes: [node],
        queryRange: [ql, qr],
        queryVal: x,
        description: `ノード ${node} (区間 [${start}, ${end}]): [${tree[node].join(",")}] で ${x} 以下 = ${cnt} 個`,
      });
      return cnt;
    }
    steps.push({
      type: "query_partial",
      tree: tree.map((a) => [...a]),
      n,
      highlightNodes: [node],
      queryRange: [ql, qr],
      queryVal: x,
      description: `ノード ${node} (区間 [${start}, ${end}]): 部分的 → 子を探索`,
    });
    const mid = Math.floor((start + end) / 2);
    return query(2 * node, start, mid, l, r) + query(2 * node + 1, mid + 1, end, l, r);
  }

  const result = query(1, 0, n - 1, ql, qr);
  steps.push({
    type: "query_result",
    tree: tree.map((a) => [...a]),
    n,
    highlightNodes: [],
    queryRange: [ql, qr],
    queryVal: x,
    description: `結果: 区間 [${ql}, ${qr}] で ${x} 以下の要素数 = ${result}`,
  });

  return steps;
}

// --- Visualization ---

function TreeVisualization({ step }: { step: Step }) {
  const { tree, n } = step;
  const levels: { node: number; start: number; end: number }[][] = [];

  function traverse(node: number, start: number, end: number, level: number) {
    if (level >= levels.length) levels.push([]);
    levels[level].push({ node, start, end });
    if (start === end) return;
    const mid = Math.floor((start + end) / 2);
    traverse(2 * node, start, mid, level + 1);
    traverse(2 * node + 1, mid + 1, end, level + 1);
  }

  if (n > 0) traverse(1, 0, n - 1, 0);

  return (
    <div className="overflow-x-auto pb-2">
      {levels.map((level, li) => (
        <div key={li} className="flex justify-center gap-1 mb-1">
          {level.map(({ node, start, end }) => {
            const isHighlighted = step.highlightNodes.includes(node);
            let color = "bg-white border-gray-200";
            if (isHighlighted) {
              if (step.type === "query_outside") color = "bg-red-100 border-red-500";
              else if (step.type === "query_inside") color = "bg-emerald-100 border-emerald-500";
              else if (step.type === "query_partial") color = "bg-amber-50 border-amber-400";
              else color = "bg-blue-100 border-blue-400";
            }
            const arr = tree[node] || [];
            return (
              <div key={node} className="flex flex-col items-center">
                <div className={`min-w-[3rem] px-1 h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors rounded ${color}`}>
                  [{arr.join(",")}]
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  [{start},{end}]
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// --- Component ---

export default function MergeSortTreeAnimationPage() {
  const [input, setInput] = useState("3 1 4 1 5 9 2 6");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queryL, setQueryL] = useState("1");
  const [queryR, setQueryR] = useState("5");
  const [queryX, setQueryX] = useState("4");
  const [mode, setMode] = useState<"build" | "query">("build");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const builtTreeRef = useRef<number[][]>([]);
  const arrRef = useRef<number[]>([]);

  const runBuild = useCallback((s: string) => {
    const arr = s.trim().split(/\s+/).map(Number).filter((x) => !isNaN(x));
    if (arr.length === 0) return;
    arrRef.current = arr;
    const st = buildSteps(arr);
    builtTreeRef.current = st[st.length - 1].tree;
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
    setMode("build");
  }, []);

  const runQuery = useCallback(() => {
    const l = parseInt(queryL);
    const r = parseInt(queryR);
    const x = parseInt(queryX);
    const n = arrRef.current.length;
    if (isNaN(l) || isNaN(r) || isNaN(x) || l < 0 || r >= n || l > r) return;
    const st = querySteps(builtTreeRef.current, n, l, r, x);
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
    setMode("query");
  }, [queryL, queryR, queryX]);

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

  return (
    <>
<div className="flex gap-2 mb-4">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runBuild(input); }} placeholder="配列を空白区切りで入力" className="font-mono max-w-xs" />
          <Button onClick={() => runBuild(input)} variant="outline">構築</Button>
        </div>
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input value={queryL} onChange={(e) => setQueryL(e.target.value)} placeholder="L" className="font-mono w-16" />
          <Input value={queryR} onChange={(e) => setQueryR(e.target.value)} placeholder="R" className="font-mono w-16" />
          <Input value={queryX} onChange={(e) => setQueryX(e.target.value)} placeholder="x" className="font-mono w-16" />
          <Button onClick={runQuery} variant="outline">x以下の個数</Button>
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">配列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {arrRef.current.map((v, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 flex items-center justify-center border-2 bg-white border-gray-200 text-sm font-mono">{v}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">Merge Sort Tree</div>
          <TreeVisualization step={step} />
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>モード: <span className="font-mono font-semibold text-foreground">{mode === "build" ? "構築" : "クエリ"}</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>処理中のノード</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>部分的に重なる</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>完全に含まれる</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>区間外</span></div>
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
