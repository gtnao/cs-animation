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

interface GraphState {
  nodes: number[];
  edges: Edge[];
}

type StepType =
  | "init"
  | "find_path"
  | "augment"
  | "update_flow"
  | "no_path"
  | "done";

interface Step {
  type: StepType;
  graph: GraphState;
  path: number[];
  pathEdges: number[];
  bottleneck: number;
  totalFlow: number;
  description: string;
  highlightEdges: number[];
  highlightNodes: number[];
}

// --- Node positions for visualization ---

const NODE_POSITIONS: Record<number, { x: number; y: number }> = {
  0: { x: 60, y: 200 },
  1: { x: 200, y: 80 },
  2: { x: 200, y: 320 },
  3: { x: 380, y: 80 },
  4: { x: 380, y: 320 },
  5: { x: 520, y: 200 },
};

const NODE_LABELS = ["s", "A", "B", "C", "D", "t"];

// --- Default graph ---

function createDefaultGraph(): { nodes: number[]; edges: Edge[] } {
  return {
    nodes: [0, 1, 2, 3, 4, 5],
    edges: [
      { from: 0, to: 1, capacity: 10, flow: 0 },
      { from: 0, to: 2, capacity: 10, flow: 0 },
      { from: 1, to: 2, capacity: 2, flow: 0 },
      { from: 1, to: 3, capacity: 8, flow: 0 },
      { from: 2, to: 4, capacity: 9, flow: 0 },
      { from: 3, to: 5, capacity: 10, flow: 0 },
      { from: 4, to: 3, capacity: 6, flow: 0 },
      { from: 4, to: 5, capacity: 10, flow: 0 },
    ],
  };
}

// --- BFS to find augmenting path ---

function bfs(
  edges: Edge[],
  numNodes: number,
  source: number,
  sink: number
): { path: number[]; pathEdges: number[] } | null {
  const visited = new Array(numNodes).fill(false);
  const parent: { node: number; edgeIdx: number }[] = new Array(numNodes).fill(
    null
  );
  const queue: number[] = [source];
  visited[source] = true;

  while (queue.length > 0) {
    const u = queue.shift()!;
    if (u === sink) {
      // Reconstruct path
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

// --- Step generation ---

function generateSteps(graph: { nodes: number[]; edges: Edge[] }): Step[] {
  const steps: Step[] = [];
  const edges = graph.edges.map((e) => ({ ...e }));
  const numNodes = graph.nodes.length;
  const source = 0;
  const sink = numNodes - 1;
  let totalFlow = 0;

  steps.push({
    type: "init",
    graph: { nodes: [...graph.nodes], edges: edges.map((e) => ({ ...e })) },
    path: [],
    pathEdges: [],
    bottleneck: 0,
    totalFlow: 0,
    description:
      "Ford-Fulkerson法を開始。ソース s からシンク t への最大フローを求めます。",
    highlightEdges: [],
    highlightNodes: [source, sink],
  });

  while (true) {
    const result = bfs(edges, numNodes, source, sink);

    if (!result) {
      steps.push({
        type: "no_path",
        graph: { nodes: [...graph.nodes], edges: edges.map((e) => ({ ...e })) },
        path: [],
        pathEdges: [],
        bottleneck: 0,
        totalFlow,
        description: `増加パスが見つかりません。アルゴリズム終了。`,
        highlightEdges: [],
        highlightNodes: [],
      });
      break;
    }

    const { path, pathEdges } = result;

    steps.push({
      type: "find_path",
      graph: { nodes: [...graph.nodes], edges: edges.map((e) => ({ ...e })) },
      path,
      pathEdges,
      bottleneck: 0,
      totalFlow,
      description: `増加パスを発見: ${path.map((n) => NODE_LABELS[n]).join(" → ")}`,
      highlightEdges: pathEdges,
      highlightNodes: path,
    });

    // Find bottleneck
    let bottleneck = Infinity;
    for (const ei of pathEdges) {
      bottleneck = Math.min(bottleneck, edges[ei].capacity - edges[ei].flow);
    }

    steps.push({
      type: "augment",
      graph: { nodes: [...graph.nodes], edges: edges.map((e) => ({ ...e })) },
      path,
      pathEdges,
      bottleneck,
      totalFlow,
      description: `ボトルネック容量 = ${bottleneck}。パス上の各辺にフローを追加します。`,
      highlightEdges: pathEdges,
      highlightNodes: path,
    });

    // Update flow
    for (const ei of pathEdges) {
      edges[ei].flow += bottleneck;
    }
    totalFlow += bottleneck;

    steps.push({
      type: "update_flow",
      graph: { nodes: [...graph.nodes], edges: edges.map((e) => ({ ...e })) },
      path,
      pathEdges,
      bottleneck,
      totalFlow,
      description: `フロー更新完了。合計フロー = ${totalFlow}`,
      highlightEdges: pathEdges,
      highlightNodes: path,
    });
  }

  steps.push({
    type: "done",
    graph: { nodes: [...graph.nodes], edges: edges.map((e) => ({ ...e })) },
    path: [],
    pathEdges: [],
    bottleneck: 0,
    totalFlow,
    description: `最大フロー = ${totalFlow}`,
    highlightEdges: [],
    highlightNodes: [],
  });

  return steps;
}

// --- Edge color ---

function getEdgeColor(
  edgeIdx: number,
  edge: Edge,
  step: Step
): string {
  if (step.highlightEdges.includes(edgeIdx)) {
    if (step.type === "find_path") return "stroke-amber-400";
    if (step.type === "augment") return "stroke-blue-400";
    if (step.type === "update_flow") return "stroke-emerald-500";
  }
  if (edge.flow > 0 && edge.flow >= edge.capacity) return "stroke-red-500";
  if (edge.flow > 0) return "stroke-emerald-500";
  return "stroke-gray-300";
}

function getEdgeLabelBg(
  edgeIdx: number,
  edge: Edge,
  step: Step
): string {
  if (step.highlightEdges.includes(edgeIdx)) {
    if (step.type === "find_path") return "bg-amber-50";
    if (step.type === "augment") return "bg-blue-50";
    if (step.type === "update_flow") return "bg-emerald-50";
  }
  return "bg-white";
}

// --- Node color ---

function getNodeColor(
  nodeIdx: number,
  step: Step
): { fill: string; stroke: string } {
  if (step.highlightNodes.includes(nodeIdx)) {
    if (step.type === "init")
      return { fill: "fill-blue-100", stroke: "stroke-blue-400" };
    if (step.type === "find_path")
      return { fill: "fill-amber-50", stroke: "stroke-amber-400" };
    if (step.type === "augment" || step.type === "update_flow")
      return { fill: "fill-emerald-100", stroke: "stroke-emerald-500" };
  }
  return { fill: "fill-white", stroke: "stroke-gray-300" };
}

// --- Arrow marker ---

function computeEdgePath(from: number, to: number) {
  const s = NODE_POSITIONS[from];
  const t = NODE_POSITIONS[to];
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const r = 22;
  const sx = s.x + (dx / len) * r;
  const sy = s.y + (dy / len) * r;
  const tx = t.x - (dx / len) * r;
  const ty = t.y - (dy / len) * r;
  return { sx, sy, tx, ty, mx: (sx + tx) / 2, my: (sy + ty) / 2 };
}

// --- Component ---

export default function FordFulkersonAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    const graph = createDefaultGraph();
    setSteps(generateSteps(graph));
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
    timerRef.current = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 1000);
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
        <h1 className="text-2xl font-bold mb-1">Ford-Fulkerson</h1>
        <p className="text-sm text-muted-foreground mb-6">
          増加パスを繰り返し探索して最大フローを求めるアルゴリズム
        </p>

        {/* Graph SVG */}
        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 580 400" className="w-full h-auto">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
              </marker>
              <marker
                id="arrowhead-amber"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
              </marker>
              <marker
                id="arrowhead-blue"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#60a5fa" />
              </marker>
              <marker
                id="arrowhead-green"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
              </marker>
              <marker
                id="arrowhead-red"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
              </marker>
            </defs>

            {/* Edges */}
            {step.graph.edges.map((edge, idx) => {
              const { sx, sy, tx, ty, mx, my } = computeEdgePath(
                edge.from,
                edge.to
              );
              const color = getEdgeColor(idx, edge, step);
              const labelBg = getEdgeLabelBg(idx, edge, step);
              let markerEnd = "url(#arrowhead)";
              if (color === "stroke-amber-400")
                markerEnd = "url(#arrowhead-amber)";
              if (color === "stroke-blue-400")
                markerEnd = "url(#arrowhead-blue)";
              if (color === "stroke-emerald-500")
                markerEnd = "url(#arrowhead-green)";
              if (color === "stroke-red-500")
                markerEnd = "url(#arrowhead-red)";

              return (
                <g key={idx}>
                  <line
                    x1={sx}
                    y1={sy}
                    x2={tx}
                    y2={ty}
                    className={`${color} transition-colors`}
                    strokeWidth={step.highlightEdges.includes(idx) ? 3 : 2}
                    markerEnd={markerEnd}
                  />
                  <foreignObject
                    x={mx - 24}
                    y={my - 12}
                    width={48}
                    height={24}
                  >
                    <div
                      className={`text-xs font-mono text-center ${labelBg} rounded px-1`}
                    >
                      {edge.flow}/{edge.capacity}
                    </div>
                  </foreignObject>
                </g>
              );
            })}

            {/* Nodes */}
            {step.graph.nodes.map((nodeIdx) => {
              const pos = NODE_POSITIONS[nodeIdx];
              const { fill, stroke } = getNodeColor(nodeIdx, step);
              return (
                <g key={nodeIdx}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={22}
                    className={`${fill} ${stroke} transition-colors`}
                    strokeWidth={2}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 5}
                    textAnchor="middle"
                    className="text-sm font-semibold fill-foreground"
                  >
                    {NODE_LABELS[nodeIdx]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            合計フロー ={" "}
            <span className="font-mono font-semibold text-foreground">
              {step.totalFlow}
            </span>
          </span>
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" />
            <span>処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>増加パス</span>
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
