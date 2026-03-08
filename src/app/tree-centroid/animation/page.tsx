"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface Tree {
  nodes: number[];
  edges: [number, number][];
}

type StepType =
  | "init"
  | "compute_size"
  | "compute_max_subtree"
  | "check_centroid"
  | "done";

interface Step {
  type: StepType;
  currentNode: number;
  subtreeSize: number[];
  maxSubtree: number[];
  centroid: number[];
  description: string;
}

// --- Default tree ---

function defaultTree(): Tree {
  return {
    nodes: [0, 1, 2, 3, 4, 5, 6],
    edges: [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
      [4, 6],
    ],
  };
}

// --- Node positions for tree layout ---

function getTreePositions(): { x: number; y: number }[] {
  return [
    { x: 250, y: 50 },  // 0
    { x: 150, y: 140 }, // 1
    { x: 350, y: 140 }, // 2
    { x: 80, y: 230 },  // 3
    { x: 200, y: 230 }, // 4
    { x: 400, y: 230 }, // 5
    { x: 200, y: 320 }, // 6
  ];
}

// --- Step generation ---

function generateSteps(tree: Tree): Step[] {
  const { nodes, edges } = tree;
  const n = nodes.length;
  const steps: Step[] = [];
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const subtreeSize = new Array(n).fill(0);
  const maxSubtree = new Array(n).fill(0);
  const centroid: number[] = [];

  steps.push({
    type: "init",
    currentNode: -1,
    subtreeSize: [...subtreeSize],
    maxSubtree: [...maxSubtree],
    centroid: [],
    description: "木の重心を求める。DFSで部分木サイズを計算",
  });

  // Compute subtree sizes via DFS (root at 0)
  const parent = new Array(n).fill(-1);
  const order: number[] = [];

  // Iterative DFS for ordering
  const stack = [0];
  const visited = new Array(n).fill(false);
  visited[0] = true;
  while (stack.length > 0) {
    const u = stack.pop()!;
    order.push(u);
    for (const v of adj[u]) {
      if (!visited[v]) {
        visited[v] = true;
        parent[v] = u;
        stack.push(v);
      }
    }
  }

  // Process in reverse DFS order (leaves first)
  for (let i = order.length - 1; i >= 0; i--) {
    const u = order[i];
    subtreeSize[u] = 1;
    for (const v of adj[u]) {
      if (v !== parent[u]) {
        subtreeSize[u] += subtreeSize[v];
      }
    }

    steps.push({
      type: "compute_size",
      currentNode: u,
      subtreeSize: [...subtreeSize],
      maxSubtree: [...maxSubtree],
      centroid: [],
      description: `ノード ${u} の部分木サイズ = ${subtreeSize[u]}`,
    });
  }

  // Compute max subtree component for each node
  for (const u of nodes) {
    let mx = 0;
    for (const v of adj[u]) {
      if (v !== parent[u]) {
        mx = Math.max(mx, subtreeSize[v]);
      }
    }
    // The "parent side" component has size n - subtreeSize[u]
    mx = Math.max(mx, n - subtreeSize[u]);
    maxSubtree[u] = mx;

    steps.push({
      type: "compute_max_subtree",
      currentNode: u,
      subtreeSize: [...subtreeSize],
      maxSubtree: [...maxSubtree],
      centroid: [],
      description: `ノード ${u}: 最大部分木サイズ = ${mx} (削除時の最大連結成分)`,
    });
  }

  // Find centroid(s)
  let minMax = n;
  for (const u of nodes) {
    if (maxSubtree[u] < minMax) {
      minMax = maxSubtree[u];
    }
  }

  for (const u of nodes) {
    if (maxSubtree[u] === minMax) {
      centroid.push(u);
      steps.push({
        type: "check_centroid",
        currentNode: u,
        subtreeSize: [...subtreeSize],
        maxSubtree: [...maxSubtree],
        centroid: [...centroid],
        description: `ノード ${u}: 最大部分木サイズ ${minMax} (最小)。重心!`,
      });
    }
  }

  steps.push({
    type: "done",
    currentNode: -1,
    subtreeSize: [...subtreeSize],
    maxSubtree: [...maxSubtree],
    centroid: [...centroid],
    description: `木の重心: ${centroid.join(", ")} (最大部分木サイズ = ${minMax})`,
  });

  return steps;
}

// --- Component ---

export default function TreeCentroidAnimationPage() {
  const [tree] = useState<Tree>(defaultTree);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((t: Tree) => {
    setSteps(generateSteps(t));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(tree);
  }, [tree, run]);

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

  const positions = getTreePositions();

  function getNodeColor(idx: number): string {
    if (step.centroid.includes(idx)) {
      return "fill-emerald-100 stroke-emerald-500";
    }
    if (idx === step.currentNode) {
      return "fill-blue-100 stroke-blue-400";
    }
    if (step.subtreeSize[idx] > 0) {
      return "fill-blue-50 stroke-blue-300";
    }
    return "fill-white stroke-gray-300";
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">木の重心</h1>
        <p className="text-sm text-muted-foreground mb-6">
          部分木サイズの最大値を最小化する頂点を求める
        </p>

        {/* Tree SVG */}
        <div className="mb-6 flex justify-center">
          <svg
            width={500}
            height={380}
            className="border border-border rounded"
          >
            {tree.edges.map(([u, v], i) => (
              <line
                key={`e-${i}`}
                x1={positions[u].x}
                y1={positions[u].y}
                x2={positions[v].x}
                y2={positions[v].y}
                className="stroke-gray-300"
                strokeWidth={2}
              />
            ))}
            {tree.nodes.map((node) => (
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
                  y={positions[node].y - 4}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-sm font-mono fill-foreground"
                >
                  {node}
                </text>
                {step.subtreeSize[node] > 0 && (
                  <text
                    x={positions[node].x}
                    y={positions[node].y + 10}
                    textAnchor="middle"
                    className="text-[9px] fill-muted-foreground"
                  >
                    s={step.subtreeSize[node]}
                    {step.maxSubtree[node] > 0
                      ? ` m=${step.maxSubtree[node]}`
                      : ""}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
          {step.centroid.length > 0 && (
            <span>
              重心:{" "}
              <span className="font-semibold text-emerald-600">
                {step.centroid.join(", ")}
              </span>
            </span>
          )}
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
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>重心</span>
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
