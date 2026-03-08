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
  | "start_phase"
  | "select_cheapest"
  | "merge_components"
  | "done";

interface Step {
  type: StepType;
  phase: number;
  componentOf: number[];
  mstEdges: Set<number>;
  cheapestEdge: Map<number, number>;
  highlightEdge: number;
  componentCount: number;
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
  const parent = Array.from({ length: nodeCount }, (_, i) => i);
  const rank = new Array(nodeCount).fill(0);
  const mstEdges = new Set<number>();

  const getComponentOf = () => {
    const comp = new Array(nodeCount);
    for (let i = 0; i < nodeCount; i++) {
      comp[i] = ufFind(parent, i);
    }
    return comp;
  };

  const countComponents = () => {
    const roots = new Set<number>();
    for (let i = 0; i < nodeCount; i++) {
      roots.add(ufFind(parent, i));
    }
    return roots.size;
  };

  steps.push({
    type: "init",
    phase: 0,
    componentOf: getComponentOf(),
    mstEdges: new Set(mstEdges),
    cheapestEdge: new Map(),
    highlightEdge: -1,
    componentCount: nodeCount,
    description: `初期状態: ${nodeCount} 個の連結成分 (各頂点が独立)。`,
  });

  let phase = 0;
  let numComponents = nodeCount;

  while (numComponents > 1) {
    phase++;
    steps.push({
      type: "start_phase",
      phase,
      componentOf: getComponentOf(),
      mstEdges: new Set(mstEdges),
      cheapestEdge: new Map(),
      highlightEdge: -1,
      componentCount: numComponents,
      description: `フェーズ ${phase} 開始。連結成分数: ${numComponents}。`,
    });

    // Find cheapest edge for each component
    const cheapest = new Map<number, number>();
    for (let i = 0; i < edges.length; i++) {
      if (mstEdges.has(i)) continue;
      const e = edges[i];
      const cu = ufFind(parent, e.u);
      const cv = ufFind(parent, e.v);
      if (cu === cv) continue;

      if (!cheapest.has(cu) || edges[cheapest.get(cu)!].w > e.w) {
        cheapest.set(cu, i);
      }
      if (!cheapest.has(cv) || edges[cheapest.get(cv)!].w > e.w) {
        cheapest.set(cv, i);
      }
    }

    steps.push({
      type: "select_cheapest",
      phase,
      componentOf: getComponentOf(),
      mstEdges: new Set(mstEdges),
      cheapestEdge: new Map(cheapest),
      highlightEdge: -1,
      componentCount: numComponents,
      description: `各成分の最小重み辺を選択。${cheapest.size} 個の成分が辺を持つ。`,
    });

    // Merge components
    const addedInPhase: number[] = [];
    for (const [, edgeIdx] of cheapest) {
      const e = edges[edgeIdx];
      if (ufUnion(parent, rank, e.u, e.v)) {
        mstEdges.add(edgeIdx);
        addedInPhase.push(edgeIdx);
      }
    }

    numComponents = countComponents();

    steps.push({
      type: "merge_components",
      phase,
      componentOf: getComponentOf(),
      mstEdges: new Set(mstEdges),
      cheapestEdge: new Map(cheapest),
      highlightEdge: -1,
      componentCount: numComponents,
      description: `${addedInPhase.length} 本の辺を MST に追加。連結成分数: ${numComponents}。`,
    });

    if (cheapest.size === 0) break;
  }

  const totalWeight = Array.from(mstEdges).reduce(
    (s, idx) => s + edges[idx].w,
    0
  );
  steps.push({
    type: "done",
    phase,
    componentOf: getComponentOf(),
    mstEdges: new Set(mstEdges),
    cheapestEdge: new Map(),
    highlightEdge: -1,
    componentCount: 1,
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

// Color palette for components
const COMPONENT_COLORS = [
  { fill: "fill-blue-100", stroke: "stroke-blue-400" },
  { fill: "fill-amber-100", stroke: "stroke-amber-400" },
  { fill: "fill-emerald-100", stroke: "stroke-emerald-400" },
  { fill: "fill-red-100", stroke: "stroke-red-400" },
  { fill: "fill-purple-100", stroke: "stroke-purple-400" },
  { fill: "fill-pink-100", stroke: "stroke-pink-400" },
];

export default function BoruvkaAnimationPage() {
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

  // Map component roots to color indices
  const rootSet = Array.from(new Set(step.componentOf));
  const rootToColor = new Map<number, number>();
  rootSet.forEach((r, i) => rootToColor.set(r, i % COMPONENT_COLORS.length));

  const cheapestEdgeSet = new Set(step.cheapestEdge.values());

  const getEdgeColor = (edgeIdx: number) => {
    if (step.mstEdges.has(edgeIdx)) return "stroke-emerald-500";
    if (cheapestEdgeSet.has(edgeIdx)) return "stroke-blue-400";
    return "stroke-gray-300";
  };

  const getEdgeWidth = (edgeIdx: number) => {
    if (step.mstEdges.has(edgeIdx)) return 3;
    if (cheapestEdgeSet.has(edgeIdx)) return 3;
    return 1.5;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Borůvka法</h1>
        <p className="text-sm text-muted-foreground mb-6">
          各連結成分から最小重み辺を同時に選ぶ最小全域木アルゴリズム
        </p>

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
            {positions.map((pos, idx) => {
              const comp = step.componentOf[idx];
              const colorIdx = rootToColor.get(comp) ?? 0;
              const color = COMPONENT_COLORS[colorIdx];
              return (
                <g key={`node-${idx}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={20}
                    className={`${color.fill} ${color.stroke}`}
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
              );
            })}
          </svg>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
          <span>
            フェーズ:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.phase}
            </span>
          </span>
          <span>
            連結成分数:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.componentCount}
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
            <span>選択辺</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>MST辺</span>
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
      </div>
    </div>
  );
}
