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
  | "bfs1_visit"
  | "bfs1_done"
  | "bfs2_visit"
  | "bfs2_done"
  | "done";

interface Step {
  type: StepType;
  currentNode: number;
  dist: number[];
  phase: number; // 1 or 2
  startNode: number;
  farthestNode: number;
  diameter: number;
  description: string;
  pathNodes: number[];
}

// --- Default tree ---

function defaultTree(): Tree {
  //     0
  //    / \
  //   1   2
  //  / \   \
  // 3   4   5
  //     |
  //     6
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

// --- BFS utility ---

function bfs(
  adj: number[][],
  start: number,
  n: number
): number[] {
  const dist = new Array(n).fill(-1);
  dist[start] = 0;
  const queue = [start];
  while (queue.length > 0) {
    const u = queue.shift()!;
    for (const v of adj[u]) {
      if (dist[v] === -1) {
        dist[v] = dist[u] + 1;
        queue.push(v);
      }
    }
  }
  return dist;
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

  steps.push({
    type: "init",
    currentNode: -1,
    dist: new Array(n).fill(-1),
    phase: 0,
    startNode: 0,
    farthestNode: -1,
    diameter: -1,
    description: "木の直径を2回のBFSで求める",
    pathNodes: [],
  });

  // BFS 1: from node 0
  const dist1 = new Array(n).fill(-1);
  dist1[0] = 0;
  const queue1 = [0];

  steps.push({
    type: "bfs1_visit",
    currentNode: 0,
    dist: [...dist1],
    phase: 1,
    startNode: 0,
    farthestNode: -1,
    diameter: -1,
    description: "BFS1: ノード0から開始。dist[0] = 0",
    pathNodes: [],
  });

  while (queue1.length > 0) {
    const u = queue1.shift()!;
    for (const v of adj[u]) {
      if (dist1[v] === -1) {
        dist1[v] = dist1[u] + 1;
        queue1.push(v);

        steps.push({
          type: "bfs1_visit",
          currentNode: v,
          dist: [...dist1],
          phase: 1,
          startNode: 0,
          farthestNode: -1,
          diameter: -1,
          description: `BFS1: ノード${v}を訪問。dist[${v}] = ${dist1[v]}`,
          pathNodes: [],
        });
      }
    }
  }

  // Find farthest node from BFS1
  let u = 0;
  for (let i = 1; i < n; i++) {
    if (dist1[i] > dist1[u]) u = i;
  }

  steps.push({
    type: "bfs1_done",
    currentNode: u,
    dist: [...dist1],
    phase: 1,
    startNode: 0,
    farthestNode: u,
    diameter: -1,
    description: `BFS1完了。最遠ノード: ${u} (距離 ${dist1[u]})`,
    pathNodes: [],
  });

  // BFS 2: from farthest node u
  const dist2 = new Array(n).fill(-1);
  dist2[u] = 0;
  const queue2 = [u];
  const bfs2Start = u;

  steps.push({
    type: "bfs2_visit",
    currentNode: u,
    dist: [...dist2],
    phase: 2,
    startNode: bfs2Start,
    farthestNode: u,
    diameter: -1,
    description: `BFS2: ノード${u}から開始。dist[${u}] = 0`,
    pathNodes: [],
  });

  while (queue2.length > 0) {
    const curr = queue2.shift()!;
    for (const v of adj[curr]) {
      if (dist2[v] === -1) {
        dist2[v] = dist2[curr] + 1;
        queue2.push(v);

        steps.push({
          type: "bfs2_visit",
          currentNode: v,
          dist: [...dist2],
          phase: 2,
          startNode: bfs2Start,
          farthestNode: -1,
          diameter: -1,
          description: `BFS2: ノード${v}を訪問。dist[${v}] = ${dist2[v]}`,
          pathNodes: [],
        });
      }
    }
  }

  // Find farthest from BFS2
  let v = 0;
  for (let i = 1; i < n; i++) {
    if (dist2[i] > dist2[v]) v = i;
  }

  const diameter = dist2[v];

  // Reconstruct path
  const pathNodes: number[] = [];
  {
    const fullDist = bfs(adj, bfs2Start, n);
    const fullDist2 = bfs(adj, v, n);
    for (let i = 0; i < n; i++) {
      if (fullDist[i] + fullDist2[i] === diameter) {
        pathNodes.push(i);
      }
    }
  }

  steps.push({
    type: "bfs2_done",
    currentNode: v,
    dist: [...dist2],
    phase: 2,
    startNode: bfs2Start,
    farthestNode: v,
    diameter,
    description: `BFS2完了。最遠ノード: ${v} (距離 ${diameter})`,
    pathNodes,
  });

  steps.push({
    type: "done",
    currentNode: -1,
    dist: [...dist2],
    phase: 2,
    startNode: bfs2Start,
    farthestNode: v,
    diameter,
    description: `木の直径 = ${diameter} (ノード${bfs2Start} ↔ ノード${v})`,
    pathNodes,
  });

  return steps;
}

// --- Component ---

export default function TreeDiameterAnimationPage() {
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
    if (step.pathNodes.includes(idx)) {
      return "fill-emerald-100 stroke-emerald-500";
    }
    if (idx === step.currentNode) {
      return "fill-blue-100 stroke-blue-400";
    }
    if (idx === step.farthestNode) {
      return "fill-amber-50 stroke-amber-400";
    }
    if (step.dist[idx] !== -1) {
      return "fill-blue-50 stroke-blue-300";
    }
    return "fill-white stroke-gray-300";
  }

  function getEdgeColor(u: number, v: number): string {
    if (step.pathNodes.includes(u) && step.pathNodes.includes(v)) {
      return "stroke-emerald-500";
    }
    return "stroke-gray-300";
  }

  return (
    <>
{/* Tree SVG */}
        <div className="mb-6 flex justify-center">
          <svg
            width={500}
            height={380}
            className="border border-border rounded"
          >
            {/* Edges */}
            {tree.edges.map(([u, v], i) => (
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
                  y={positions[node].y - 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-sm font-mono fill-foreground"
                >
                  {node}
                </text>
                {step.dist[node] !== -1 && (
                  <text
                    x={positions[node].x}
                    y={positions[node].y + 12}
                    textAnchor="middle"
                    className="text-[10px] fill-muted-foreground"
                  >
                    d={step.dist[node]}
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
          {step.phase > 0 && (
            <span>
              フェーズ:{" "}
              <span className="font-semibold text-foreground">
                BFS {step.phase}
              </span>
            </span>
          )}
          {step.diameter >= 0 && (
            <span>
              直径:{" "}
              <span className="font-semibold text-emerald-600">
                {step.diameter}
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
            <span>現在のノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>最遠ノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-50 border-2 border-blue-300" />
            <span>訪問済み</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>直径パス</span>
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
