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
  type: "init" | "extract" | "relax" | "relax_skip" | "done";
  current: number;
  dist: number[];
  confirmed: boolean[];
  highlightEdge?: [number, number];
  pqContents: [number, number][]; // [dist, vertex]
  description: string;
}

const INF = 999999;

// --- Default graph ---

const defaultNodes: GraphNode[] = [
  { id: 0, x: 80, y: 160 },
  { id: 1, x: 220, y: 60 },
  { id: 2, x: 220, y: 260 },
  { id: 3, x: 360, y: 60 },
  { id: 4, x: 360, y: 260 },
  { id: 5, x: 480, y: 160 },
];

const defaultEdges: GraphEdge[] = [
  { from: 0, to: 1, weight: 4 },
  { from: 0, to: 2, weight: 2 },
  { from: 1, to: 2, weight: 1 },
  { from: 1, to: 3, weight: 5 },
  { from: 2, to: 4, weight: 8 },
  { from: 2, to: 3, weight: 2 },
  { from: 3, to: 5, weight: 6 },
  { from: 4, to: 5, weight: 1 },
  { from: 3, to: 4, weight: 1 },
];

function buildAdjacency(
  nodes: GraphNode[],
  edges: GraphEdge[]
): [number, number][][] {
  const adj: [number, number][][] = nodes.map(() => []);
  for (const e of edges) {
    adj[e.from].push([e.to, e.weight]);
    adj[e.to].push([e.from, e.weight]);
  }
  return adj;
}

// --- Step generation ---

function generateSteps(
  nodes: GraphNode[],
  edges: GraphEdge[],
  start: number
): Step[] {
  const n = nodes.length;
  const adj = buildAdjacency(nodes, edges);
  const steps: Step[] = [];
  const dist = new Array(n).fill(INF);
  const confirmed = new Array(n).fill(false);

  // Simple priority queue simulation
  const pq: [number, number][] = []; // [dist, vertex]

  dist[start] = 0;
  pq.push([0, start]);

  steps.push({
    type: "init",
    current: -1,
    dist: [...dist],
    confirmed: [...confirmed],
    pqContents: [...pq],
    description: `始点 ${start} の距離を 0 に設定。優先度付きキューに追加。`,
  });

  while (pq.length > 0) {
    // Find min
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift()!;

    if (d > dist[u]) {
      continue; // outdated
    }

    confirmed[u] = true;

    steps.push({
      type: "extract",
      current: u,
      dist: [...dist],
      confirmed: [...confirmed],
      pqContents: [...pq],
      description: `頂点 ${u} を取り出し、距離 ${dist[u]} を確定`,
    });

    for (const [v, w] of adj[u]) {
      if (confirmed[v]) continue;
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        pq.push([dist[v], v]);

        steps.push({
          type: "relax",
          current: u,
          dist: [...dist],
          confirmed: [...confirmed],
          highlightEdge: [u, v],
          pqContents: [...pq],
          description: `辺 (${u}, ${v}) で緩和: dist[${v}] = ${dist[u]} + ${w} = ${dist[v]}`,
        });
      } else {
        steps.push({
          type: "relax_skip",
          current: u,
          dist: [...dist],
          confirmed: [...confirmed],
          highlightEdge: [u, v],
          pqContents: [...pq],
          description: `辺 (${u}, ${v}): dist[${u}] + ${w} = ${dist[u] + w} >= dist[${v}] = ${dist[v]}（更新なし）`,
        });
      }
    }
  }

  steps.push({
    type: "done",
    current: -1,
    dist: [...dist],
    confirmed: [...confirmed],
    pqContents: [],
    description:
      "Dijkstra法 完了。全ての到達可能な頂点の最短距離が確定しました。",
  });

  return steps;
}

// --- Node color ---

function getNodeColor(
  nodeId: number,
  step: Step
): { fill: string; stroke: string } {
  if (nodeId === step.current && step.type !== "done") {
    return { fill: "#dbeafe", stroke: "#60a5fa" }; // blue - current
  }
  if (step.confirmed[nodeId]) {
    return { fill: "#d1fae5", stroke: "#10b981" }; // green - confirmed
  }
  if (step.dist[nodeId] < INF) {
    return { fill: "#fffbeb", stroke: "#fbbf24" }; // amber - discovered
  }
  return { fill: "#ffffff", stroke: "#e5e7eb" }; // white - undiscovered
}

// --- Edge color ---

function getEdgeColor(from: number, to: number, step: Step): string {
  if (
    step.highlightEdge &&
    ((step.highlightEdge[0] === from && step.highlightEdge[1] === to) ||
      (step.highlightEdge[0] === to && step.highlightEdge[1] === from))
  ) {
    if (step.type === "relax") return "#10b981"; // green
    if (step.type === "relax_skip") return "#ef4444"; // red
  }
  return "#d1d5db"; // gray
}

// --- Edge midpoint for label ---

function edgeMidpoint(
  from: GraphNode,
  to: GraphNode
): { x: number; y: number } {
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
}

// --- Component ---

export default function DijkstraAnimationPage() {
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

  // Auto-advance
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 700);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, steps.length]);

  // Keyboard shortcuts
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Dijkstra法</h1>
        <p className="text-sm text-muted-foreground mb-6">
          非負重みグラフにおける単一始点最短経路アルゴリズム
        </p>

        {/* Start node selector */}
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

        {/* Graph visualization */}
        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 560 320" className="w-full max-w-2xl mx-auto">
            {/* Edges */}
            {edges.map((e, i) => {
              const from = nodes[e.from];
              const to = nodes[e.to];
              const color = getEdgeColor(e.from, e.to, step);
              const mid = edgeMidpoint(from, to);
              // Offset label slightly
              const dx = to.y - from.y;
              const dy = from.x - to.x;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const ox = (dx / len) * 12;
              const oy = (dy / len) * 12;
              return (
                <g key={i}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={color}
                    strokeWidth={2}
                  />
                  <text
                    x={mid.x + ox}
                    y={mid.y + oy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-xs font-mono"
                    fill="#6b7280"
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
              const isCurrent = idx === step.current && step.type !== "done";
              const isConfirmed = step.confirmed[idx];
              let cls =
                "w-14 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              if (isCurrent) {
                cls += " bg-blue-100 border-blue-400 font-bold";
              } else if (isConfirmed) {
                cls += " bg-emerald-100 border-emerald-500";
              } else if (d < INF) {
                cls += " bg-amber-50 border-amber-400";
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

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
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
            <span>発見済み (未確定)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>確定</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200 rounded-full" />
            <span>未発見</span>
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
