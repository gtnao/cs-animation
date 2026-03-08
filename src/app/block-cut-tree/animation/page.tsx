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
  | "dfs_visit"
  | "find_articulation"
  | "find_block"
  | "build_bct"
  | "done";

interface Step {
  type: StepType;
  currentNode: number;
  description: string;
  disc: number[];
  low: number[];
  articulationPoints: number[];
  blocks: number[][];
  highlightNodes: number[];
  highlightBlock: number;
}

// --- Default graph ---
// Graph with articulation points:
// 0-1-2-3, 1-4, 2-4 (block 1: 1,2,4)
// 3-5 (bridge)

function defaultGraph(): Graph {
  return {
    nodes: [0, 1, 2, 3, 4, 5],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [1, 4],
      [2, 4],
      [3, 5],
    ],
  };
}

function getNodePositions(): { x: number; y: number }[] {
  return [
    { x: 80, y: 100 },  // 0
    { x: 180, y: 60 },  // 1
    { x: 280, y: 60 },  // 2
    { x: 380, y: 100 }, // 3
    { x: 230, y: 160 }, // 4
    { x: 450, y: 200 }, // 5
  ];
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

  const disc = new Array(n).fill(-1);
  const low = new Array(n).fill(-1);
  const parent = new Array(n).fill(-1);
  let timer = 0;
  const articulationPoints = new Set<number>();
  const edgeStack: [number, number][] = [];
  const blocks: number[][] = [];

  steps.push({
    type: "init",
    currentNode: -1,
    description: "Block Cut Tree を構築する。DFSで関節点と二重連結成分を検出",
    disc: [...disc],
    low: [...low],
    articulationPoints: [],
    blocks: [],
    highlightNodes: [],
    highlightBlock: -1,
  });

  function extractBlock(u: number, v: number): number[] {
    const blockVertices = new Set<number>();
    while (edgeStack.length > 0) {
      const [a, b] = edgeStack.pop()!;
      blockVertices.add(a);
      blockVertices.add(b);
      if ((a === u && b === v) || (a === v && b === u)) break;
    }
    return [...blockVertices];
  }

  function dfs(u: number) {
    disc[u] = low[u] = timer++;
    let childCount = 0;

    steps.push({
      type: "dfs_visit",
      currentNode: u,
      description: `ノード ${u} を訪問。disc[${u}] = low[${u}] = ${disc[u]}`,
      disc: [...disc],
      low: [...low],
      articulationPoints: [...articulationPoints],
      blocks: blocks.map((b) => [...b]),
      highlightNodes: [u],
      highlightBlock: -1,
    });

    for (const v of adj[u]) {
      if (disc[v] === -1) {
        childCount++;
        parent[v] = u;
        edgeStack.push([u, v]);
        dfs(v);

        low[u] = Math.min(low[u], low[v]);

        // Check articulation point
        const isRoot = parent[u] === -1;
        if (
          (isRoot && childCount > 1) ||
          (!isRoot && low[v] >= disc[u])
        ) {
          articulationPoints.add(u);

          // Extract block
          const block = extractBlock(u, v);
          blocks.push(block);

          steps.push({
            type: "find_block",
            currentNode: u,
            description: `二重連結成分を検出: {${block.join(", ")}}`,
            disc: [...disc],
            low: [...low],
            articulationPoints: [...articulationPoints],
            blocks: blocks.map((b) => [...b]),
            highlightNodes: [...block],
            highlightBlock: blocks.length - 1,
          });
        }
      } else if (v !== parent[u] && disc[v] < disc[u]) {
        edgeStack.push([u, v]);
        low[u] = Math.min(low[u], disc[v]);
      }
    }
  }

  for (const s of nodes) {
    if (disc[s] === -1) {
      dfs(s);
      // Remaining edges form a block
      if (edgeStack.length > 0) {
        const blockVertices = new Set<number>();
        while (edgeStack.length > 0) {
          const [a, b] = edgeStack.pop()!;
          blockVertices.add(a);
          blockVertices.add(b);
        }
        const block = [...blockVertices];
        blocks.push(block);

        steps.push({
          type: "find_block",
          currentNode: -1,
          description: `二重連結成分を検出: {${block.join(", ")}}`,
          disc: [...disc],
          low: [...low],
          articulationPoints: [...articulationPoints],
          blocks: blocks.map((b) => [...b]),
          highlightNodes: [...block],
          highlightBlock: blocks.length - 1,
        });
      }
    }
  }

  if (articulationPoints.size > 0) {
    steps.push({
      type: "find_articulation",
      currentNode: -1,
      description: `関節点: {${[...articulationPoints].join(", ")}}`,
      disc: [...disc],
      low: [...low],
      articulationPoints: [...articulationPoints],
      blocks: blocks.map((b) => [...b]),
      highlightNodes: [...articulationPoints],
      highlightBlock: -1,
    });
  }

  steps.push({
    type: "build_bct",
    currentNode: -1,
    description: `Block Cut Tree: ${blocks.length}ブロック, ${articulationPoints.size}関節点`,
    disc: [...disc],
    low: [...low],
    articulationPoints: [...articulationPoints],
    blocks: blocks.map((b) => [...b]),
    highlightNodes: [],
    highlightBlock: -1,
  });

  steps.push({
    type: "done",
    currentNode: -1,
    description: "Block Cut Tree 構築完了",
    disc: [...disc],
    low: [...low],
    articulationPoints: [...articulationPoints],
    blocks: blocks.map((b) => [...b]),
    highlightNodes: [],
    highlightBlock: -1,
  });

  return steps;
}

// --- Colors for blocks ---

const BLOCK_COLORS = [
  "fill-blue-50 stroke-blue-300",
  "fill-emerald-50 stroke-emerald-300",
  "fill-amber-50 stroke-amber-300",
  "fill-purple-50 stroke-purple-300",
  "fill-red-50 stroke-red-300",
];

// --- Component ---

export default function BlockCutTreeAnimationPage() {
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

  const positions = getNodePositions();

  function getNodeColor(idx: number): string {
    if (step.highlightNodes.includes(idx)) {
      if (step.articulationPoints.includes(idx)) {
        return "fill-red-200 stroke-red-500";
      }
      return "fill-blue-100 stroke-blue-400";
    }
    if (step.articulationPoints.includes(idx)) {
      return "fill-red-100 stroke-red-400";
    }
    // Color by block membership
    for (let i = step.blocks.length - 1; i >= 0; i--) {
      if (step.blocks[i].includes(idx)) {
        return BLOCK_COLORS[i % BLOCK_COLORS.length];
      }
    }
    if (step.disc[idx] >= 0) {
      return "fill-blue-50 stroke-blue-300";
    }
    return "fill-white stroke-gray-300";
  }

  return (
    <>
{/* Graph SVG */}
        <div className="mb-6 flex justify-center">
          <svg
            width={530}
            height={280}
            className="border border-border rounded"
          >
            {graph.edges.map(([u, v], i) => (
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
                  y={positions[node].y - 3}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-sm font-mono fill-foreground"
                >
                  {node}
                </text>
                {step.disc[node] >= 0 && (
                  <text
                    x={positions[node].x}
                    y={positions[node].y + 11}
                    textAnchor="middle"
                    className="text-[8px] fill-muted-foreground"
                  >
                    {step.disc[node]}/{step.low[node]}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Blocks list */}
        {step.blocks.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              二重連結成分
            </div>
            <div className="flex gap-2 flex-wrap">
              {step.blocks.map((block, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 border rounded text-xs font-mono ${
                    i === step.highlightBlock
                      ? "bg-blue-100 border-blue-400"
                      : "bg-white border-border"
                  }`}
                >
                  B{i}: {"{"}
                  {block.join(", ")}
                  {"}"}
                </span>
              ))}
            </div>
          </div>
        )}

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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-400" />
            <span>関節点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-50 border-2 border-emerald-300" />
            <span>ブロック (色分け)</span>
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
