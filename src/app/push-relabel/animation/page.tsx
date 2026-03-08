"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface Edge {
  from: number;
  to: number;
  capacity: number;
  flow: number;
}

type StepType = "init" | "push" | "relabel" | "done";

interface Step {
  type: StepType;
  edges: Edge[];
  excess: number[];
  height: number[];
  activeNode: number;
  totalFlow: number;
  description: string;
  highlightEdges: number[];
  highlightNodes: number[];
}

// --- Graph layout ---

const NODE_POSITIONS: Record<number, { x: number; y: number }> = {
  0: { x: 60, y: 200 },
  1: { x: 200, y: 100 },
  2: { x: 200, y: 300 },
  3: { x: 380, y: 100 },
  4: { x: 380, y: 300 },
  5: { x: 520, y: 200 },
};

const NODE_LABELS = ["s", "A", "B", "C", "D", "t"];
const NUM_NODES = 6;
const SOURCE = 0;
const SINK = 5;

function createDefaultEdges(): Edge[] {
  return [
    { from: 0, to: 1, capacity: 10, flow: 0 },
    { from: 0, to: 2, capacity: 8, flow: 0 },
    { from: 1, to: 3, capacity: 5, flow: 0 },
    { from: 1, to: 2, capacity: 3, flow: 0 },
    { from: 2, to: 4, capacity: 7, flow: 0 },
    { from: 3, to: 5, capacity: 8, flow: 0 },
    { from: 4, to: 3, capacity: 4, flow: 0 },
    { from: 4, to: 5, capacity: 6, flow: 0 },
  ];
}

// --- Step generation ---

function generateSteps(): Step[] {
  const steps: Step[] = [];
  const edges = createDefaultEdges();
  const excess = new Array(NUM_NODES).fill(0);
  const height = new Array(NUM_NODES).fill(0);

  // Build adjacency: for each edge, track reverse edge index
  // We use a simple approach: track flow on original edges
  // and compute residual capacity on-the-fly

  function residualCap(ei: number, forward: boolean): number {
    const e = edges[ei];
    return forward ? e.capacity - e.flow : e.flow;
  }

  function pushFlow(ei: number, forward: boolean, amount: number) {
    if (forward) {
      edges[ei].flow += amount;
    } else {
      edges[ei].flow -= amount;
    }
  }

  // Initialize: set height[s] = N, push max flow on all edges from source
  height[SOURCE] = NUM_NODES;

  steps.push({
    type: "init",
    edges: edges.map((e) => ({ ...e })),
    excess: [...excess],
    height: [...height],
    activeNode: -1,
    totalFlow: 0,
    description: `初期化: h(s) = ${NUM_NODES}。ソースからの全辺に容量いっぱいのプリフローを流します。`,
    highlightEdges: [],
    highlightNodes: [SOURCE],
  });

  // Initial preflow from source
  for (let i = 0; i < edges.length; i++) {
    if (edges[i].from === SOURCE) {
      const cap = edges[i].capacity;
      edges[i].flow = cap;
      excess[edges[i].to] += cap;
      excess[SOURCE] -= cap;
    }
  }

  steps.push({
    type: "init",
    edges: edges.map((e) => ({ ...e })),
    excess: [...excess],
    height: [...height],
    activeNode: -1,
    totalFlow: 0,
    description: `プリフロー送出完了。excess: ${[1, 2, 3, 4].map((i) => `${NODE_LABELS[i]}=${excess[i]}`).join(", ")}`,
    highlightEdges: edges.map((_, i) => (edges[i].from === SOURCE ? i : -1)).filter((i) => i >= 0),
    highlightNodes: [SOURCE],
  });

  // Main loop
  let iterations = 0;
  const MAX_ITER = 200;

  while (iterations < MAX_ITER) {
    iterations++;

    // Find active node (excess > 0, not source or sink)
    let active = -1;
    for (let i = 0; i < NUM_NODES; i++) {
      if (i !== SOURCE && i !== SINK && excess[i] > 0) {
        active = i;
        break;
      }
    }
    if (active === -1) break;

    // Try to push
    let pushed = false;
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      // Forward edge from active
      if (e.from === active && e.capacity - e.flow > 0 && height[active] === height[e.to] + 1) {
        const delta = Math.min(excess[active], e.capacity - e.flow);
        pushFlow(i, true, delta);
        excess[active] -= delta;
        excess[e.to] += delta;

        steps.push({
          type: "push",
          edges: edges.map((ed) => ({ ...ed })),
          excess: [...excess],
          height: [...height],
          activeNode: active,
          totalFlow: excess[SINK],
          description: `Push: ${NODE_LABELS[active]} → ${NODE_LABELS[e.to]} (${delta} 単位)。excess[${NODE_LABELS[active]}]=${excess[active]}`,
          highlightEdges: [i],
          highlightNodes: [active, e.to],
        });
        pushed = true;
        break;
      }
      // Reverse edge (push back)
      if (e.to === active && e.flow > 0 && height[active] === height[e.from] + 1) {
        const delta = Math.min(excess[active], e.flow);
        pushFlow(i, false, delta);
        excess[active] -= delta;
        excess[e.from] += delta;

        steps.push({
          type: "push",
          edges: edges.map((ed) => ({ ...ed })),
          excess: [...excess],
          height: [...height],
          activeNode: active,
          totalFlow: excess[SINK],
          description: `Push (逆辺): ${NODE_LABELS[active]} → ${NODE_LABELS[e.from]} (${delta} 単位)。excess[${NODE_LABELS[active]}]=${excess[active]}`,
          highlightEdges: [i],
          highlightNodes: [active, e.from],
        });
        pushed = true;
        break;
      }
    }

    if (!pushed) {
      // Relabel
      let minHeight = Infinity;
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        if (e.from === active && e.capacity - e.flow > 0) {
          minHeight = Math.min(minHeight, height[e.to]);
        }
        if (e.to === active && e.flow > 0) {
          minHeight = Math.min(minHeight, height[e.from]);
        }
      }
      const oldH = height[active];
      height[active] = minHeight + 1;

      steps.push({
        type: "relabel",
        edges: edges.map((ed) => ({ ...ed })),
        excess: [...excess],
        height: [...height],
        activeNode: active,
        totalFlow: excess[SINK],
        description: `Relabel: h(${NODE_LABELS[active]}) = ${oldH} → ${height[active]}`,
        highlightEdges: [],
        highlightNodes: [active],
      });
    }
  }

  const totalFlow = excess[SINK];
  steps.push({
    type: "done",
    edges: edges.map((e) => ({ ...e })),
    excess: [...excess],
    height: [...height],
    activeNode: -1,
    totalFlow,
    description: `最大フロー = ${totalFlow}`,
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
    if (step.type === "push") return "stroke-blue-400";
  }
  if (edge.flow >= edge.capacity && edge.capacity > 0) return "stroke-red-500";
  if (edge.flow > 0) return "stroke-emerald-500";
  return "stroke-gray-300";
}

function getNodeFill(nodeIdx: number, step: Step): { fill: string; stroke: string } {
  if (step.highlightNodes.includes(nodeIdx)) {
    if (step.type === "push") return { fill: "fill-blue-100", stroke: "stroke-blue-400" };
    if (step.type === "relabel") return { fill: "fill-amber-50", stroke: "stroke-amber-400" };
    if (step.type === "init") return { fill: "fill-blue-100", stroke: "stroke-blue-400" };
  }
  if (nodeIdx !== SOURCE && nodeIdx !== SINK && step.excess[nodeIdx] > 0) {
    return { fill: "fill-amber-50", stroke: "stroke-amber-400" };
  }
  return { fill: "fill-white", stroke: "stroke-gray-300" };
}

function markerForColor(color: string): string {
  if (color === "stroke-blue-400") return "url(#arr-blue)";
  if (color === "stroke-emerald-500") return "url(#arr-green)";
  if (color === "stroke-red-500") return "url(#arr-red)";
  return "url(#arr-gray)";
}

// --- Component ---

export default function PushRelabelAnimationPage() {
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
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 800);
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Push-Relabel</h1>
        <p className="text-sm text-muted-foreground mb-6">プリフローとラベル関数を用いた最大フローアルゴリズム</p>

        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 580 400" className="w-full h-auto">
            <defs>
              {[
                { id: "arr-gray", color: "#9ca3af" },
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
                  <foreignObject x={mx - 24} y={my - 12} width={48} height={24}>
                    <div className="text-xs font-mono text-center bg-white rounded px-1">{edge.flow}/{edge.capacity}</div>
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
                  <text x={pos.x} y={pos.y - 28} textAnchor="middle" className="text-[10px] fill-muted-foreground">
                    h={step.height[i]}{i !== SOURCE && i !== SINK ? ` e=${step.excess[i]}` : ""}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>合計フロー = <span className="font-mono font-semibold text-foreground">{step.totalFlow}</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>Push操作</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" /><span>超過フロー / Relabel</span></div>
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
      </div>
    </div>
  );
}
