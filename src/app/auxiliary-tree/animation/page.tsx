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
  | "select_vertices"
  | "sort_by_dfs"
  | "compute_lca"
  | "add_to_aux"
  | "build_edge"
  | "done";

interface Step {
  type: StepType;
  description: string;
  selectedVertices: number[];
  auxVertices: number[];
  auxEdges: [number, number][];
  highlightNodes: number[];
}

// --- Default tree ---
// Tree:
//       0
//      /|\
//     1  2  3
//    /|     |
//   4  5    6
//   |
//   7

function defaultTree(): Tree {
  return {
    nodes: [0, 1, 2, 3, 4, 5, 6, 7],
    edges: [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 4],
      [1, 5],
      [3, 6],
      [4, 7],
    ],
  };
}

function getTreePositions(): { x: number; y: number }[] {
  return [
    { x: 250, y: 40 },  // 0
    { x: 120, y: 120 }, // 1
    { x: 250, y: 120 }, // 2
    { x: 380, y: 120 }, // 3
    { x: 70, y: 210 },  // 4
    { x: 170, y: 210 }, // 5
    { x: 380, y: 210 }, // 6
    { x: 70, y: 300 },  // 7
  ];
}

// --- DFS order and LCA computation ---

function computeDfsOrder(n: number, adj: number[][]): { order: number[]; depth: number[]; parent: number[] } {
  const order: number[] = [];
  const depth = new Array(n).fill(0);
  const parent = new Array(n).fill(-1);
  const visited = new Array(n).fill(false);
  const stack: { node: number; childIdx: number }[] = [{ node: 0, childIdx: 0 }];
  visited[0] = true;

  // Sort adj for consistent DFS ordering
  const sortedAdj = adj.map((a) => [...a].sort((x, y) => x - y));

  while (stack.length > 0) {
    const top = stack[stack.length - 1];
    const children = sortedAdj[top.node].filter((v) => !visited[v] || v === parent[top.node] ? false : true);
    const unvisitedChildren = sortedAdj[top.node].filter((v) => !visited[v]);

    if (top.childIdx === 0) {
      order.push(top.node);
    }

    if (top.childIdx < unvisitedChildren.length) {
      const next = unvisitedChildren[top.childIdx];
      top.childIdx++;
      visited[next] = true;
      parent[next] = top.node;
      depth[next] = depth[top.node] + 1;
      stack.push({ node: next, childIdx: 0 });
    } else {
      stack.pop();
    }
  }

  return { order, depth, parent };
}

function computeLCA(u: number, v: number, parent: number[], depth: number[]): number {
  let a = u;
  let b = v;
  while (a !== b) {
    if (depth[a] > depth[b]) {
      a = parent[a];
    } else {
      b = parent[b];
    }
  }
  return a;
}

// --- Step generation ---

function generateSteps(tree: Tree, selected: number[]): Step[] {
  const { nodes, edges } = tree;
  const n = nodes.length;
  const steps: Step[] = [];
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const { order: dfsOrder, depth, parent } = computeDfsOrder(n, adj);

  steps.push({
    type: "init",
    description: "Auxiliary Tree を構築する",
    selectedVertices: [],
    auxVertices: [],
    auxEdges: [],
    highlightNodes: [],
  });

  steps.push({
    type: "select_vertices",
    description: `指定頂点: {${selected.join(", ")}}`,
    selectedVertices: [...selected],
    auxVertices: [],
    auxEdges: [],
    highlightNodes: [...selected],
  });

  // Sort selected vertices by DFS order
  const dfsIdx = new Map<number, number>();
  dfsOrder.forEach((v, i) => dfsIdx.set(v, i));
  const sorted = [...selected].sort((a, b) => (dfsIdx.get(a) ?? 0) - (dfsIdx.get(b) ?? 0));

  steps.push({
    type: "sort_by_dfs",
    description: `DFS順にソート: [${sorted.join(", ")}]`,
    selectedVertices: [...sorted],
    auxVertices: [],
    auxEdges: [],
    highlightNodes: [...sorted],
  });

  // Compute all necessary LCAs
  const auxVertexSet = new Set<number>(sorted);
  const lcaPairs: { u: number; v: number; lca: number }[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const lca = computeLCA(sorted[i], sorted[i + 1], parent, depth);
    lcaPairs.push({ u: sorted[i], v: sorted[i + 1], lca });
    auxVertexSet.add(lca);

    steps.push({
      type: "compute_lca",
      description: `LCA(${sorted[i]}, ${sorted[i + 1]}) = ${lca}`,
      selectedVertices: [...sorted],
      auxVertices: [...auxVertexSet],
      auxEdges: [],
      highlightNodes: [sorted[i], sorted[i + 1], lca],
    });
  }

  // Also add root's LCA if needed
  if (sorted.length > 0) {
    auxVertexSet.add(computeLCA(sorted[0], sorted[sorted.length - 1], parent, depth));
  }

  // Sort aux vertices by DFS order
  const auxVertices = [...auxVertexSet].sort((a, b) => (dfsIdx.get(a) ?? 0) - (dfsIdx.get(b) ?? 0));

  steps.push({
    type: "add_to_aux",
    description: `Auxiliary Tree の頂点集合: {${auxVertices.join(", ")}}`,
    selectedVertices: [...sorted],
    auxVertices: [...auxVertices],
    auxEdges: [],
    highlightNodes: [...auxVertices],
  });

  // Build auxiliary tree edges using a stack
  const auxEdges: [number, number][] = [];
  const stk: number[] = [];

  for (const v of auxVertices) {
    if (stk.length === 0) {
      stk.push(v);
      continue;
    }

    const lca = computeLCA(v, stk[stk.length - 1], parent, depth);

    // Pop until stack top is an ancestor of lca or is lca
    while (stk.length > 1 && depth[stk[stk.length - 1]] > depth[lca]) {
      const top = stk.pop()!;
      const newTop = stk[stk.length - 1];
      if (depth[newTop] >= depth[lca]) {
        auxEdges.push([newTop, top]);
      } else {
        auxEdges.push([lca, top]);
      }
    }

    if (stk[stk.length - 1] !== lca) {
      const top = stk.pop()!;
      auxEdges.push([lca, top]);
      stk.push(lca);
    }

    if (stk[stk.length - 1] !== v) {
      stk.push(v);
    }
  }

  while (stk.length > 1) {
    const top = stk.pop()!;
    auxEdges.push([stk[stk.length - 1], top]);
  }

  for (const [u, v] of auxEdges) {
    steps.push({
      type: "build_edge",
      description: `辺 ${u} - ${v} を追加`,
      selectedVertices: [...sorted],
      auxVertices: [...auxVertices],
      auxEdges: [...auxEdges.slice(0, auxEdges.indexOf([u, v]) + 1)],
      highlightNodes: [u, v],
    });
  }

  steps.push({
    type: "done",
    description: `Auxiliary Tree 完成: ${auxVertices.length}頂点, ${auxEdges.length}辺`,
    selectedVertices: [...sorted],
    auxVertices: [...auxVertices],
    auxEdges: [...auxEdges],
    highlightNodes: [],
  });

  return steps;
}

// --- Component ---

export default function AuxiliaryTreeAnimationPage() {
  const [tree] = useState<Tree>(defaultTree);
  const [selected] = useState<number[]>([4, 5, 6]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(
    (t: Tree, sel: number[]) => {
      setSteps(generateSteps(t, sel));
      setCurrentStep(0);
      setIsPlaying(false);
    },
    []
  );

  useEffect(() => {
    run(tree, selected);
  }, [tree, selected, run]);

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

  const positions = getTreePositions();

  function getNodeColor(idx: number): string {
    if (step.highlightNodes.includes(idx)) {
      return "fill-blue-100 stroke-blue-400";
    }
    if (step.auxVertices.includes(idx)) {
      return "fill-emerald-100 stroke-emerald-500";
    }
    if (step.selectedVertices.includes(idx)) {
      return "fill-amber-50 stroke-amber-400";
    }
    return "fill-white stroke-gray-300";
  }

  function getEdgeColor(u: number, v: number): string {
    for (const [a, b] of step.auxEdges) {
      if ((a === u && b === v) || (a === v && b === u)) {
        return "stroke-emerald-500";
      }
    }
    return "stroke-gray-200";
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Auxiliary Tree</h1>
        <p className="text-sm text-muted-foreground mb-6">
          指定頂点集合の圧縮木を構築
        </p>

        {/* Tree SVG */}
        <div className="mb-6 flex justify-center">
          <svg
            width={500}
            height={360}
            className="border border-border rounded"
          >
            {tree.edges.map(([u, v], i) => (
              <line
                key={`e-${i}`}
                x1={positions[u].x}
                y1={positions[u].y}
                x2={positions[v].x}
                y2={positions[v].y}
                className={getEdgeColor(u, v)}
                strokeWidth={step.auxEdges.some(
                  ([a, b]) => (a === u && b === v) || (a === v && b === u)
                ) ? 3 : 1.5}
              />
            ))}
            {tree.nodes.map((node) => (
              <g key={`n-${node}`}>
                <circle
                  cx={positions[node].x}
                  cy={positions[node].y}
                  r={22}
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
            <span>注目頂点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>指定頂点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>Auxiliary Tree の頂点</span>
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
