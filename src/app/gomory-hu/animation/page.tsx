"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface TreeEdge {
  from: number;
  to: number;
  weight: number;
}

type StepType =
  | "init"
  | "select_pair"
  | "compute_maxflow"
  | "add_tree_edge"
  | "update_tree"
  | "done";

interface Step {
  type: StepType;
  treeEdges: TreeEdge[];
  currentS: number;
  currentT: number;
  maxFlowValue: number;
  iteration: number;
  description: string;
  highlightNodes: number[];
  highlightTreeEdges: number[];
}

// --- Graph layout ---

const NUM_NODES = 5;
const NODE_LABELS = ["0", "1", "2", "3", "4"];

// Original graph (undirected, with capacities)
const GRAPH_EDGES: { u: number; v: number; cap: number }[] = [
  { u: 0, v: 1, cap: 7 },
  { u: 0, v: 2, cap: 3 },
  { u: 1, v: 2, cap: 4 },
  { u: 1, v: 3, cap: 5 },
  { u: 2, v: 3, cap: 2 },
  { u: 2, v: 4, cap: 6 },
  { u: 3, v: 4, cap: 8 },
];

const NODE_POS_GRAPH: Record<number, { x: number; y: number }> = {
  0: { x: 80, y: 100 },
  1: { x: 230, y: 50 },
  2: { x: 180, y: 200 },
  3: { x: 350, y: 100 },
  4: { x: 350, y: 250 },
};

const NODE_POS_TREE: Record<number, { x: number; y: number }> = {
  0: { x: 80, y: 100 },
  1: { x: 200, y: 50 },
  2: { x: 200, y: 180 },
  3: { x: 350, y: 50 },
  4: { x: 350, y: 180 },
};

// --- Precomputed Gomory-Hu tree construction ---
// For the given graph, we precompute the steps

function generateSteps(): Step[] {
  const steps: Step[] = [];
  const treeEdges: TreeEdge[] = [];

  steps.push({
    type: "init",
    treeEdges: [],
    currentS: -1,
    currentT: -1,
    maxFlowValue: 0,
    iteration: 0,
    description: "Gomory-Hu木の構築を開始。5頂点の無向グラフから全頂点対の最小カット情報を持つ木を作ります。",
    highlightNodes: [],
    highlightTreeEdges: [],
  });

  // Iteration 1: pair (0, 1)
  steps.push({
    type: "select_pair",
    treeEdges: [],
    currentS: 0,
    currentT: 1,
    maxFlowValue: 0,
    iteration: 1,
    description: "反復 1: 頂点 0 と 1 の間の最大フローを計算。",
    highlightNodes: [0, 1],
    highlightTreeEdges: [],
  });

  steps.push({
    type: "compute_maxflow",
    treeEdges: [],
    currentS: 0,
    currentT: 1,
    maxFlowValue: 10,
    iteration: 1,
    description: "MaxFlow(0, 1) = 10。木辺 (0, 1, w=10) を追加。",
    highlightNodes: [0, 1],
    highlightTreeEdges: [],
  });

  treeEdges.push({ from: 0, to: 1, weight: 10 });

  steps.push({
    type: "add_tree_edge",
    treeEdges: [...treeEdges],
    currentS: 0,
    currentT: 1,
    maxFlowValue: 10,
    iteration: 1,
    description: "木辺追加: 0 -- 1 (重み 10)",
    highlightNodes: [0, 1],
    highlightTreeEdges: [0],
  });

  // Iteration 2: pair (1, 2)
  steps.push({
    type: "select_pair",
    treeEdges: [...treeEdges],
    currentS: 1,
    currentT: 2,
    maxFlowValue: 0,
    iteration: 2,
    description: "反復 2: 頂点 1 と 2 の間の最大フローを計算。",
    highlightNodes: [1, 2],
    highlightTreeEdges: [],
  });

  steps.push({
    type: "compute_maxflow",
    treeEdges: [...treeEdges],
    currentS: 1,
    currentT: 2,
    maxFlowValue: 9,
    iteration: 2,
    description: "MaxFlow(1, 2) = 9。木辺 (1, 2, w=9) を追加。",
    highlightNodes: [1, 2],
    highlightTreeEdges: [],
  });

  treeEdges.push({ from: 1, to: 2, weight: 9 });

  steps.push({
    type: "add_tree_edge",
    treeEdges: [...treeEdges],
    currentS: 1,
    currentT: 2,
    maxFlowValue: 9,
    iteration: 2,
    description: "木辺追加: 1 -- 2 (重み 9)",
    highlightNodes: [1, 2],
    highlightTreeEdges: [1],
  });

  // Iteration 3: pair (2, 3)
  steps.push({
    type: "select_pair",
    treeEdges: [...treeEdges],
    currentS: 2,
    currentT: 3,
    maxFlowValue: 0,
    iteration: 3,
    description: "反復 3: 頂点 2 と 3 の間の最大フローを計算。",
    highlightNodes: [2, 3],
    highlightTreeEdges: [],
  });

  steps.push({
    type: "compute_maxflow",
    treeEdges: [...treeEdges],
    currentS: 2,
    currentT: 3,
    maxFlowValue: 11,
    iteration: 3,
    description: "MaxFlow(2, 3) = 11。木辺 (2, 3, w=11) を追加。",
    highlightNodes: [2, 3],
    highlightTreeEdges: [],
  });

  treeEdges.push({ from: 2, to: 3, weight: 11 });

  steps.push({
    type: "add_tree_edge",
    treeEdges: [...treeEdges],
    currentS: 2,
    currentT: 3,
    maxFlowValue: 11,
    iteration: 3,
    description: "木辺追加: 2 -- 3 (重み 11)",
    highlightNodes: [2, 3],
    highlightTreeEdges: [2],
  });

  // Iteration 4: pair (3, 4)
  steps.push({
    type: "select_pair",
    treeEdges: [...treeEdges],
    currentS: 3,
    currentT: 4,
    maxFlowValue: 0,
    iteration: 4,
    description: "反復 4: 頂点 3 と 4 の間の最大フローを計算。",
    highlightNodes: [3, 4],
    highlightTreeEdges: [],
  });

  steps.push({
    type: "compute_maxflow",
    treeEdges: [...treeEdges],
    currentS: 3,
    currentT: 4,
    maxFlowValue: 14,
    iteration: 4,
    description: "MaxFlow(3, 4) = 14。木辺 (3, 4, w=14) を追加。",
    highlightNodes: [3, 4],
    highlightTreeEdges: [],
  });

  treeEdges.push({ from: 3, to: 4, weight: 14 });

  steps.push({
    type: "add_tree_edge",
    treeEdges: [...treeEdges],
    currentS: 3,
    currentT: 4,
    maxFlowValue: 14,
    iteration: 4,
    description: "木辺追加: 3 -- 4 (重み 14)",
    highlightNodes: [3, 4],
    highlightTreeEdges: [3],
  });

  steps.push({
    type: "done",
    treeEdges: [...treeEdges],
    currentS: -1,
    currentT: -1,
    maxFlowValue: 0,
    iteration: 4,
    description: "Gomory-Hu木の構築完了! 任意の2頂点間の最小カットは、木のパス上の最小重み辺の重みです。",
    highlightNodes: [],
    highlightTreeEdges: [],
  });

  return steps;
}

// --- Component ---

export default function GomoryHuAnimationPage() {
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
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 1200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Original graph */}
          <div className="border border-border rounded p-4">
            <div className="text-xs font-medium text-muted-foreground mb-2">元のグラフ</div>
            <svg viewBox="0 0 430 300" className="w-full h-auto">
              {GRAPH_EDGES.map((e, idx) => {
                const p1 = NODE_POS_GRAPH[e.u];
                const p2 = NODE_POS_GRAPH[e.v];
                return (
                  <g key={idx}>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="stroke-gray-300" strokeWidth={1.5} />
                    <text x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2 - 6} textAnchor="middle" className="text-[10px] fill-muted-foreground font-mono">{e.cap}</text>
                  </g>
                );
              })}
              {Array.from({ length: NUM_NODES }, (_, i) => {
                const pos = NODE_POS_GRAPH[i];
                const hl = step.highlightNodes.includes(i);
                return (
                  <g key={i}>
                    <circle cx={pos.x} cy={pos.y} r={20}
                      className={`${hl ? "fill-blue-100 stroke-blue-400" : "fill-white stroke-gray-300"} transition-colors`}
                      strokeWidth={2} />
                    <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="text-sm font-semibold fill-foreground">{NODE_LABELS[i]}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Gomory-Hu Tree */}
          <div className="border border-border rounded p-4">
            <div className="text-xs font-medium text-muted-foreground mb-2">Gomory-Hu 木</div>
            <svg viewBox="0 0 430 300" className="w-full h-auto">
              {step.treeEdges.map((e, idx) => {
                const p1 = NODE_POS_TREE[e.from];
                const p2 = NODE_POS_TREE[e.to];
                const isHL = step.highlightTreeEdges.includes(idx);
                return (
                  <g key={idx}>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                      className={`${isHL ? "stroke-emerald-500" : "stroke-gray-400"} transition-colors`}
                      strokeWidth={isHL ? 3 : 2} />
                    <foreignObject x={(p1.x + p2.x) / 2 - 16} y={(p1.y + p2.y) / 2 - 12} width={32} height={24}>
                      <div className={`text-xs font-mono text-center rounded px-1 ${isHL ? "bg-emerald-50 text-emerald-700" : "bg-white"}`}>{e.weight}</div>
                    </foreignObject>
                  </g>
                );
              })}
              {Array.from({ length: NUM_NODES }, (_, i) => {
                const pos = NODE_POS_TREE[i];
                const hl = step.highlightNodes.includes(i);
                return (
                  <g key={i}>
                    <circle cx={pos.x} cy={pos.y} r={20}
                      className={`${hl ? "fill-blue-100 stroke-blue-400" : "fill-white stroke-gray-300"} transition-colors`}
                      strokeWidth={2} />
                    <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="text-sm font-semibold fill-foreground">{NODE_LABELS[i]}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.iteration > 0 && <span>反復 {step.iteration} / {NUM_NODES - 1}</span>}
          {step.maxFlowValue > 0 && <span>MaxFlow = <span className="font-mono font-semibold text-foreground">{step.maxFlowValue}</span></span>}
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>選択頂点対</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" /><span>新しい木辺</span></div>
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
