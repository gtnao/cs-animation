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
  type:
    | "init"
    | "bf_start"
    | "bf_relax"
    | "bf_done"
    | "reweight"
    | "dijkstra_start"
    | "dijkstra_extract"
    | "dijkstra_relax"
    | "dijkstra_done"
    | "restore"
    | "done";
  h: number[];
  dist: number[][];
  currentSource?: number;
  currentNode?: number;
  highlightEdge?: [number, number];
  reweightedEdges?: { from: number; to: number; weight: number }[];
  description: string;
}

const INF = 999999;

// --- Default graph ---

const defaultNodes: GraphNode[] = [
  { id: 0, x: 100, y: 80 },
  { id: 1, x: 300, y: 80 },
  { id: 2, x: 400, y: 220 },
  { id: 3, x: 100, y: 220 },
];

const defaultEdges: GraphEdge[] = [
  { from: 0, to: 1, weight: 3 },
  { from: 0, to: 3, weight: 7 },
  { from: 1, to: 2, weight: 2 },
  { from: 2, to: 3, weight: -3 },
  { from: 3, to: 1, weight: 1 },
];

// --- Step generation ---

function generateSteps(nodes: GraphNode[], edges: GraphEdge[]): Step[] {
  const n = nodes.length;
  const steps: Step[] = [];
  const dist: number[][] = Array.from({ length: n }, () =>
    new Array(n).fill(INF)
  );
  for (let i = 0; i < n; i++) dist[i][i] = 0;

  // Step 1: Bellman-Ford from virtual vertex
  const h = new Array(n).fill(INF);
  // Virtual vertex has distance 0 to all
  for (let i = 0; i < n; i++) h[i] = 0;

  steps.push({
    type: "init",
    h: [...h],
    dist: dist.map((r) => [...r]),
    description:
      "仮想頂点 q から全頂点へ重み 0 の辺を追加。h を Bellman-Ford で計算開始。",
  });

  // Actually run BF from virtual vertex (which has edge 0 to all vertices)
  for (let i = 0; i < n; i++) h[i] = 0;

  // BF iterations
  for (let iter = 0; iter < n - 1; iter++) {
    let updated = false;
    for (const e of edges) {
      if (h[e.from] < INF && h[e.from] + e.weight < h[e.to]) {
        h[e.to] = h[e.from] + e.weight;
        updated = true;
        steps.push({
          type: "bf_relax",
          h: [...h],
          dist: dist.map((r) => [...r]),
          highlightEdge: [e.from, e.to],
          description: `BF: h[${e.to}] = h[${e.from}] + w(${e.from},${e.to}) = ${h[e.from]} + ${e.weight} = ${h[e.to]}`,
        });
      }
    }
    if (!updated) break;
  }

  steps.push({
    type: "bf_done",
    h: [...h],
    dist: dist.map((r) => [...r]),
    description: `Bellman-Ford 完了。h = [${h.join(", ")}]`,
  });

  // Step 3: Reweight
  const reweighted = edges.map((e) => ({
    from: e.from,
    to: e.to,
    weight: e.weight + h[e.from] - h[e.to],
  }));

  steps.push({
    type: "reweight",
    h: [...h],
    dist: dist.map((r) => [...r]),
    reweightedEdges: reweighted,
    description: `辺の重みを変換: w'(u,v) = w(u,v) + h[u] - h[v]。全ての辺の重みが非負になる。`,
  });

  // Build reweighted adjacency
  const adj: [number, number][][] = nodes.map(() => []);
  for (const e of reweighted) {
    adj[e.from].push([e.to, e.weight]);
  }

  // Step 4: Dijkstra from each vertex
  for (let s = 0; s < n; s++) {
    const d = new Array(n).fill(INF);
    d[s] = 0;
    const confirmed = new Array(n).fill(false);

    steps.push({
      type: "dijkstra_start",
      h: [...h],
      dist: dist.map((r) => [...r]),
      currentSource: s,
      description: `始点 ${s} から Dijkstra 開始`,
    });

    // Simple Dijkstra
    for (let iter = 0; iter < n; iter++) {
      let u = -1;
      let minD = INF;
      for (let v = 0; v < n; v++) {
        if (!confirmed[v] && d[v] < minD) {
          minD = d[v];
          u = v;
        }
      }
      if (u === -1) break;
      confirmed[u] = true;

      steps.push({
        type: "dijkstra_extract",
        h: [...h],
        dist: dist.map((r) => [...r]),
        currentSource: s,
        currentNode: u,
        description: `Dijkstra(${s}): 頂点 ${u} を確定 (d' = ${d[u]})`,
      });

      for (const [v, w] of adj[u]) {
        if (!confirmed[v] && d[u] + w < d[v]) {
          d[v] = d[u] + w;
          steps.push({
            type: "dijkstra_relax",
            h: [...h],
            dist: dist.map((r) => [...r]),
            currentSource: s,
            currentNode: u,
            highlightEdge: [u, v],
            description: `Dijkstra(${s}): d'[${v}] = ${d[u]} + ${w} = ${d[v]}`,
          });
        }
      }
    }

    // Restore distances
    for (let v = 0; v < n; v++) {
      if (d[v] < INF) {
        dist[s][v] = d[v] - h[s] + h[v];
      }
    }

    steps.push({
      type: "dijkstra_done",
      h: [...h],
      dist: dist.map((r) => [...r]),
      currentSource: s,
      description: `始点 ${s} の最短距離を復元完了: [${dist[s].map((x) => (x >= INF ? "∞" : x)).join(", ")}]`,
    });
  }

  steps.push({
    type: "done",
    h: [...h],
    dist: dist.map((r) => [...r]),
    description:
      "Johnson's Algorithm 完了。全頂点対間の最短距離が求まりました。",
  });

  return steps;
}

// --- Node color ---

function getNodeColor(
  nodeId: number,
  step: Step
): { fill: string; stroke: string } {
  if (nodeId === step.currentNode && step.type !== "done") {
    return { fill: "#dbeafe", stroke: "#60a5fa" };
  }
  if (nodeId === step.currentSource && step.type !== "done") {
    return { fill: "#fffbeb", stroke: "#fbbf24" };
  }
  return { fill: "#ffffff", stroke: "#e5e7eb" };
}

// --- Edge color ---

function getEdgeColor(from: number, to: number, step: Step): string {
  if (
    step.highlightEdge &&
    step.highlightEdge[0] === from &&
    step.highlightEdge[1] === to
  ) {
    if (step.type === "bf_relax" || step.type === "dijkstra_relax")
      return "#10b981";
  }
  return "#d1d5db";
}

// --- Component ---

export default function JohnsonAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nodes] = useState<GraphNode[]>(defaultNodes);
  const [edges] = useState<GraphEdge[]>(defaultEdges);

  const run = useCallback(() => {
    setSteps(generateSteps(nodes, edges));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [nodes, edges]);

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
    }, 700);
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

  const n = nodes.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Johnson&apos;s Algorithm</h1>
        <p className="text-sm text-muted-foreground mb-6">
          全頂点対間最短経路を効率的に求めるアルゴリズム
        </p>

        {/* Graph */}
        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 500 300" className="w-full max-w-lg mx-auto">
            <defs>
              <marker
                id="j-arrow"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
              </marker>
              <marker
                id="j-arrow-green"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
              </marker>
            </defs>
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
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              const nx = -uy * 14;
              const ny = ux * 14;

              // Show reweighted or original
              const displayWeight =
                step.reweightedEdges && step.type === "reweight"
                  ? step.reweightedEdges[i].weight
                  : e.weight;

              return (
                <g key={i}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={2}
                    markerEnd={
                      color === "#10b981"
                        ? "url(#j-arrow-green)"
                        : "url(#j-arrow)"
                    }
                  />
                  <text
                    x={mx + nx}
                    y={my + ny}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-xs font-mono"
                    fill={displayWeight < 0 ? "#dc2626" : "#6b7280"}
                  >
                    {displayWeight}
                  </text>
                </g>
              );
            })}
            {nodes.map((nd) => {
              const { fill, stroke } = getNodeColor(nd.id, step);
              return (
                <g key={nd.id}>
                  <circle
                    cx={nd.x}
                    cy={nd.y}
                    r={22}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={2}
                  />
                  <text
                    x={nd.x}
                    y={nd.y + 5}
                    textAnchor="middle"
                    className="text-sm font-mono font-bold"
                    fill="#374151"
                  >
                    {nd.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Potential h */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            ポテンシャル h
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.h.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="text-[10px] text-muted-foreground font-mono">
                  {idx}
                </div>
                <div className="w-12 h-10 flex items-center justify-center border-2 bg-white border-gray-300 text-sm font-mono">
                  {val >= INF ? "∞" : val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distance matrix */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            距離行列
          </div>
          <div className="overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="w-10 h-8 text-xs font-mono text-muted-foreground"></th>
                  {Array.from({ length: n }, (_, j) => (
                    <th
                      key={j}
                      className="w-14 h-8 text-xs font-mono text-center text-muted-foreground"
                    >
                      {j}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {step.dist.map((row, i) => (
                  <tr key={i}>
                    <td className="w-10 h-10 text-xs font-mono text-center text-muted-foreground">
                      {i}
                    </td>
                    {row.map((val, j) => {
                      const isHighlight =
                        step.currentSource === i && step.type === "dijkstra_done";
                      return (
                        <td
                          key={j}
                          className={`w-14 h-10 text-center border-2 text-sm font-mono ${
                            isHighlight && val < INF
                              ? "bg-emerald-100 border-emerald-500"
                              : i === j
                                ? "bg-gray-100 border-gray-300"
                                : "bg-white border-gray-200"
                          }`}
                        >
                          {val >= INF ? "∞" : val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
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
            <span>処理中のノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>現在の始点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>距離確定</span>
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
