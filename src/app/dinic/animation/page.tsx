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
  | "bfs_level"
  | "find_path"
  | "augment"
  | "update_flow"
  | "phase_done"
  | "no_path"
  | "done";

interface Step {
  type: StepType;
  edges: Edge[];
  levels: number[];
  path: number[];
  pathEdges: number[];
  bottleneck: number;
  totalFlow: number;
  phase: number;
  description: string;
  highlightEdges: number[];
  highlightNodes: number[];
}

// --- Node positions ---

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

// --- BFS for level graph ---

function bfsLevels(edges: Edge[], source: number): number[] {
  const levels = new Array(NUM_NODES).fill(-1);
  levels[source] = 0;
  const queue = [source];
  while (queue.length > 0) {
    const u = queue.shift()!;
    for (const e of edges) {
      if (e.from === u && levels[e.to] === -1 && e.capacity - e.flow > 0) {
        levels[e.to] = levels[u] + 1;
        queue.push(e.to);
      }
    }
  }
  return levels;
}

// --- DFS for blocking flow ---

function dfsPath(
  edges: Edge[],
  levels: number[],
  source: number,
  sink: number
): { path: number[]; pathEdges: number[] } | null {
  const visited = new Set<number>();
  const stack: { node: number; path: number[]; pathEdges: number[] }[] = [
    { node: source, path: [source], pathEdges: [] },
  ];

  while (stack.length > 0) {
    const { node, path, pathEdges } = stack.pop()!;
    if (node === sink) return { path, pathEdges };
    if (visited.has(node)) continue;
    visited.add(node);

    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      if (
        e.from === node &&
        levels[e.to] === levels[node] + 1 &&
        e.capacity - e.flow > 0 &&
        !visited.has(e.to)
      ) {
        stack.push({
          node: e.to,
          path: [...path, e.to],
          pathEdges: [...pathEdges, i],
        });
      }
    }
  }
  return null;
}

// --- Step generation ---

function generateSteps(): Step[] {
  const steps: Step[] = [];
  const edges = createDefaultEdges();
  let totalFlow = 0;
  let phase = 0;

  steps.push({
    type: "init",
    edges: edges.map((e) => ({ ...e })),
    levels: new Array(NUM_NODES).fill(-1),
    path: [],
    pathEdges: [],
    bottleneck: 0,
    totalFlow: 0,
    phase: 0,
    description:
      "Dinic法を開始。BFSでレベルグラフを構築し、DFSでブロッキングフローを流す操作を繰り返します。",
    highlightEdges: [],
    highlightNodes: [0, 5],
  });

  while (true) {
    phase++;
    const levels = bfsLevels(edges, 0);

    if (levels[5] === -1) {
      steps.push({
        type: "no_path",
        edges: edges.map((e) => ({ ...e })),
        levels,
        path: [],
        pathEdges: [],
        bottleneck: 0,
        totalFlow,
        phase,
        description: `フェーズ ${phase}: BFS でシンクに到達不可。アルゴリズム終了。`,
        highlightEdges: [],
        highlightNodes: [],
      });
      break;
    }

    const reachable = levels
      .map((l, i) => (l >= 0 ? i : -1))
      .filter((i) => i >= 0);
    steps.push({
      type: "bfs_level",
      edges: edges.map((e) => ({ ...e })),
      levels,
      path: [],
      pathEdges: [],
      bottleneck: 0,
      totalFlow,
      phase,
      description: `フェーズ ${phase}: BFS でレベルグラフを構築。レベル: ${reachable.map((i) => `${NODE_LABELS[i]}=${levels[i]}`).join(", ")}`,
      highlightEdges: [],
      highlightNodes: reachable,
    });

    // Find blocking flow paths
    while (true) {
      const result = dfsPath(edges, levels, 0, 5);
      if (!result) {
        steps.push({
          type: "phase_done",
          edges: edges.map((e) => ({ ...e })),
          levels,
          path: [],
          pathEdges: [],
          bottleneck: 0,
          totalFlow,
          phase,
          description: `フェーズ ${phase} 完了。これ以上のパスなし。`,
          highlightEdges: [],
          highlightNodes: [],
        });
        break;
      }

      const { path, pathEdges } = result;

      steps.push({
        type: "find_path",
        edges: edges.map((e) => ({ ...e })),
        levels,
        path,
        pathEdges,
        bottleneck: 0,
        totalFlow,
        phase,
        description: `DFS で増加パス発見: ${path.map((n) => NODE_LABELS[n]).join(" → ")}`,
        highlightEdges: pathEdges,
        highlightNodes: path,
      });

      let bottleneck = Infinity;
      for (const ei of pathEdges) {
        bottleneck = Math.min(
          bottleneck,
          edges[ei].capacity - edges[ei].flow
        );
      }

      steps.push({
        type: "augment",
        edges: edges.map((e) => ({ ...e })),
        levels,
        path,
        pathEdges,
        bottleneck,
        totalFlow,
        phase,
        description: `ボトルネック容量 = ${bottleneck}`,
        highlightEdges: pathEdges,
        highlightNodes: path,
      });

      for (const ei of pathEdges) {
        edges[ei].flow += bottleneck;
      }
      totalFlow += bottleneck;

      steps.push({
        type: "update_flow",
        edges: edges.map((e) => ({ ...e })),
        levels,
        path,
        pathEdges,
        bottleneck,
        totalFlow,
        phase,
        description: `フロー更新。合計フロー = ${totalFlow}`,
        highlightEdges: pathEdges,
        highlightNodes: path,
      });
    }
  }

  steps.push({
    type: "done",
    edges: edges.map((e) => ({ ...e })),
    levels: new Array(NUM_NODES).fill(-1),
    path: [],
    pathEdges: [],
    bottleneck: 0,
    totalFlow,
    phase,
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

function getEdgeColor(edgeIdx: number, edge: Edge, step: Step): string {
  if (step.highlightEdges.includes(edgeIdx)) {
    if (step.type === "find_path") return "stroke-amber-400";
    if (step.type === "augment") return "stroke-blue-400";
    if (step.type === "update_flow") return "stroke-emerald-500";
  }
  if (edge.flow > 0 && edge.flow >= edge.capacity) return "stroke-red-500";
  if (edge.flow > 0) return "stroke-emerald-500";
  return "stroke-gray-300";
}

function getNodeFill(nodeIdx: number, step: Step): { fill: string; stroke: string } {
  if (step.highlightNodes.includes(nodeIdx)) {
    if (step.type === "init") return { fill: "fill-blue-100", stroke: "stroke-blue-400" };
    if (step.type === "bfs_level") return { fill: "fill-amber-50", stroke: "stroke-amber-400" };
    if (step.type === "find_path") return { fill: "fill-amber-50", stroke: "stroke-amber-400" };
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

export default function DinicAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    setSteps(generateSteps());
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") {
        setCurrentStep((p) => Math.max(0, p - 1));
        setIsPlaying(false);
      } else if (e.key === "ArrowRight") {
        setCurrentStep((p) => Math.min(steps.length - 1, p + 1));
        setIsPlaying(false);
      } else if (e.key === " ") {
        e.preventDefault();
        if (currentStep < steps.length - 1) setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Dinic法</h1>
        <p className="text-sm text-muted-foreground mb-6">
          レベルグラフとブロッキングフローを用いた最大フローアルゴリズム
        </p>

        {/* SVG */}
        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 580 400" className="w-full h-auto">
            <defs>
              {[
                { id: "arr-gray", color: "#9ca3af" },
                { id: "arr-amber", color: "#f59e0b" },
                { id: "arr-blue", color: "#60a5fa" },
                { id: "arr-green", color: "#10b981" },
                { id: "arr-red", color: "#ef4444" },
              ].map(({ id, color }) => (
                <marker
                  key={id}
                  id={id}
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                </marker>
              ))}
            </defs>

            {step.edges.map((edge, idx) => {
              const { sx, sy, tx, ty, mx, my } = computeEdgePath(edge.from, edge.to);
              const color = getEdgeColor(idx, edge, step);
              return (
                <g key={idx}>
                  <line
                    x1={sx} y1={sy} x2={tx} y2={ty}
                    className={`${color} transition-colors`}
                    strokeWidth={step.highlightEdges.includes(idx) ? 3 : 2}
                    markerEnd={markerForColor(color)}
                  />
                  <foreignObject x={mx - 24} y={my - 12} width={48} height={24}>
                    <div className="text-xs font-mono text-center bg-white rounded px-1">
                      {edge.flow}/{edge.capacity}
                    </div>
                  </foreignObject>
                </g>
              );
            })}

            {Array.from({ length: NUM_NODES }, (_, i) => {
              const pos = NODE_POSITIONS[i];
              const { fill, stroke } = getNodeFill(i, step);
              const level = step.levels[i];
              return (
                <g key={i}>
                  <circle cx={pos.x} cy={pos.y} r={22} className={`${fill} ${stroke} transition-colors`} strokeWidth={2} />
                  <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="text-sm font-semibold fill-foreground">
                    {NODE_LABELS[i]}
                  </text>
                  {level >= 0 && (
                    <text x={pos.x} y={pos.y - 28} textAnchor="middle" className="text-[10px] fill-muted-foreground">
                      L{level}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>合計フロー = <span className="font-mono font-semibold text-foreground">{step.totalFlow}</span></span>
          <span>フェーズ {step.phase}</span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" />
            <span>処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>増加パス / レベルグラフ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>フロー流れ済み</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500 rounded-full" />
            <span>飽和エッジ</span>
          </div>
        </div>

        {/* Controls */}
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
