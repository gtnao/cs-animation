"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface Graph {
  nodes: number[];
  edges: [number, number][];
}

type StepType =
  | "init"
  | "enqueue"
  | "visit"
  | "color_neighbor"
  | "conflict"
  | "component_done"
  | "done";

interface Step {
  type: StepType;
  currentNode: number;
  neighbor: number;
  color: number[]; // -1 = uncolored, 0 = group A, 1 = group B
  queue: number[];
  description: string;
  isBipartite: boolean;
  conflictEdge?: [number, number];
}

// --- Default graph ---

function defaultGraph(): Graph {
  return {
    nodes: [0, 1, 2, 3, 4, 5],
    edges: [
      [0, 1],
      [0, 3],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
  };
}

// --- Step generation ---

function generateSteps(graph: Graph): Step[] {
  const { nodes, edges } = graph;
  const n = nodes.length;
  const steps: Step[] = [];
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const color = new Array(n).fill(-1);
  let isBipartite = true;

  steps.push({
    type: "init",
    currentNode: -1,
    neighbor: -1,
    color: [...color],
    queue: [],
    description: "二部グラフ判定を開始。全ノードを未着色で初期化",
    isBipartite: true,
  });

  for (let start = 0; start < n && isBipartite; start++) {
    if (color[start] !== -1) continue;

    color[start] = 0;
    const queue = [start];

    steps.push({
      type: "enqueue",
      currentNode: start,
      neighbor: -1,
      color: [...color],
      queue: [...queue],
      description: `ノード ${start} を色0(青)で着色し、キューに追加`,
      isBipartite: true,
    });

    while (queue.length > 0 && isBipartite) {
      const u = queue.shift()!;

      steps.push({
        type: "visit",
        currentNode: u,
        neighbor: -1,
        color: [...color],
        queue: [...queue],
        description: `ノード ${u} をキューから取り出して処理`,
        isBipartite: true,
      });

      for (const v of adj[u]) {
        if (color[v] === -1) {
          color[v] = 1 - color[u];
          queue.push(v);

          steps.push({
            type: "color_neighbor",
            currentNode: u,
            neighbor: v,
            color: [...color],
            queue: [...queue],
            description: `ノード ${v} を色${color[v]}(${color[v] === 0 ? "青" : "赤"})で着色`,
            isBipartite: true,
          });
        } else if (color[v] === color[u]) {
          isBipartite = false;

          steps.push({
            type: "conflict",
            currentNode: u,
            neighbor: v,
            color: [...color],
            queue: [...queue],
            description: `ノード ${u} と ${v} が同じ色! 二部グラフではない`,
            isBipartite: false,
            conflictEdge: [u, v],
          });
          break;
        }
      }
    }

    if (isBipartite) {
      steps.push({
        type: "component_done",
        currentNode: -1,
        neighbor: -1,
        color: [...color],
        queue: [],
        description: `連結成分の着色が完了`,
        isBipartite: true,
      });
    }
  }

  steps.push({
    type: "done",
    currentNode: -1,
    neighbor: -1,
    color: [...color],
    queue: [],
    description: isBipartite
      ? "判定完了: 二部グラフです"
      : "判定完了: 二部グラフではありません",
    isBipartite,
  });

  return steps;
}

// --- Node positions ---

function getNodePositions(n: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const cx = 250;
  const cy = 200;
  const r = 140;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    positions.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  return positions;
}

// --- Component ---

export default function BipartiteCheckAnimationPage() {
  const [graph] = useState<Graph>(defaultGraph);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(
    (g: Graph) => {
      setSteps(generateSteps(g));
      setCurrentStep(0);
      setIsPlaying(false);
    },
    []
  );

  useEffect(() => {
    run(graph);
  }, [graph, run]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 600);
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

  const positions = getNodePositions(graph.nodes.length);

  function getNodeColor(idx: number): string {
    if (step.conflictEdge && (idx === step.conflictEdge[0] || idx === step.conflictEdge[1])) {
      return "fill-red-200 stroke-red-500";
    }
    if (idx === step.currentNode) {
      return "fill-blue-100 stroke-blue-400";
    }
    if (idx === step.neighbor) {
      return "fill-amber-50 stroke-amber-400";
    }
    if (step.color[idx] === 0) {
      return "fill-blue-50 stroke-blue-300";
    }
    if (step.color[idx] === 1) {
      return "fill-emerald-50 stroke-emerald-300";
    }
    return "fill-white stroke-gray-300";
  }

  function getEdgeColor(u: number, v: number): string {
    if (step.conflictEdge) {
      const [a, b] = step.conflictEdge;
      if ((u === a && v === b) || (u === b && v === a)) {
        return "stroke-red-500";
      }
    }
    if (
      (u === step.currentNode && v === step.neighbor) ||
      (v === step.currentNode && u === step.neighbor)
    ) {
      return "stroke-amber-400";
    }
    return "stroke-gray-300";
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">二部グラフ判定</h1>
        <p className="text-sm text-muted-foreground mb-6">
          BFSによる二部グラフ判定アルゴリズム
        </p>

        {/* Graph SVG */}
        <div className="mb-6 flex justify-center">
          <svg
            width={500}
            height={400}
            className="border border-border rounded"
          >
            {/* Edges */}
            {graph.edges.map(([u, v], i) => (
              <line
                key={`e-${i}`}
                x1={positions[u].x}
                y1={positions[u].y}
                x2={positions[v].x}
                y2={positions[v].y}
                className={getEdgeColor(u, v)}
                strokeWidth={2}
              />
            ))}
            {/* Nodes */}
            {graph.nodes.map((node) => (
              <g key={`n-${node}`}>
                <circle
                  cx={positions[node].x}
                  cy={positions[node].y}
                  r={24}
                  className={getNodeColor(node)}
                  strokeWidth={2}
                />
                <text
                  x={positions[node].x}
                  y={positions[node].y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-sm font-mono fill-foreground"
                >
                  {node}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Queue */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            キュー
          </div>
          <div className="flex gap-1">
            {step.queue.length === 0 ? (
              <span className="text-xs text-muted-foreground">(空)</span>
            ) : (
              step.queue.map((node, i) => (
                <div
                  key={i}
                  className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 bg-white text-sm font-mono"
                >
                  {node}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
          <span>
            結果:{" "}
            <span
              className={`font-semibold ${step.isBipartite ? "text-emerald-600" : "text-red-600"}`}
            >
              {step.type === "done"
                ? step.isBipartite
                  ? "二部グラフ"
                  : "非二部グラフ"
                : "判定中..."}
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
            <span>処理中ノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>隣接ノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-50 border-2 border-blue-300" />
            <span>色0 (グループA)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-50 border-2 border-emerald-300" />
            <span>色1 (グループB)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>衝突</span>
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
