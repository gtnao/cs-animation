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

type StepType =
  | "init"
  | "max_flow"
  | "find_path"
  | "augment"
  | "bfs_reachable"
  | "identify_cut"
  | "done";

interface Step {
  type: StepType;
  edges: Edge[];
  totalFlow: number;
  sSet: number[];
  tSet: number[];
  cutEdges: number[];
  path: number[];
  pathEdges: number[];
  description: string;
  highlightEdges: number[];
  highlightNodes: number[];
}

// --- Graph layout ---

const NODE_POSITIONS: Record<number, { x: number; y: number }> = {
  0: { x: 60, y: 200 },
  1: { x: 200, y: 80 },
  2: { x: 200, y: 320 },
  3: { x: 380, y: 80 },
  4: { x: 380, y: 320 },
  5: { x: 520, y: 200 },
};

const NODE_LABELS = ["s", "A", "B", "C", "D", "t"];
const NUM_NODES = 6;

function createDefaultEdges(): Edge[] {
  return [
    { from: 0, to: 1, capacity: 10, flow: 0 },
    { from: 0, to: 2, capacity: 10, flow: 0 },
    { from: 1, to: 2, capacity: 2, flow: 0 },
    { from: 1, to: 3, capacity: 8, flow: 0 },
    { from: 2, to: 4, capacity: 9, flow: 0 },
    { from: 3, to: 5, capacity: 10, flow: 0 },
    { from: 4, to: 3, capacity: 6, flow: 0 },
    { from: 4, to: 5, capacity: 10, flow: 0 },
  ];
}

// --- BFS ---

function bfsPath(edges: Edge[], source: number, sink: number): { path: number[]; pathEdges: number[] } | null {
  const visited = new Array(NUM_NODES).fill(false);
  const parent: { node: number; edgeIdx: number }[] = new Array(NUM_NODES).fill(null);
  const queue = [source];
  visited[source] = true;

  while (queue.length > 0) {
    const u = queue.shift()!;
    if (u === sink) {
      const path: number[] = [];
      const pathEdges: number[] = [];
      let cur = sink;
      while (cur !== source) {
        path.unshift(cur);
        pathEdges.unshift(parent[cur].edgeIdx);
        cur = parent[cur].node;
      }
      path.unshift(source);
      return { path, pathEdges };
    }
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      if (e.from === u && !visited[e.to] && e.capacity - e.flow > 0) {
        visited[e.to] = true;
        parent[e.to] = { node: u, edgeIdx: i };
        queue.push(e.to);
      }
    }
  }
  return null;
}

function bfsReachable(edges: Edge[], source: number): number[] {
  const visited = new Array(NUM_NODES).fill(false);
  const queue = [source];
  visited[source] = true;

  while (queue.length > 0) {
    const u = queue.shift()!;
    for (const e of edges) {
      if (e.from === u && !visited[e.to] && e.capacity - e.flow > 0) {
        visited[e.to] = true;
        queue.push(e.to);
      }
    }
  }

  return visited.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
}

// --- Step generation ---

function generateSteps(): Step[] {
  const steps: Step[] = [];
  const edges = createDefaultEdges();
  let totalFlow = 0;

  steps.push({
    type: "init",
    edges: edges.map((e) => ({ ...e })),
    totalFlow: 0,
    sSet: [],
    tSet: [],
    cutEdges: [],
    path: [],
    pathEdges: [],
    description: "最小カットを求めます。まず最大フローを計算します。",
    highlightEdges: [],
    highlightNodes: [0, 5],
  });

  // Run max flow
  while (true) {
    const result = bfsPath(edges, 0, 5);
    if (!result) break;

    const { path, pathEdges } = result;

    steps.push({
      type: "find_path",
      edges: edges.map((e) => ({ ...e })),
      totalFlow,
      sSet: [],
      tSet: [],
      cutEdges: [],
      path,
      pathEdges,
      description: `増加パス: ${path.map((n) => NODE_LABELS[n]).join(" → ")}`,
      highlightEdges: pathEdges,
      highlightNodes: path,
    });

    let bottleneck = Infinity;
    for (const ei of pathEdges) {
      bottleneck = Math.min(bottleneck, edges[ei].capacity - edges[ei].flow);
    }

    for (const ei of pathEdges) {
      edges[ei].flow += bottleneck;
    }
    totalFlow += bottleneck;

    steps.push({
      type: "augment",
      edges: edges.map((e) => ({ ...e })),
      totalFlow,
      sSet: [],
      tSet: [],
      cutEdges: [],
      path,
      pathEdges,
      description: `フロー +${bottleneck}。合計 = ${totalFlow}`,
      highlightEdges: pathEdges,
      highlightNodes: path,
    });
  }

  steps.push({
    type: "max_flow",
    edges: edges.map((e) => ({ ...e })),
    totalFlow,
    sSet: [],
    tSet: [],
    cutEdges: [],
    path: [],
    pathEdges: [],
    description: `最大フロー = ${totalFlow}。次に残余グラフでBFSを行い、ソースから到達可能な頂点を求めます。`,
    highlightEdges: [],
    highlightNodes: [],
  });

  // Find min cut
  const sSet = bfsReachable(edges, 0);
  const tSet = Array.from({ length: NUM_NODES }, (_, i) => i).filter((i) => !sSet.includes(i));

  steps.push({
    type: "bfs_reachable",
    edges: edges.map((e) => ({ ...e })),
    totalFlow,
    sSet,
    tSet,
    cutEdges: [],
    path: [],
    pathEdges: [],
    description: `S集合 (ソースから到達可能): {${sSet.map((n) => NODE_LABELS[n]).join(", ")}}、T集合: {${tSet.map((n) => NODE_LABELS[n]).join(", ")}}`,
    highlightEdges: [],
    highlightNodes: sSet,
  });

  // Identify cut edges
  const cutEdges: number[] = [];
  for (let i = 0; i < edges.length; i++) {
    if (sSet.includes(edges[i].from) && tSet.includes(edges[i].to)) {
      cutEdges.push(i);
    }
  }

  steps.push({
    type: "identify_cut",
    edges: edges.map((e) => ({ ...e })),
    totalFlow,
    sSet,
    tSet,
    cutEdges,
    path: [],
    pathEdges: [],
    description: `最小カット辺: ${cutEdges.map((i) => `${NODE_LABELS[edges[i].from]}→${NODE_LABELS[edges[i].to]} (容量${edges[i].capacity})`).join(", ")}`,
    highlightEdges: cutEdges,
    highlightNodes: [],
  });

  const cutCapacity = cutEdges.reduce((sum, i) => sum + edges[i].capacity, 0);
  steps.push({
    type: "done",
    edges: edges.map((e) => ({ ...e })),
    totalFlow,
    sSet,
    tSet,
    cutEdges,
    path: [],
    pathEdges: [],
    description: `最小カット容量 = ${cutCapacity} = 最大フロー`,
    highlightEdges: cutEdges,
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
  if (step.cutEdges.includes(idx)) return "stroke-red-500";
  if (step.highlightEdges.includes(idx)) {
    if (step.type === "find_path") return "stroke-amber-400";
    if (step.type === "augment") return "stroke-emerald-500";
  }
  if (edge.flow >= edge.capacity && edge.capacity > 0) return "stroke-red-400";
  if (edge.flow > 0) return "stroke-emerald-500";
  return "stroke-gray-300";
}

function getNodeFill(nodeIdx: number, step: Step): { fill: string; stroke: string } {
  if (step.type === "bfs_reachable" || step.type === "identify_cut" || step.type === "done") {
    if (step.sSet.includes(nodeIdx)) return { fill: "fill-blue-100", stroke: "stroke-blue-400" };
    if (step.tSet.includes(nodeIdx)) return { fill: "fill-amber-50", stroke: "stroke-amber-400" };
  }
  if (step.highlightNodes.includes(nodeIdx)) {
    if (step.type === "init") return { fill: "fill-blue-100", stroke: "stroke-blue-400" };
    if (step.type === "find_path") return { fill: "fill-amber-50", stroke: "stroke-amber-400" };
    if (step.type === "augment") return { fill: "fill-emerald-100", stroke: "stroke-emerald-500" };
  }
  return { fill: "fill-white", stroke: "stroke-gray-300" };
}

function markerForColor(color: string): string {
  if (color === "stroke-amber-400") return "url(#arr-amber)";
  if (color === "stroke-emerald-500") return "url(#arr-green)";
  if (color === "stroke-red-500" || color === "stroke-red-400") return "url(#arr-red)";
  return "url(#arr-gray)";
}

// --- Component ---

export default function MinCutAnimationPage() {
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
          <svg viewBox="0 0 580 400" className="w-full h-auto">
            <defs>
              {[
                { id: "arr-gray", color: "#9ca3af" },
                { id: "arr-amber", color: "#f59e0b" },
                { id: "arr-green", color: "#10b981" },
                { id: "arr-red", color: "#ef4444" },
              ].map(({ id, color }) => (
                <marker key={id} id={id} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                </marker>
              ))}
            </defs>

            {/* Cut line visualization */}
            {(step.type === "identify_cut" || step.type === "done") && step.sSet.length > 0 && (
              <line x1={290} y1={10} x2={290} y2={390} stroke="#ef4444" strokeWidth={2} strokeDasharray="8,4" opacity={0.5} />
            )}

            {step.edges.map((edge, idx) => {
              const { sx, sy, tx, ty, mx, my } = computeEdgePath(edge.from, edge.to);
              const color = getEdgeColor(idx, edge, step);
              return (
                <g key={idx}>
                  <line x1={sx} y1={sy} x2={tx} y2={ty} className={`${color} transition-colors`}
                    strokeWidth={step.cutEdges.includes(idx) || step.highlightEdges.includes(idx) ? 3 : 2}
                    markerEnd={markerForColor(color)} />
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
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>最大フロー = <span className="font-mono font-semibold text-foreground">{step.totalFlow}</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>S集合 (ソース側)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" /><span>T集合 (シンク側)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" /><span>フロー流れ済み</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500 rounded-full" /><span>カット辺</span></div>
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
