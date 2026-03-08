"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "build_leaf"
  | "build_merge"
  | "push_down"
  | "range_update_visit"
  | "range_update_covered"
  | "range_update_partial"
  | "range_update_merge"
  | "query_visit"
  | "query_outside"
  | "query_covered"
  | "query_partial"
  | "query_result"
  | "done";

interface Step {
  type: StepType;
  tree: number[];
  lazy: number[];
  n: number;
  highlightNodes: number[];
  queryRange?: [number, number];
  description: string;
}

// --- Build ---

function buildSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const n = arr.length;
  const tree = new Array(4 * n).fill(0);
  const lazy = new Array(4 * n).fill(0);

  steps.push({
    type: "init",
    tree: [...tree],
    lazy: [...lazy],
    n,
    highlightNodes: [],
    description: `配列 [${arr.join(", ")}] から遅延評価セグメント木を構築する`,
  });

  function build(node: number, start: number, end: number) {
    if (start === end) {
      tree[node] = arr[start];
      steps.push({
        type: "build_leaf",
        tree: [...tree],
        lazy: [...lazy],
        n,
        highlightNodes: [node],
        description: `葉ノード ${node}: tree[${node}] = ${arr[start]}`,
      });
      return;
    }
    const mid = Math.floor((start + end) / 2);
    build(2 * node, start, mid);
    build(2 * node + 1, mid + 1, end);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
    steps.push({
      type: "build_merge",
      tree: [...tree],
      lazy: [...lazy],
      n,
      highlightNodes: [node],
      description: `ノード ${node}: ${tree[2 * node]} + ${tree[2 * node + 1]} = ${tree[node]}`,
    });
  }

  build(1, 0, n - 1);
  return steps;
}

// --- Range update steps ---

function rangeUpdateSteps(
  baseTree: number[],
  baseLazy: number[],
  n: number,
  ul: number,
  ur: number,
  val: number
): Step[] {
  const steps: Step[] = [];
  const tree = [...baseTree];
  const lazy = [...baseLazy];

  steps.push({
    type: "range_update_visit",
    tree: [...tree],
    lazy: [...lazy],
    n,
    highlightNodes: [],
    queryRange: [ul, ur],
    description: `区間 [${ul}, ${ur}] に ${val} を加算する`,
  });

  function pushDown(node: number, start: number, end: number) {
    if (lazy[node] !== 0) {
      const mid = Math.floor((start + end) / 2);
      tree[2 * node] += lazy[node] * (mid - start + 1);
      lazy[2 * node] += lazy[node];
      tree[2 * node + 1] += lazy[node] * (end - mid);
      lazy[2 * node + 1] += lazy[node];
      lazy[node] = 0;
      steps.push({
        type: "push_down",
        tree: [...tree],
        lazy: [...lazy],
        n,
        highlightNodes: [node, 2 * node, 2 * node + 1],
        queryRange: [ul, ur],
        description: `ノード ${node} の遅延値を子に伝搬`,
      });
    }
  }

  function update(node: number, start: number, end: number, l: number, r: number, v: number) {
    if (r < start || end < l) {
      return;
    }
    if (l <= start && end <= r) {
      tree[node] += v * (end - start + 1);
      lazy[node] += v;
      steps.push({
        type: "range_update_covered",
        tree: [...tree],
        lazy: [...lazy],
        n,
        highlightNodes: [node],
        queryRange: [ul, ur],
        description: `ノード ${node} (区間 [${start}, ${end}]): 完全に含まれる → 遅延値に ${v} を加算`,
      });
      return;
    }
    pushDown(node, start, end);
    const mid = Math.floor((start + end) / 2);
    steps.push({
      type: "range_update_partial",
      tree: [...tree],
      lazy: [...lazy],
      n,
      highlightNodes: [node],
      queryRange: [ul, ur],
      description: `ノード ${node} (区間 [${start}, ${end}]): 部分的に重なる → 子を探索`,
    });
    update(2 * node, start, mid, l, r, v);
    update(2 * node + 1, mid + 1, end, l, r, v);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
    steps.push({
      type: "range_update_merge",
      tree: [...tree],
      lazy: [...lazy],
      n,
      highlightNodes: [node],
      queryRange: [ul, ur],
      description: `ノード ${node} を再計算: ${tree[node]}`,
    });
  }

  update(1, 0, n - 1, ul, ur, val);
  steps.push({
    type: "done",
    tree: [...tree],
    lazy: [...lazy],
    n,
    highlightNodes: [],
    queryRange: [ul, ur],
    description: `区間更新完了`,
  });
  return steps;
}

// --- Query steps ---

function querySteps(
  baseTree: number[],
  baseLazy: number[],
  n: number,
  ql: number,
  qr: number
): Step[] {
  const steps: Step[] = [];
  const tree = [...baseTree];
  const lazy = [...baseLazy];

  steps.push({
    type: "query_visit",
    tree: [...tree],
    lazy: [...lazy],
    n,
    highlightNodes: [],
    queryRange: [ql, qr],
    description: `区間 [${ql}, ${qr}] の合計を求める`,
  });

  function pushDown(node: number, start: number, end: number) {
    if (lazy[node] !== 0) {
      const mid = Math.floor((start + end) / 2);
      tree[2 * node] += lazy[node] * (mid - start + 1);
      lazy[2 * node] += lazy[node];
      tree[2 * node + 1] += lazy[node] * (end - mid);
      lazy[2 * node + 1] += lazy[node];
      lazy[node] = 0;
      steps.push({
        type: "push_down",
        tree: [...tree],
        lazy: [...lazy],
        n,
        highlightNodes: [node, 2 * node, 2 * node + 1],
        queryRange: [ql, qr],
        description: `ノード ${node} の遅延値を子に伝搬`,
      });
    }
  }

  function query(node: number, start: number, end: number, l: number, r: number): number {
    if (r < start || end < l) {
      steps.push({
        type: "query_outside",
        tree: [...tree],
        lazy: [...lazy],
        n,
        highlightNodes: [node],
        queryRange: [ql, qr],
        description: `ノード ${node} (区間 [${start}, ${end}]): 区間外 → 0`,
      });
      return 0;
    }
    if (l <= start && end <= r) {
      steps.push({
        type: "query_covered",
        tree: [...tree],
        lazy: [...lazy],
        n,
        highlightNodes: [node],
        queryRange: [ql, qr],
        description: `ノード ${node} (区間 [${start}, ${end}]): 完全に含まれる → ${tree[node]}`,
      });
      return tree[node];
    }
    pushDown(node, start, end);
    steps.push({
      type: "query_partial",
      tree: [...tree],
      lazy: [...lazy],
      n,
      highlightNodes: [node],
      queryRange: [ql, qr],
      description: `ノード ${node} (区間 [${start}, ${end}]): 部分的に重なる → 子を探索`,
    });
    const mid = Math.floor((start + end) / 2);
    const leftVal = query(2 * node, start, mid, l, r);
    const rightVal = query(2 * node + 1, mid + 1, end, l, r);
    return leftVal + rightVal;
  }

  const result = query(1, 0, n - 1, ql, qr);
  steps.push({
    type: "query_result",
    tree: [...tree],
    lazy: [...lazy],
    n,
    highlightNodes: [],
    queryRange: [ql, qr],
    description: `クエリ結果: sum([${ql}, ${qr}]) = ${result}`,
  });
  return steps;
}

// --- Node color ---

function getNodeColor(nodeIdx: number, step: Step): string {
  if (step.highlightNodes.includes(nodeIdx)) {
    if (step.type === "query_outside") return "bg-red-100 border-red-500";
    if (step.type === "query_covered" || step.type === "range_update_covered")
      return "bg-emerald-100 border-emerald-500";
    if (step.type === "query_partial" || step.type === "range_update_partial")
      return "bg-amber-50 border-amber-400";
    if (step.type === "push_down") return "bg-amber-50 border-amber-400";
    return "bg-blue-100 border-blue-400";
  }
  return "bg-white border-gray-200";
}

// --- Tree visualization ---

function TreeVisualization({ step }: { step: Step }) {
  const { tree, lazy, n } = step;
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
          {level.map(({ node, start, end }) => (
            <div key={node} className="flex flex-col items-center">
              <div
                className={`min-w-[3.5rem] h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors rounded ${getNodeColor(node, step)}`}
              >
                {tree[node]}
                {lazy[node] !== 0 && (
                  <span className="text-[10px] text-amber-600 ml-0.5">
                    +{lazy[node]}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                [{start},{end}]
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// --- Component ---

export default function LazySegmentTreeAnimationPage() {
  const [input, setInput] = useState("1 3 5 7 9 11");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queryL, setQueryL] = useState("1");
  const [queryR, setQueryR] = useState("3");
  const [updateVal, setUpdateVal] = useState("2");
  const [mode, setMode] = useState<"build" | "query" | "update">("build");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const treeRef = useRef<number[]>([]);
  const lazyRef = useRef<number[]>([]);
  const arrRef = useRef<number[]>([]);

  const runBuild = useCallback((s: string) => {
    const arr = s.trim().split(/\s+/).map(Number).filter((x) => !isNaN(x));
    if (arr.length === 0) return;
    arrRef.current = arr;
    const st = buildSteps(arr);
    const last = st[st.length - 1];
    treeRef.current = last.tree;
    lazyRef.current = last.lazy;
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
    setMode("build");
  }, []);

  const runQuery = useCallback(() => {
    const l = parseInt(queryL);
    const r = parseInt(queryR);
    const n = arrRef.current.length;
    if (isNaN(l) || isNaN(r) || l < 0 || r >= n || l > r) return;
    const st = querySteps(treeRef.current, lazyRef.current, n, l, r);
    const last = st[st.length - 1];
    treeRef.current = last.tree;
    lazyRef.current = last.lazy;
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
    setMode("query");
  }, [queryL, queryR]);

  const runUpdate = useCallback(() => {
    const l = parseInt(queryL);
    const r = parseInt(queryR);
    const v = parseInt(updateVal);
    const n = arrRef.current.length;
    if (isNaN(l) || isNaN(r) || isNaN(v) || l < 0 || r >= n || l > r) return;
    const st = rangeUpdateSteps(treeRef.current, lazyRef.current, n, l, r, v);
    const last = st[st.length - 1];
    treeRef.current = last.tree;
    lazyRef.current = last.lazy;
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
    setMode("update");
  }, [queryL, queryR, updateVal]);

  useEffect(() => {
    runBuild(input);
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
    }, 600);
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">遅延評価セグメント木</h1>
        <p className="text-sm text-muted-foreground mb-6">
          区間更新と区間クエリを O(log n) で処理するデータ構造
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runBuild(input);
            }}
            placeholder="配列を空白区切りで入力"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => runBuild(input)} variant="outline">
            構築
          </Button>
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
          <Input value={queryL} onChange={(e) => setQueryL(e.target.value)} placeholder="L" className="font-mono w-16" />
          <Input value={queryR} onChange={(e) => setQueryR(e.target.value)} placeholder="R" className="font-mono w-16" />
          <Button onClick={runQuery} variant="outline">クエリ</Button>
          <Input value={updateVal} onChange={(e) => setUpdateVal(e.target.value)} placeholder="加算値" className="font-mono w-20" />
          <Button onClick={runUpdate} variant="outline">区間加算</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            遅延評価セグメント木
          </div>
          <TreeVisualization step={step} />
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            モード: <span className="font-mono font-semibold text-foreground">
              {mode === "build" ? "構築" : mode === "query" ? "クエリ" : "区間更新"}
            </span>
          </span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>処理中のノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>遅延伝搬 / 部分重なり</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>完全に含まれる</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>区間外</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((p) => !p)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
      </div>
    </div>
  );
}
