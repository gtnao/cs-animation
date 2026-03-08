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
  | "consider_edge"
  | "accept_edge"
  | "reject_edge"
  | "done";

interface Step {
  type: StepType;
  edgeIndex: number;
  sortedEdges: Edge[];
  mstEdges: Set<number>;
  rejectedEdges: Set<number>;
  parent: number[];
  description: string;
}

// --- Union-Find ---

function ufFind(parent: number[], x: number): number {
  while (parent[x] !== x) {
    parent[x] = parent[parent[x]];
    x = parent[x];
  }
  return x;
}

function ufUnion(parent: number[], rank: number[], a: number, b: number): boolean {
  const ra = ufFind(parent, a);
  const rb = ufFind(parent, b);
  if (ra === rb) return false;
  if (rank[ra] < rank[rb]) {
    parent[ra] = rb;
  } else if (rank[ra] > rank[rb]) {
    parent[rb] = ra;
  } else {
    parent[rb] = ra;
    rank[ra]++;
  }
  return true;
}

// --- Step generation ---

function generateSteps(graph: GraphInput): Step[] {
  const { nodeCount, edges } = graph;
  const steps: Step[] = [];

  const sorted = [...edges].sort((a, b) => a.w - b.w);
  const parent = Array.from({ length: nodeCount }, (_, i) => i);
  const rank = new Array(nodeCount).fill(0);
  const mstEdges = new Set<number>();
  const rejectedEdges = new Set<number>();

  steps.push({
    type: "init",
    edgeIndex: -1,
    sortedEdges: sorted,
    mstEdges: new Set(mstEdges),
    rejectedEdges: new Set(rejectedEdges),
    parent: [...parent],
    description: `辺を重みの昇順にソート。${sorted.length} 本の辺を順に処理する。`,
  });

  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];

    steps.push({
      type: "consider_edge",
      edgeIndex: i,
      sortedEdges: sorted,
      mstEdges: new Set(mstEdges),
      rejectedEdges: new Set(rejectedEdges),
      parent: [...parent],
      description: `辺 (${e.u}, ${e.v}) 重み ${e.w} を検討中。`,
    });

    const parentCopy = [...parent];
    const rankCopy = [...rank];
    if (ufUnion(parentCopy, rankCopy, e.u, e.v)) {
      // Accept
      for (let j = 0; j < nodeCount; j++) {
        parent[j] = parentCopy[j];
        rank[j] = rankCopy[j];
      }
      mstEdges.add(i);
      steps.push({
        type: "accept_edge",
        edgeIndex: i,
        sortedEdges: sorted,
        mstEdges: new Set(mstEdges),
        rejectedEdges: new Set(rejectedEdges),
        parent: [...parent],
        description: `辺 (${e.u}, ${e.v}) 重み ${e.w} を採用。閉路を作らない。`,
      });
    } else {
      rejectedEdges.add(i);
      steps.push({
        type: "reject_edge",
        edgeIndex: i,
        sortedEdges: sorted,
        mstEdges: new Set(mstEdges),
        rejectedEdges: new Set(rejectedEdges),
        parent: [...parent],
        description: `辺 (${e.u}, ${e.v}) 重み ${e.w} を棄却。閉路が生じる。`,
      });
    }
  }

  const totalWeight = sorted
    .filter((_, i) => mstEdges.has(i))
    .reduce((s, e) => s + e.w, 0);

  steps.push({
    type: "done",
    edgeIndex: sorted.length,
    sortedEdges: sorted,
    mstEdges: new Set(mstEdges),
    rejectedEdges: new Set(rejectedEdges),
    parent: [...parent],
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

// --- Node positions ---

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

export default function KruskalAnimationPage() {
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

  const getEdgeColor = (edgeIdx: number) => {
    if (step.mstEdges.has(edgeIdx)) return "stroke-emerald-500";
    if (step.rejectedEdges.has(edgeIdx)) return "stroke-red-400";
    if (edgeIdx === step.edgeIndex && step.type === "consider_edge")
      return "stroke-blue-400";
    return "stroke-gray-300";
  };

  const getEdgeWidth = (edgeIdx: number) => {
    if (step.mstEdges.has(edgeIdx)) return 3;
    if (edgeIdx === step.edgeIndex && step.type === "consider_edge") return 3;
    return 1.5;
  };

  const getNodeFill = (nodeIdx: number) => {
    if (step.type === "consider_edge" && step.edgeIndex >= 0) {
      const e = step.sortedEdges[step.edgeIndex];
      if (nodeIdx === e.u || nodeIdx === e.v) return "fill-blue-100";
    }
    return "fill-white";
  };

  const getNodeStroke = (nodeIdx: number) => {
    if (step.type === "consider_edge" && step.edgeIndex >= 0) {
      const e = step.sortedEdges[step.edgeIndex];
      if (nodeIdx === e.u || nodeIdx === e.v) return "stroke-blue-400";
    }
    return "stroke-gray-300";
  };

  return (
    <>
{/* Graph SVG */}
        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 600 400" className="w-full h-auto max-h-[400px]">
            {/* Edges */}
            {step.sortedEdges.map((e, idx) => {
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
            {/* Nodes */}
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

        {/* Edge list */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            辺リスト (重み昇順)
          </div>
          <div className="flex flex-wrap gap-1">
            {step.sortedEdges.map((e, idx) => {
              let cls =
                "px-2 py-1 text-xs font-mono border rounded transition-colors";
              if (step.mstEdges.has(idx)) {
                cls += " bg-emerald-100 border-emerald-500";
              } else if (step.rejectedEdges.has(idx)) {
                cls += " bg-red-100 border-red-500 line-through";
              } else if (idx === step.edgeIndex && step.type === "consider_edge") {
                cls += " bg-blue-100 border-blue-400";
              } else {
                cls += " bg-white border-gray-200";
              }
              return (
                <span key={idx} className={cls}>
                  ({e.u},{e.v}):{e.w}
                </span>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
          <span>
            MST辺数:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.mstEdges.size}
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
            <span>検討中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>MST辺</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>棄却</span>
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
