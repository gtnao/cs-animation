"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface Graph {
  nodes: number[];
  edges: [number, number][];
}

type NodeState = "white" | "gray" | "black";

type StepType =
  | "init"
  | "start_dfs"
  | "visit"
  | "explore_edge"
  | "back_edge"
  | "finish"
  | "done";

interface Step {
  type: StepType;
  currentNode: number;
  neighbor: number;
  nodeState: NodeState[];
  stack: number[];
  description: string;
  hasCycle: boolean;
  cycleEdge?: [number, number];
}

// --- Default graph (directed, with a cycle) ---

function defaultGraph(): Graph {
  return {
    nodes: [0, 1, 2, 3, 4, 5],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 1], // back edge: cycle 1->2->3->1
      [0, 4],
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
  }

  const state: NodeState[] = new Array(n).fill("white");
  let hasCycle = false;
  const stack: number[] = [];

  steps.push({
    type: "init",
    currentNode: -1,
    neighbor: -1,
    nodeState: [...state],
    stack: [],
    description: "サイクル検出を開始。全ノードを未訪問 (白) で初期化",
    hasCycle: false,
  });

  function dfs(u: number) {
    if (hasCycle) return;
    state[u] = "gray";
    stack.push(u);

    steps.push({
      type: "visit",
      currentNode: u,
      neighbor: -1,
      nodeState: [...state],
      stack: [...stack],
      description: `ノード ${u} を訪問 (灰色に変更)。DFSスタックに追加`,
      hasCycle,
    });

    for (const v of adj[u]) {
      if (hasCycle) return;

      if (state[v] === "gray") {
        hasCycle = true;
        steps.push({
          type: "back_edge",
          currentNode: u,
          neighbor: v,
          nodeState: [...state],
          stack: [...stack],
          description: `辺 ${u}→${v}: ノード ${v} は灰色 (探索中)。後退辺を発見! サイクルが存在`,
          hasCycle: true,
          cycleEdge: [u, v],
        });
        return;
      }

      if (state[v] === "white") {
        steps.push({
          type: "explore_edge",
          currentNode: u,
          neighbor: v,
          nodeState: [...state],
          stack: [...stack],
          description: `辺 ${u}→${v}: ノード ${v} は未訪問。再帰的に探索`,
          hasCycle,
        });
        dfs(v);
      }
    }

    if (!hasCycle) {
      state[u] = "black";
      stack.pop();

      steps.push({
        type: "finish",
        currentNode: u,
        neighbor: -1,
        nodeState: [...state],
        stack: [...stack],
        description: `ノード ${u} の探索完了 (黒に変更)`,
        hasCycle,
      });
    }
  }

  for (const s of nodes) {
    if (hasCycle) break;
    if (state[s] !== "white") continue;

    steps.push({
      type: "start_dfs",
      currentNode: s,
      neighbor: -1,
      nodeState: [...state],
      stack: [...stack],
      description: `ノード ${s} からDFS開始`,
      hasCycle,
    });

    dfs(s);
  }

  steps.push({
    type: "done",
    currentNode: -1,
    neighbor: -1,
    nodeState: [...state],
    stack: [...stack],
    description: hasCycle
      ? "検出完了: サイクルが存在します"
      : "検出完了: サイクルは存在しません (DAG)",
    hasCycle,
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

export default function CycleDetectionAnimationPage() {
  const [graph] = useState<Graph>(defaultGraph);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((g: Graph) => {
    setSteps(generateSteps(g));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

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
    if (step.cycleEdge && (idx === step.cycleEdge[0] || idx === step.cycleEdge[1])) {
      return "fill-red-200 stroke-red-500";
    }
    if (idx === step.currentNode) {
      return "fill-blue-100 stroke-blue-400";
    }
    if (idx === step.neighbor) {
      return "fill-amber-50 stroke-amber-400";
    }
    if (step.nodeState[idx] === "gray") {
      return "fill-amber-50 stroke-amber-400";
    }
    if (step.nodeState[idx] === "black") {
      return "fill-emerald-100 stroke-emerald-500";
    }
    return "fill-white stroke-gray-300";
  }

  function getEdgeColor(u: number, v: number): string {
    if (step.cycleEdge) {
      const [a, b] = step.cycleEdge;
      if (u === a && v === b) {
        return "stroke-red-500";
      }
    }
    if (u === step.currentNode && v === step.neighbor) {
      return "stroke-blue-400";
    }
    return "stroke-gray-300";
  }

  // Arrow marker for directed edges
  const arrowSize = 8;

  return (
    <>
{/* Graph SVG */}
        <div className="mb-6 flex justify-center">
          <svg
            width={500}
            height={400}
            className="border border-border rounded"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth={arrowSize}
                markerHeight={arrowSize}
                refX={arrowSize + 16}
                refY={arrowSize / 2}
                orient="auto"
              >
                <polygon
                  points={`0 0, ${arrowSize} ${arrowSize / 2}, 0 ${arrowSize}`}
                  className="fill-gray-400"
                />
              </marker>
              <marker
                id="arrowhead-red"
                markerWidth={arrowSize}
                markerHeight={arrowSize}
                refX={arrowSize + 16}
                refY={arrowSize / 2}
                orient="auto"
              >
                <polygon
                  points={`0 0, ${arrowSize} ${arrowSize / 2}, 0 ${arrowSize}`}
                  className="fill-red-500"
                />
              </marker>
              <marker
                id="arrowhead-blue"
                markerWidth={arrowSize}
                markerHeight={arrowSize}
                refX={arrowSize + 16}
                refY={arrowSize / 2}
                orient="auto"
              >
                <polygon
                  points={`0 0, ${arrowSize} ${arrowSize / 2}, 0 ${arrowSize}`}
                  className="fill-blue-400"
                />
              </marker>
            </defs>
            {/* Edges */}
            {graph.edges.map(([u, v], i) => {
              const color = getEdgeColor(u, v);
              const markerId = color.includes("red")
                ? "arrowhead-red"
                : color.includes("blue")
                  ? "arrowhead-blue"
                  : "arrowhead";
              return (
                <line
                  key={`e-${i}`}
                  x1={positions[u].x}
                  y1={positions[u].y}
                  x2={positions[v].x}
                  y2={positions[v].y}
                  className={color}
                  strokeWidth={2}
                  markerEnd={`url(#${markerId})`}
                />
              );
            })}
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

        {/* DFS Stack */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            DFSスタック
          </div>
          <div className="flex gap-1">
            {step.stack.length === 0 ? (
              <span className="text-xs text-muted-foreground">(空)</span>
            ) : (
              step.stack.map((node, i) => (
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
              className={`font-semibold ${step.hasCycle ? "text-red-600" : "text-emerald-600"}`}
            >
              {step.type === "done"
                ? step.hasCycle
                  ? "サイクルあり"
                  : "サイクルなし"
                : "検出中..."}
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
            <span>探索中 (灰色)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>完了 (黒)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>後退辺 (サイクル)</span>
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
