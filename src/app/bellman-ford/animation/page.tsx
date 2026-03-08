"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface GraphNode {
  id: number;
  x: number;
  y: number;
}

interface GraphEdge {
  from: number;
  to: number;
  weight: number;
}

interface Step {
  type: "init" | "start_iter" | "relax" | "no_relax" | "negative_cycle_check" | "done";
  iteration: number;
  edgeIndex: number;
  dist: number[];
  updated: boolean;
  highlightEdge?: [number, number];
  hasNegativeCycle?: boolean;
  description: string;
}

const INF = 999999;

// --- Default graph (directed, with some negative weights) ---

const defaultNodes: GraphNode[] = [
  { id: 0, x: 80, y: 160 },
  { id: 1, x: 220, y: 60 },
  { id: 2, x: 220, y: 260 },
  { id: 3, x: 380, y: 60 },
  { id: 4, x: 380, y: 260 },
  { id: 5, x: 500, y: 160 },
];

const defaultEdges: GraphEdge[] = [
  { from: 0, to: 1, weight: 4 },
  { from: 0, to: 2, weight: 3 },
  { from: 1, to: 3, weight: 2 },
  { from: 1, to: 2, weight: -1 },
  { from: 2, to: 4, weight: 4 },
  { from: 3, to: 5, weight: 1 },
  { from: 3, to: 4, weight: -2 },
  { from: 4, to: 5, weight: 2 },
];

// --- Step generation ---

function generateSteps(
  nodes: GraphNode[],
  edges: GraphEdge[],
  start: number
): Step[] {
  const n = nodes.length;
  const steps: Step[] = [];
  const dist = new Array(n).fill(INF);
  dist[start] = 0;

  steps.push({
    type: "init",
    iteration: 0,
    edgeIndex: -1,
    dist: [...dist],
    updated: false,
    description: `始点 ${start} の距離を 0 に設定。他は ∞。`,
  });

  for (let i = 0; i < n - 1; i++) {
    let updated = false;

    steps.push({
      type: "start_iter",
      iteration: i + 1,
      edgeIndex: -1,
      dist: [...dist],
      updated: false,
      description: `イテレーション ${i + 1} / ${n - 1} 開始`,
    });

    for (let j = 0; j < edges.length; j++) {
      const { from: u, to: v, weight: w } = edges[j];
      if (dist[u] < INF && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        updated = true;
        steps.push({
          type: "relax",
          iteration: i + 1,
          edgeIndex: j,
          dist: [...dist],
          updated: true,
          highlightEdge: [u, v],
          description: `辺 (${u}→${v}, w=${w}): dist[${v}] = ${dist[u] - w} + ${w} = ${dist[v]} に更新`,
        });
      } else {
        steps.push({
          type: "no_relax",
          iteration: i + 1,
          edgeIndex: j,
          dist: [...dist],
          updated: false,
          highlightEdge: [u, v],
          description:
            dist[u] >= INF
              ? `辺 (${u}→${v}, w=${w}): dist[${u}] = ∞ のため緩和不可`
              : `辺 (${u}→${v}, w=${w}): dist[${u}] + ${w} = ${dist[u] + w} >= ${dist[v]}（更新なし）`,
        });
      }
    }

    if (!updated) {
      steps.push({
        type: "done",
        iteration: i + 1,
        edgeIndex: -1,
        dist: [...dist],
        updated: false,
        hasNegativeCycle: false,
        description: `イテレーション ${i + 1} で更新なし。早期終了。`,
      });
      return steps;
    }
  }

  // Negative cycle check
  let hasNegCycle = false;
  for (let j = 0; j < edges.length; j++) {
    const { from: u, to: v, weight: w } = edges[j];
    if (dist[u] < INF && dist[u] + w < dist[v]) {
      hasNegCycle = true;
      break;
    }
  }

  steps.push({
    type: "negative_cycle_check",
    iteration: n,
    edgeIndex: -1,
    dist: [...dist],
    updated: false,
    hasNegativeCycle: hasNegCycle,
    description: hasNegCycle
      ? "負の閉路が検出されました！"
      : "負の閉路は存在しません。",
  });

  steps.push({
    type: "done",
    iteration: n,
    edgeIndex: -1,
    dist: [...dist],
    updated: false,
    hasNegativeCycle: hasNegCycle,
    description: "Bellman-Ford法 完了。",
  });

  return steps;
}

// --- Node color ---

function getNodeColor(
  nodeId: number,
  step: Step
): { fill: string; stroke: string } {
  if (
    step.highlightEdge &&
    step.highlightEdge[0] === nodeId &&
    step.type !== "done"
  ) {
    return { fill: "#dbeafe", stroke: "#60a5fa" }; // blue - source of edge
  }
  if (
    step.highlightEdge &&
    step.highlightEdge[1] === nodeId &&
    step.type === "relax"
  ) {
    return { fill: "#d1fae5", stroke: "#10b981" }; // green - relaxed
  }
  if (step.dist[nodeId] < INF) {
    return { fill: "#fffbeb", stroke: "#fbbf24" }; // amber - discovered
  }
  return { fill: "#ffffff", stroke: "#e5e7eb" }; // white
}

// --- Edge color ---

function getEdgeColor(from: number, to: number, step: Step): string {
  if (
    step.highlightEdge &&
    step.highlightEdge[0] === from &&
    step.highlightEdge[1] === to
  ) {
    if (step.type === "relax") return "#10b981"; // green
    if (step.type === "no_relax") return "#ef4444"; // red
  }
  return "#d1d5db";
}

// --- Arrow marker ---

function edgeMidpoint(
  from: GraphNode,
  to: GraphNode,
  offset: number = 0.6
): { x: number; y: number } {
  return {
    x: from.x + (to.x - from.x) * offset,
    y: from.y + (to.y - from.y) * offset,
  };
}

// --- Component ---

export default function BellmanFordAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nodes] = useState<GraphNode[]>(defaultNodes);
  const [edges] = useState<GraphEdge[]>(defaultEdges);
  const [startNode, setStartNode] = useState(0);

  const run = useCallback(
    (s: number) => {
      setSteps(generateSteps(nodes, edges, s));
      setCurrentStep(0);
      setIsPlaying(false);
    },
    [nodes, edges]
  );

  useEffect(() => {
    run(startNode);
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
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
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
    <>
<div className="flex gap-2 mb-8 items-center">
          <span className="text-sm text-muted-foreground">始点:</span>
          <select
            value={startNode}
            onChange={(e) => {
              const s = Number(e.target.value);
              setStartNode(s);
              run(s);
            }}
            className="border border-border rounded px-2 py-1 text-sm"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.id}
              </option>
            ))}
          </select>
        </div>

        {/* Graph */}
        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 580 320" className="w-full max-w-2xl mx-auto">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
              </marker>
              <marker
                id="arrowhead-green"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
              </marker>
              <marker
                id="arrowhead-red"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
              </marker>
            </defs>
            {/* Edges */}
            {edges.map((e, i) => {
              const from = nodes[e.from];
              const to = nodes[e.to];
              const color = getEdgeColor(e.from, e.to, step);
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const ux = dx / len;
              const uy = dy / len;
              const x1 = from.x + ux * 24;
              const y1 = from.y + uy * 24;
              const x2 = to.x - ux * 24;
              const y2 = to.y - uy * 24;
              const mid = edgeMidpoint(from, to, 0.5);
              const nx = -uy * 14;
              const ny = ux * 14;
              let markerEnd = "url(#arrowhead)";
              if (color === "#10b981") markerEnd = "url(#arrowhead-green)";
              if (color === "#ef4444") markerEnd = "url(#arrowhead-red)";
              return (
                <g key={i}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={2}
                    markerEnd={markerEnd}
                  />
                  <text
                    x={mid.x + nx}
                    y={mid.y + ny}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-xs font-mono"
                    fill={e.weight < 0 ? "#dc2626" : "#6b7280"}
                  >
                    {e.weight}
                  </text>
                </g>
              );
            })}
            {/* Nodes */}
            {nodes.map((n) => {
              const { fill, stroke } = getNodeColor(n.id, step);
              return (
                <g key={n.id}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={22}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={2}
                  />
                  <text
                    x={n.x}
                    y={n.y + 5}
                    textAnchor="middle"
                    className="text-sm font-mono font-bold"
                    fill="#374151"
                  >
                    {n.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Distance table */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            距離テーブル
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.dist.map((d, idx) => {
              let cls =
                "w-14 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              if (d < INF) {
                cls += " bg-white border-gray-300";
              } else {
                cls += " bg-gray-50 border-gray-200 text-muted-foreground";
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {idx}
                  </div>
                  <div className={cls}>{d < INF ? d : "∞"}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Iteration info */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.iteration > 0 && (
            <span>
              イテレーション:{" "}
              <span className="font-mono font-semibold text-foreground">
                {step.iteration}
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" />
            <span>辺の始点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>緩和成功</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>到達済み</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200 rounded-full" />
            <span>未到達</span>
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
