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
  | "find_centroid"
  | "remove_centroid"
  | "recurse"
  | "done";

interface Step {
  type: StepType;
  currentCentroid: number;
  removed: boolean[];
  cdParent: number[]; // centroid decomposition parent
  cdDepth: number[];
  description: string;
  highlightNodes: number[];
  currentComponent: number[];
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

// --- Node positions ---

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

  const removed = new Array(n).fill(false);
  const cdParent = new Array(n).fill(-1);
  const cdDepth = new Array(n).fill(-1);

  steps.push({
    type: "init",
    currentCentroid: -1,
    removed: [...removed],
    cdParent: [...cdParent],
    cdDepth: [...cdDepth],
    description: "重心分解を開始",
    highlightNodes: [],
    currentComponent: [],
  });

  function getSubtreeSize(root: number): Map<number, number> {
    const size = new Map<number, number>();
    const parent = new Map<number, number>();
    const order: number[] = [];
    const stack = [root];
    parent.set(root, -1);

    while (stack.length > 0) {
      const u = stack.pop()!;
      order.push(u);
      for (const v of adj[u]) {
        if (!removed[v] && !parent.has(v) && v !== parent.get(u)) {
          parent.set(v, u);
          stack.push(v);
        }
      }
    }

    for (let i = order.length - 1; i >= 0; i--) {
      const u = order[i];
      let s = 1;
      for (const v of adj[u]) {
        if (!removed[v] && v !== parent.get(u) && size.has(v)) {
          s += size.get(v)!;
        }
      }
      size.set(u, s);
    }

    return size;
  }

  function findCentroid(root: number): number {
    const size = getSubtreeSize(root);
    const totalSize = size.get(root)!;
    const parent = new Map<number, number>();
    parent.set(root, -1);

    const order: number[] = [];
    const stack = [root];
    while (stack.length > 0) {
      const u = stack.pop()!;
      order.push(u);
      for (const v of adj[u]) {
        if (!removed[v] && !parent.has(v)) {
          parent.set(v, u);
          stack.push(v);
        }
      }
    }

    let centroid = root;
    let minMax = totalSize;

    for (const u of order) {
      let maxComp = totalSize - size.get(u)!;
      for (const v of adj[u]) {
        if (!removed[v] && v !== parent.get(u) && size.has(v)) {
          maxComp = Math.max(maxComp, size.get(v)!);
        }
      }
      if (maxComp < minMax) {
        minMax = maxComp;
        centroid = u;
      }
    }

    return centroid;
  }

  function getComponent(root: number): number[] {
    const comp: number[] = [];
    const stack = [root];
    const visited = new Set<number>();
    visited.add(root);

    while (stack.length > 0) {
      const u = stack.pop()!;
      comp.push(u);
      for (const v of adj[u]) {
        if (!removed[v] && !visited.has(v)) {
          visited.add(v);
          stack.push(v);
        }
      }
    }
    return comp;
  }

  function decompose(root: number, depth: number, parentCentroid: number) {
    const component = getComponent(root);
    const c = findCentroid(root);

    cdDepth[c] = depth;
    cdParent[c] = parentCentroid;

    steps.push({
      type: "find_centroid",
      currentCentroid: c,
      removed: [...removed],
      cdParent: [...cdParent],
      cdDepth: [...cdDepth],
      description: `成分 {${component.join(",")}} の重心: ノード ${c} (深さ ${depth})`,
      highlightNodes: [c],
      currentComponent: [...component],
    });

    removed[c] = true;

    steps.push({
      type: "remove_centroid",
      currentCentroid: c,
      removed: [...removed],
      cdParent: [...cdParent],
      cdDepth: [...cdDepth],
      description: `ノード ${c} を削除`,
      highlightNodes: [c],
      currentComponent: [],
    });

    for (const v of adj[c]) {
      if (!removed[v]) {
        decompose(v, depth + 1, c);
      }
    }
  }

  decompose(0, 0, -1);

  steps.push({
    type: "done",
    currentCentroid: -1,
    removed: [...removed],
    cdParent: [...cdParent],
    cdDepth: [...cdDepth],
    description: "重心分解完了",
    highlightNodes: [],
    currentComponent: [],
  });

  return steps;
}

// --- Component ---

export default function CentroidDecompositionAnimationPage() {
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
      return "fill-emerald-100 stroke-emerald-500";
    }
    if (step.removed[idx]) {
      return "fill-gray-100 stroke-gray-300";
    }
    if (step.currentComponent.includes(idx)) {
      return "fill-amber-50 stroke-amber-400";
    }
    if (step.cdDepth[idx] >= 0) {
      return "fill-blue-50 stroke-blue-300";
    }
    return "fill-white stroke-gray-300";
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
            {tree.edges.map(([u, v], i) => (
              <line
                key={`e-${i}`}
                x1={positions[u].x}
                y1={positions[u].y}
                x2={positions[v].x}
                y2={positions[v].y}
                className={
                  step.removed[u] || step.removed[v]
                    ? "stroke-gray-200"
                    : "stroke-gray-300"
                }
                strokeWidth={2}
                strokeDasharray={
                  step.removed[u] || step.removed[v] ? "4" : undefined
                }
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
                  y={positions[node].y - 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-sm font-mono fill-foreground"
                >
                  {node}
                </text>
                {step.cdDepth[node] >= 0 && (
                  <text
                    x={positions[node].x}
                    y={positions[node].y + 12}
                    textAnchor="middle"
                    className="text-[9px] fill-muted-foreground"
                  >
                    d={step.cdDepth[node]}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Centroid decomposition tree */}
        {step.type === "done" && (
          <div className="mb-4">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              分解木の親子関係
            </div>
            <div className="flex gap-2 flex-wrap">
              {tree.nodes.map((node) => (
                <span
                  key={node}
                  className="px-2 py-1 border border-border rounded text-xs font-mono"
                >
                  {node}→{step.cdParent[node] === -1 ? "root" : step.cdParent[node]}
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
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>現在の重心</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>現在の成分</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-gray-100 border-2 border-gray-300" />
            <span>削除済み</span>
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
