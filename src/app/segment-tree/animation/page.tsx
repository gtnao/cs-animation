"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "visit"
  | "leaf"
  | "merge"
  | "query_visit"
  | "query_outside"
  | "query_inside"
  | "query_partial"
  | "query_result"
  | "update_visit"
  | "update_leaf"
  | "update_merge"
  | "done";

interface Step {
  type: StepType;
  tree: number[];
  n: number;
  highlightNodes: number[];
  queryRange?: [number, number];
  description: string;
}

// --- Algorithm step generation ---

function buildSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const n = arr.length;
  const size = n;
  const tree = new Array(4 * n).fill(0);

  steps.push({
    type: "init",
    tree: [...tree],
    n,
    highlightNodes: [],
    description: `配列 [${arr.join(", ")}] からセグメント木を構築する`,
  });

  function build(node: number, start: number, end: number) {
    if (start === end) {
      tree[node] = arr[start];
      steps.push({
        type: "leaf",
        tree: [...tree],
        n,
        highlightNodes: [node],
        description: `葉ノード ${node}: tree[${node}] = arr[${start}] = ${arr[start]}`,
      });
      return;
    }
    const mid = Math.floor((start + end) / 2);
    steps.push({
      type: "visit",
      tree: [...tree],
      n,
      highlightNodes: [node],
      description: `ノード ${node} を処理 (区間 [${start}, ${end}])`,
    });
    build(2 * node, start, mid);
    build(2 * node + 1, mid + 1, end);
    tree[node] = tree[2 * node] + tree[2 * node + 1];
    steps.push({
      type: "merge",
      tree: [...tree],
      n,
      highlightNodes: [node, 2 * node, 2 * node + 1],
      description: `ノード ${node}: tree[${2 * node}] + tree[${2 * node + 1}] = ${tree[2 * node]} + ${tree[2 * node + 1]} = ${tree[node]}`,
    });
  }

  build(1, 0, n - 1);
  return steps;
}

function querySteps(
  baseTree: number[],
  n: number,
  ql: number,
  qr: number
): Step[] {
  const steps: Step[] = [];
  const tree = [...baseTree];

  steps.push({
    type: "query_visit",
    tree: [...tree],
    n,
    highlightNodes: [],
    queryRange: [ql, qr],
    description: `区間 [${ql}, ${qr}] の合計を求める`,
  });

  function query(node: number, start: number, end: number, l: number, r: number): number {
    if (r < start || end < l) {
      steps.push({
        type: "query_outside",
        tree: [...tree],
        n,
        highlightNodes: [node],
        queryRange: [ql, qr],
        description: `ノード ${node} (区間 [${start}, ${end}]): クエリ区間外 → 0`,
      });
      return 0;
    }
    if (l <= start && end <= r) {
      steps.push({
        type: "query_inside",
        tree: [...tree],
        n,
        highlightNodes: [node],
        queryRange: [ql, qr],
        description: `ノード ${node} (区間 [${start}, ${end}]): クエリ区間に完全に含まれる → ${tree[node]}`,
      });
      return tree[node];
    }
    steps.push({
      type: "query_partial",
      tree: [...tree],
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
    n,
    highlightNodes: [],
    queryRange: [ql, qr],
    description: `クエリ結果: sum([${ql}, ${qr}]) = ${result}`,
  });

  return steps;
}

// --- Tree visualization ---

function getNodeColor(
  nodeIdx: number,
  step: Step
): string {
  if (step.highlightNodes.includes(nodeIdx)) {
    if (step.type === "query_outside") return "bg-red-100 border-red-500";
    if (step.type === "query_inside") return "bg-emerald-100 border-emerald-500";
    if (step.type === "query_partial") return "bg-amber-50 border-amber-400";
    return "bg-blue-100 border-blue-400";
  }
  return "bg-white border-gray-200";
}

function TreeVisualization({ step }: { step: Step }) {
  const { tree, n } = step;
  // Calculate tree depth
  const depth = Math.ceil(Math.log2(n)) + 1;
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
                className={`min-w-[3rem] h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors rounded ${getNodeColor(node, step)}`}
              >
                {tree[node]}
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

export default function SegmentTreeAnimationPage() {
  const [input, setInput] = useState("3 1 4 1 5 9 2 6");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<"build" | "query">("build");
  const [queryL, setQueryL] = useState("1");
  const [queryR, setQueryR] = useState("4");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const builtTreeRef = useRef<number[]>([]);
  const arrRef = useRef<number[]>([]);

  const runBuild = useCallback((s: string) => {
    const arr = s.trim().split(/\s+/).map(Number).filter((x) => !isNaN(x));
    if (arr.length === 0) return;
    arrRef.current = arr;
    const st = buildSteps(arr);
    // Save final tree
    builtTreeRef.current = st[st.length - 1].tree;
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
    if (builtTreeRef.current.length === 0) return;
    const st = querySteps(builtTreeRef.current, n, l, r);
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
    setMode("query");
  }, [queryL, queryR]);

  useEffect(() => {
    runBuild(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-advance
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

  // Keyboard shortcuts
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
        <h1 className="text-2xl font-bold mb-1">セグメント木</h1>
        <p className="text-sm text-muted-foreground mb-6">
          区間に対するクエリと一点更新を O(log n) で処理するデータ構造
        </p>

        {/* Input */}
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

        {/* Query input */}
        <div className="flex gap-2 mb-8">
          <Input
            value={queryL}
            onChange={(e) => setQueryL(e.target.value)}
            placeholder="L"
            className="font-mono w-20"
          />
          <Input
            value={queryR}
            onChange={(e) => setQueryR(e.target.value)}
            placeholder="R"
            className="font-mono w-20"
          />
          <Button onClick={runQuery} variant="outline">
            クエリ [L, R]
          </Button>
        </div>

        {/* Array */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            配列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {arrRef.current.map((v, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 flex items-center justify-center border-2 bg-white border-gray-200 text-sm font-mono">
                  {v}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tree */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            セグメント木
          </div>
          <TreeVisualization step={step} />
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            モード:{" "}
            <span className="font-mono font-semibold text-foreground">
              {mode === "build" ? "構築" : "クエリ"}
            </span>
          </span>
          {step.queryRange && (
            <span>
              クエリ区間:{" "}
              <span className="font-mono font-semibold text-foreground">
                [{step.queryRange[0]}, {step.queryRange[1]}]
              </span>
            </span>
          )}
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Description */}
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>処理中のノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>部分的に重なる</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>クエリ区間に含まれる</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>区間外</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep((prev) => Math.max(0, prev - 1));
              setIsPlaying(false);
            }}
            disabled={currentStep === 0}
          >
            ← 前へ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
              setIsPlaying(false);
            }}
            disabled={currentStep === steps.length - 1}
          >
            次へ →
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying((prev) => !prev)}
            disabled={currentStep === steps.length - 1}
          >
            {isPlaying ? "停止" : "再生"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep(0);
              setIsPlaying(false);
            }}
          >
            リセット
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
      </div>
    </div>
  );
}
