"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface Edge {
  from: number;
  to: number;
  capacity: number;
  flow: number;
  cost: number;
}

type StepType =
  | "init"
  | "shortest_path"
  | "augment"
  | "update_flow"
  | "no_path"
  | "done";

interface Step {
  type: StepType;
  edges: Edge[];
  dist: number[];
  path: number[];
  pathEdges: number[];
  bottleneck: number;
  totalFlow: number;
  totalCost: number;
  description: string;
  highlightEdges: number[];
  highlightNodes: number[];
}

// --- Graph layout ---

const NODE_POSITIONS: Record<number, { x: number; y: number }> = {
  0: { x: 60, y: 200 },
  1: { x: 220, y: 80 },
  2: { x: 220, y: 320 },
  3: { x: 420, y: 80 },
  4: { x: 420, y: 320 },
  5: { x: 540, y: 200 },
};

const NODE_LABELS = ["s", "A", "B", "C", "D", "t"];
const NUM_NODES = 6;
const TARGET_FLOW = 10;

function createDefaultEdges(): Edge[] {
  return [
    { from: 0, to: 1, capacity: 5, flow: 0, cost: 2 },
    { from: 0, to: 2, capacity: 8, flow: 0, cost: 5 },
    { from: 1, to: 3, capacity: 4, flow: 0, cost: 3 },
    { from: 1, to: 2, capacity: 3, flow: 0, cost: 1 },
    { from: 2, to: 4, capacity: 6, flow: 0, cost: 2 },
    { from: 3, to: 5, capacity: 7, flow: 0, cost: 4 },
    { from: 4, to: 3, capacity: 3, flow: 0, cost: 1 },
    { from: 4, to: 5, capacity: 5, flow: 0, cost: 6 },
  ];
}

// --- Bellman-Ford ---

function bellmanFord(
  edges: Edge[],
  source: number
): { dist: number[]; parent: { node: number; edgeIdx: number }[] } | null {
  const INF = 1e18;
  const dist = new Array(NUM_NODES).fill(INF);
  const parent: { node: number; edgeIdx: number }[] = new Array(NUM_NODES).fill(null);
  dist[source] = 0;

  for (let iter = 0; iter < NUM_NODES - 1; iter++) {
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      if (e.capacity - e.flow > 0 && dist[e.from] + e.cost < dist[e.to]) {
        dist[e.to] = dist[e.from] + e.cost;
        parent[e.to] = { node: e.from, edgeIdx: i };
      }
    }
  }

  return { dist, parent };
}

// --- Step generation ---

function generateSteps(): Step[] {
  const steps: Step[] = [];
  const edges = createDefaultEdges();
  let totalFlow = 0;
  let totalCost = 0;

  steps.push({
    type: "init",
    edges: edges.map((e) => ({ ...e })),
    dist: new Array(NUM_NODES).fill(0),
    path: [],
    pathEdges: [],
    bottleneck: 0,
    totalFlow: 0,
    totalCost: 0,
    description: `最小費用流を開始。目標フロー量 = ${TARGET_FLOW}。各辺にコストが設定されています。`,
    highlightEdges: [],
    highlightNodes: [0, 5],
  });

  while (totalFlow < TARGET_FLOW) {
    const result = bellmanFord(edges, 0);
    if (!result || result.dist[5] >= 1e18) {
      steps.push({
        type: "no_path",
        edges: edges.map((e) => ({ ...e })),
        dist: result ? result.dist : new Array(NUM_NODES).fill(-1),
        path: [],
        pathEdges: [],
        bottleneck: 0,
        totalFlow,
        totalCost,
        description: `シンクに到達不可。これ以上フローを流せません。`,
        highlightEdges: [],
        highlightNodes: [],
      });
      break;
    }

    // Reconstruct path
    const path: number[] = [];
    const pathEdges: number[] = [];
    let cur = 5;
    while (cur !== 0) {
      path.unshift(cur);
      const p = result.parent[cur];
      pathEdges.unshift(p.edgeIdx);
      cur = p.node;
    }
    path.unshift(0);

    steps.push({
      type: "shortest_path",
      edges: edges.map((e) => ({ ...e })),
      dist: result.dist,
      path,
      pathEdges,
      bottleneck: 0,
      totalFlow,
      totalCost,
      description: `最短路 (コスト ${result.dist[5]}): ${path.map((n) => NODE_LABELS[n]).join(" → ")}`,
      highlightEdges: pathEdges,
      highlightNodes: path,
    });

    let bottleneck = TARGET_FLOW - totalFlow;
    for (const ei of pathEdges) {
      bottleneck = Math.min(bottleneck, edges[ei].capacity - edges[ei].flow);
    }

    steps.push({
      type: "augment",
      edges: edges.map((e) => ({ ...e })),
      dist: result.dist,
      path,
      pathEdges,
      bottleneck,
      totalFlow,
      totalCost,
      description: `ボトルネック容量 = ${bottleneck}。パス上のフローを更新します。`,
      highlightEdges: pathEdges,
      highlightNodes: path,
    });

    for (const ei of pathEdges) {
      edges[ei].flow += bottleneck;
    }
    totalFlow += bottleneck;
    totalCost += bottleneck * result.dist[5];

    steps.push({
      type: "update_flow",
      edges: edges.map((e) => ({ ...e })),
      dist: result.dist,
      path,
      pathEdges,
      bottleneck,
      totalFlow,
      totalCost,
      description: `フロー更新完了。合計フロー = ${totalFlow}, 合計コスト = ${totalCost}`,
      highlightEdges: pathEdges,
      highlightNodes: path,
    });
  }

  steps.push({
    type: "done",
    edges: edges.map((e) => ({ ...e })),
    dist: new Array(NUM_NODES).fill(0),
    path: [],
    pathEdges: [],
    bottleneck: 0,
    totalFlow,
    totalCost,
    description: `完了。最小費用 = ${totalCost} (フロー量 = ${totalFlow})`,
    highlightEdges: [],
    highlightNodes: [],
  });

  return steps;
}

// --- Rendering helpers ---

function computeEdgePath(from: number, to: number) {
  const s = NODE_POSITIONS[from];
  const t = NODE_POSITIONS[to];
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const r = 22;
  return {
    sx: s.x + (dx / len) * r,
    sy: s.y + (dy / len) * r,
    tx: t.x - (dx / len) * r,
    ty: t.y - (dy / len) * r,
    mx: (s.x + t.x) / 2,
    my: (s.y + t.y) / 2,
  };
}

function getEdgeColor(idx: number, edge: Edge, step: Step): string {
  if (step.highlightEdges.includes(idx)) {
    if (step.type === "shortest_path") return "stroke-amber-400";
    if (step.type === "augment") return "stroke-blue-400";
    if (step.type === "update_flow") return "stroke-emerald-500";
  }
  if (edge.flow >= edge.capacity && edge.capacity > 0) return "stroke-red-500";
  if (edge.flow > 0) return "stroke-emerald-500";
  return "stroke-gray-300";
}

function getNodeFill(nodeIdx: number, step: Step): { fill: string; stroke: string } {
  if (step.highlightNodes.includes(nodeIdx)) {
    if (step.type === "init") return { fill: "fill-blue-100", stroke: "stroke-blue-400" };
    if (step.type === "shortest_path") return { fill: "fill-amber-50", stroke: "stroke-amber-400" };
    if (step.type === "augment" || step.type === "update_flow")
      return { fill: "fill-emerald-100", stroke: "stroke-emerald-500" };
  }
  return { fill: "fill-white", stroke: "stroke-gray-300" };
}

function markerForColor(color: string): string {
  if (color === "stroke-amber-400") return "url(#arr-amber)";
  if (color === "stroke-blue-400") return "url(#arr-blue)";
  if (color === "stroke-emerald-500") return "url(#arr-green)";
  if (color === "stroke-red-500") return "url(#arr-red)";
  return "url(#arr-gray)";
}

// --- Component ---

export default function MinCostFlowAnimationPage() {
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
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 1000);
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
<div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 600 400" className="w-full h-auto">
            <defs>
              {[
                { id: "arr-gray", color: "#9ca3af" },
                { id: "arr-amber", color: "#f59e0b" },
                { id: "arr-blue", color: "#60a5fa" },
                { id: "arr-green", color: "#10b981" },
                { id: "arr-red", color: "#ef4444" },
              ].map(({ id, color }) => (
                <marker key={id} id={id} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                </marker>
              ))}
            </defs>

            {step.edges.map((edge, idx) => {
              const { sx, sy, tx, ty, mx, my } = computeEdgePath(edge.from, edge.to);
              const color = getEdgeColor(idx, edge, step);
              return (
                <g key={idx}>
                  <line x1={sx} y1={sy} x2={tx} y2={ty} className={`${color} transition-colors`} strokeWidth={step.highlightEdges.includes(idx) ? 3 : 2} markerEnd={markerForColor(color)} />
                  <foreignObject x={mx - 30} y={my - 12} width={60} height={24}>
                    <div className="text-[10px] font-mono text-center bg-white rounded px-1">
                      {edge.flow}/{edge.capacity} c={edge.cost}
                    </div>
                  </foreignObject>
                </g>
              );
            })}

            {Array.from({ length: NUM_NODES }, (_, i) => {
              const pos = NODE_POSITIONS[i];
              const { fill, stroke } = getNodeFill(i, step);
              return (
                <g key={i}>
                  <circle cx={pos.x} cy={pos.y} r={22} className={`${fill} ${stroke} transition-colors`} strokeWidth={2} />
                  <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="text-sm font-semibold fill-foreground">{NODE_LABELS[i]}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>フロー = <span className="font-mono font-semibold text-foreground">{step.totalFlow}</span></span>
          <span>コスト = <span className="font-mono font-semibold text-foreground">{step.totalCost}</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>処理中</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" /><span>最短路</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" /><span>フロー流れ済み</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500 rounded-full" /><span>飽和エッジ</span></div>
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
