"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface Edge {
  u: number;
  v: number;
  w: number;
}

interface GraphInput {
  nodeCount: number;
  edges: Edge[];
}

type StepType =
  | "init"
  | "add_vertex"
  | "consider_edge"
  | "select_min"
  | "done";

interface Step {
  type: StepType;
  currentNode: number;
  inMST: Set<number>;
  mstEdges: number[];
  candidateEdges: { edge: Edge; idx: number }[];
  highlightEdge: number;
  description: string;
}

// --- Step generation ---

function generateSteps(graph: GraphInput): Step[] {
  const { nodeCount, edges } = graph;
  const steps: Step[] = [];
  const adj: { to: number; w: number; idx: number }[][] = Array.from(
    { length: nodeCount },
    () => []
  );
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    adj[e.u].push({ to: e.v, w: e.w, idx: i });
    adj[e.v].push({ to: e.u, w: e.w, idx: i });
  }

  const inMST = new Set<number>();
  const mstEdges: number[] = [];
  // Priority queue simulation using array
  let candidates: { edge: Edge; idx: number; from: number }[] = [];

  // Start from vertex 0
  inMST.add(0);
  steps.push({
    type: "init",
    currentNode: 0,
    inMST: new Set(inMST),
    mstEdges: [...mstEdges],
    candidateEdges: [],
    highlightEdge: -1,
    description: "頂点 0 からスタート。MST に追加。",
  });

  // Add edges from vertex 0
  for (const neighbor of adj[0]) {
    candidates.push({
      edge: edges[neighbor.idx],
      idx: neighbor.idx,
      from: 0,
    });
  }

  steps.push({
    type: "add_vertex",
    currentNode: 0,
    inMST: new Set(inMST),
    mstEdges: [...mstEdges],
    candidateEdges: candidates.map((c) => ({ edge: c.edge, idx: c.idx })),
    highlightEdge: -1,
    description: `頂点 0 の隣接辺 ${candidates.length} 本を候補に追加。`,
  });

  while (candidates.length > 0 && inMST.size < nodeCount) {
    // Sort to find min
    candidates.sort((a, b) => a.edge.w - b.edge.w);

    // Find minimum edge that connects to a new vertex
    let minIdx = -1;
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const other =
        inMST.has(c.edge.u) ? c.edge.v : c.edge.u;
      if (!inMST.has(other)) {
        minIdx = i;
        break;
      }
    }

    if (minIdx === -1) break;

    const chosen = candidates[minIdx];
    const newNode = inMST.has(chosen.edge.u)
      ? chosen.edge.v
      : chosen.edge.u;

    steps.push({
      type: "select_min",
      currentNode: newNode,
      inMST: new Set(inMST),
      mstEdges: [...mstEdges],
      candidateEdges: candidates.map((c) => ({ edge: c.edge, idx: c.idx })),
      highlightEdge: chosen.idx,
      description: `最小重み辺 (${chosen.edge.u}, ${chosen.edge.v}) 重み ${chosen.edge.w} を選択。頂点 ${newNode} を MST に追加。`,
    });

    inMST.add(newNode);
    mstEdges.push(chosen.idx);

    // Remove used edge and add new candidates
    candidates = candidates.filter((_, i) => i !== minIdx);
    // Remove edges that now connect two MST vertices
    candidates = candidates.filter((c) => {
      return !(inMST.has(c.edge.u) && inMST.has(c.edge.v));
    });

    // Add edges from new vertex
    for (const neighbor of adj[newNode]) {
      if (!inMST.has(neighbor.to)) {
        candidates.push({
          edge: edges[neighbor.idx],
          idx: neighbor.idx,
          from: newNode,
        });
      }
    }

    steps.push({
      type: "add_vertex",
      currentNode: newNode,
      inMST: new Set(inMST),
      mstEdges: [...mstEdges],
      candidateEdges: candidates.map((c) => ({ edge: c.edge, idx: c.idx })),
      highlightEdge: -1,
      description: `頂点 ${newNode} の隣接辺を候補に追加。候補数: ${candidates.length}。`,
    });
  }

  const totalWeight = mstEdges.reduce((s, idx) => s + edges[idx].w, 0);
  steps.push({
    type: "done",
    currentNode: -1,
    inMST: new Set(inMST),
    mstEdges: [...mstEdges],
    candidateEdges: [],
    highlightEdge: -1,
    description: `完了。MST の総重み = ${totalWeight}。`,
  });

  return steps;
}

// --- Default graph ---

const DEFAULT_GRAPH: GraphInput = {
  nodeCount: 6,
  edges: [
    { u: 0, v: 1, w: 4 },
    { u: 0, v: 2, w: 2 },
    { u: 1, v: 2, w: 1 },
    { u: 1, v: 3, w: 5 },
    { u: 2, v: 3, w: 8 },
    { u: 2, v: 4, w: 10 },
    { u: 3, v: 4, w: 2 },
    { u: 3, v: 5, w: 6 },
    { u: 4, v: 5, w: 3 },
  ],
};

function getNodePositions(n: number): { x: number; y: number }[] {
  const cx = 300;
  const cy = 200;
  const r = 140;
  return Array.from({ length: n }, (_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
  }));
}

// --- Component ---

export default function PrimAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const graph = DEFAULT_GRAPH;
  const positions = getNodePositions(graph.nodeCount);

  const run = useCallback(() => {
    setSteps(generateSteps(graph));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [graph]);

  useEffect(() => {
    run();
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
    }, 800);
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

  const mstEdgeSet = new Set(step.mstEdges);
  const candidateEdgeSet = new Set(step.candidateEdges.map((c) => c.idx));

  const getEdgeColor = (edgeIdx: number) => {
    if (mstEdgeSet.has(edgeIdx)) return "stroke-emerald-500";
    if (edgeIdx === step.highlightEdge) return "stroke-blue-400";
    if (candidateEdgeSet.has(edgeIdx)) return "stroke-amber-400";
    return "stroke-gray-300";
  };

  const getEdgeWidth = (edgeIdx: number) => {
    if (mstEdgeSet.has(edgeIdx)) return 3;
    if (edgeIdx === step.highlightEdge) return 3;
    return 1.5;
  };

  const getNodeFill = (nodeIdx: number) => {
    if (nodeIdx === step.currentNode && step.type !== "done")
      return "fill-blue-100";
    if (step.inMST.has(nodeIdx)) return "fill-emerald-100";
    return "fill-white";
  };

  const getNodeStroke = (nodeIdx: number) => {
    if (nodeIdx === step.currentNode && step.type !== "done")
      return "stroke-blue-400";
    if (step.inMST.has(nodeIdx)) return "stroke-emerald-500";
    return "stroke-gray-300";
  };

  return (
    <>
{/* Graph SVG */}
        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 600 400" className="w-full h-auto max-h-[400px]">
            {graph.edges.map((e, idx) => {
              const p1 = positions[e.u];
              const p2 = positions[e.v];
              const mx = (p1.x + p2.x) / 2;
              const my = (p1.y + p2.y) / 2;
              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    className={getEdgeColor(idx)}
                    strokeWidth={getEdgeWidth(idx)}
                  />
                  <text
                    x={mx}
                    y={my - 6}
                    textAnchor="middle"
                    className="fill-foreground text-xs font-mono"
                  >
                    {e.w}
                  </text>
                </g>
              );
            })}
            {positions.map((pos, idx) => (
              <g key={`node-${idx}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={20}
                  className={`${getNodeFill(idx)} ${getNodeStroke(idx)}`}
                  strokeWidth={2}
                />
                <text
                  x={pos.x}
                  y={pos.y + 5}
                  textAnchor="middle"
                  className="fill-foreground text-sm font-semibold"
                >
                  {idx}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
          <span>
            MST頂点数:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.inMST.size}
            </span>
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
            <span>処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>候補辺</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>MST確定</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200" />
            <span>未処理</span>
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
    </>
  );
}
