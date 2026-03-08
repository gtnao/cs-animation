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
  | "find_center"
  | "root_tree"
  | "compute_hash"
  | "compare"
  | "done";

interface Step {
  type: StepType;
  description: string;
  tree1Labels: string[];
  tree2Labels: string[];
  tree1Center: number[];
  tree2Center: number[];
  highlightNodes1: number[];
  highlightNodes2: number[];
  isIsomorphic: boolean | null;
}

// --- Default trees (isomorphic) ---

function defaultTree1(): Tree {
  //   0-1-2-3-4
  //       |
  //       5
  return {
    nodes: [0, 1, 2, 3, 4, 5],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
    ],
  };
}

function defaultTree2(): Tree {
  //   0-1-2-3-4
  //     |
  //     5
  return {
    nodes: [0, 1, 2, 3, 4, 5],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [1, 5],
    ],
  };
}

function getTreePositions1(): { x: number; y: number }[] {
  return [
    { x: 40, y: 60 },
    { x: 100, y: 60 },
    { x: 160, y: 60 },
    { x: 220, y: 60 },
    { x: 280, y: 60 },
    { x: 160, y: 130 },
  ];
}

function getTreePositions2(): { x: number; y: number }[] {
  return [
    { x: 40, y: 60 },
    { x: 100, y: 60 },
    { x: 160, y: 60 },
    { x: 220, y: 60 },
    { x: 280, y: 60 },
    { x: 100, y: 130 },
  ];
}

// --- Tree center (for rooting) ---

function findCenter(n: number, adj: number[][]): number[] {
  if (n === 1) return [0];
  const degree = new Array(n).fill(0);
  for (let u = 0; u < n; u++) {
    degree[u] = adj[u].length;
  }
  let leaves: number[] = [];
  for (let u = 0; u < n; u++) {
    if (degree[u] <= 1) leaves.push(u);
  }
  let remaining = n;
  while (remaining > 2) {
    const newLeaves: number[] = [];
    for (const leaf of leaves) {
      remaining--;
      for (const v of adj[leaf]) {
        degree[v]--;
        if (degree[v] === 1) {
          newLeaves.push(v);
        }
      }
    }
    leaves = newLeaves;
  }
  return leaves;
}

// --- Canonical form (bracket notation) ---

function canonicalForm(
  root: number,
  adj: number[][],
  parent: number
): string {
  const childForms: string[] = [];
  for (const v of adj[root]) {
    if (v !== parent) {
      childForms.push(canonicalForm(v, adj, root));
    }
  }
  childForms.sort();
  return `(${childForms.join("")})`;
}

// --- Compute labels for each node ---

function computeLabels(
  n: number,
  adj: number[][],
  root: number
): string[] {
  const labels = new Array(n).fill("");
  const parent = new Array(n).fill(-1);
  const order: number[] = [];
  const stack = [root];
  const visited = new Array(n).fill(false);
  visited[root] = true;

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

  // Process leaves first
  for (let i = order.length - 1; i >= 0; i--) {
    const u = order[i];
    const childLabels: string[] = [];
    for (const v of adj[u]) {
      if (v !== parent[u]) {
        childLabels.push(labels[v]);
      }
    }
    childLabels.sort();
    labels[u] = `(${childLabels.join("")})`;
  }

  return labels;
}

// --- Step generation ---

function generateSteps(tree1: Tree, tree2: Tree): Step[] {
  const steps: Step[] = [];
  const n1 = tree1.nodes.length;
  const n2 = tree2.nodes.length;

  const adj1: number[][] = Array.from({ length: n1 }, () => []);
  for (const [u, v] of tree1.edges) {
    adj1[u].push(v);
    adj1[v].push(u);
  }

  const adj2: number[][] = Array.from({ length: n2 }, () => []);
  for (const [u, v] of tree2.edges) {
    adj2[u].push(v);
    adj2[v].push(u);
  }

  steps.push({
    type: "init",
    description: "2つの木が同型かを判定する",
    tree1Labels: new Array(n1).fill(""),
    tree2Labels: new Array(n2).fill(""),
    tree1Center: [],
    tree2Center: [],
    highlightNodes1: [],
    highlightNodes2: [],
    isIsomorphic: null,
  });

  if (n1 !== n2) {
    steps.push({
      type: "done",
      description: `頂点数が異なる (${n1} vs ${n2})。同型ではない`,
      tree1Labels: new Array(n1).fill(""),
      tree2Labels: new Array(n2).fill(""),
      tree1Center: [],
      tree2Center: [],
      highlightNodes1: [],
      highlightNodes2: [],
      isIsomorphic: false,
    });
    return steps;
  }

  // Find centers
  const center1 = findCenter(n1, adj1);
  const center2 = findCenter(n2, adj2);

  steps.push({
    type: "find_center",
    description: `木1の中心: {${center1.join(", ")}}, 木2の中心: {${center2.join(", ")}}`,
    tree1Labels: new Array(n1).fill(""),
    tree2Labels: new Array(n2).fill(""),
    tree1Center: center1,
    tree2Center: center2,
    highlightNodes1: center1,
    highlightNodes2: center2,
    isIsomorphic: null,
  });

  // Root at center and compute canonical forms
  const root1 = center1[0];
  const root2 = center2[0];

  steps.push({
    type: "root_tree",
    description: `木1をノード${root1}、木2をノード${root2}で根付き木にする`,
    tree1Labels: new Array(n1).fill(""),
    tree2Labels: new Array(n2).fill(""),
    tree1Center: center1,
    tree2Center: center2,
    highlightNodes1: [root1],
    highlightNodes2: [root2],
    isIsomorphic: null,
  });

  const labels1 = computeLabels(n1, adj1, root1);
  const labels2 = computeLabels(n2, adj2, root2);

  steps.push({
    type: "compute_hash",
    description: "各ノードの正規形を計算 (葉から根へ)",
    tree1Labels: [...labels1],
    tree2Labels: [...labels2],
    tree1Center: center1,
    tree2Center: center2,
    highlightNodes1: [],
    highlightNodes2: [],
    isIsomorphic: null,
  });

  // Compare roots
  let isIso = labels1[root1] === labels2[root2];

  // If center has 2 nodes, try both
  if (!isIso && center1.length === 2) {
    const altLabels1 = computeLabels(n1, adj1, center1[1]);
    isIso = altLabels1[center1[1]] === labels2[root2];
  }
  if (!isIso && center2.length === 2) {
    const altLabels2 = computeLabels(n2, adj2, center2[1]);
    isIso = labels1[root1] === altLabels2[center2[1]];
  }

  steps.push({
    type: "compare",
    description: `根の正規形: 木1="${labels1[root1]}", 木2="${labels2[root2]}" → ${isIso ? "一致" : "不一致"}`,
    tree1Labels: [...labels1],
    tree2Labels: [...labels2],
    tree1Center: center1,
    tree2Center: center2,
    highlightNodes1: [root1],
    highlightNodes2: [root2],
    isIsomorphic: isIso,
  });

  steps.push({
    type: "done",
    description: isIso
      ? "2つの木は同型です"
      : "2つの木は同型ではありません",
    tree1Labels: [...labels1],
    tree2Labels: [...labels2],
    tree1Center: center1,
    tree2Center: center2,
    highlightNodes1: [],
    highlightNodes2: [],
    isIsomorphic: isIso,
  });

  return steps;
}

// --- Component ---

export default function TreeIsomorphismAnimationPage() {
  const [tree1] = useState<Tree>(defaultTree1);
  const [tree2] = useState<Tree>(defaultTree2);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((t1: Tree, t2: Tree) => {
    setSteps(generateSteps(t1, t2));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(tree1, tree2);
  }, [tree1, tree2, run]);

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

  const pos1 = getTreePositions1();
  const pos2 = getTreePositions2();

  function getNodeColor(idx: number, highlights: number[], center: number[]): string {
    if (highlights.includes(idx)) {
      return "fill-blue-100 stroke-blue-400";
    }
    if (center.includes(idx)) {
      return "fill-emerald-100 stroke-emerald-500";
    }
    return "fill-white stroke-gray-300";
  }

  function renderTree(
    tree: Tree,
    positions: { x: number; y: number }[],
    labels: string[],
    highlights: number[],
    center: number[],
    offsetX: number,
    title: string
  ) {
    return (
      <g>
        <text x={offsetX + 160} y={20} textAnchor="middle" className="text-sm font-semibold fill-foreground">
          {title}
        </text>
        {tree.edges.map(([u, v], i) => (
          <line
            key={`e-${i}`}
            x1={positions[u].x + offsetX}
            y1={positions[u].y + 20}
            x2={positions[v].x + offsetX}
            y2={positions[v].y + 20}
            className="stroke-gray-300"
            strokeWidth={2}
          />
        ))}
        {tree.nodes.map((node) => (
          <g key={`n-${node}`}>
            <circle
              cx={positions[node].x + offsetX}
              cy={positions[node].y + 20}
              r={18}
              className={getNodeColor(node, highlights, center)}
              strokeWidth={2}
            />
            <text
              x={positions[node].x + offsetX}
              y={positions[node].y + 20}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-xs font-mono fill-foreground"
            >
              {node}
            </text>
            {labels[node] && (
              <text
                x={positions[node].x + offsetX}
                y={positions[node].y + 46}
                textAnchor="middle"
                className="text-[8px] fill-muted-foreground"
              >
                {labels[node].length > 12 ? labels[node].slice(0, 12) + ".." : labels[node]}
              </text>
            )}
          </g>
        ))}
      </g>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">木の同型判定</h1>
        <p className="text-sm text-muted-foreground mb-6">
          正規形ハッシュによる同型判定
        </p>

        {/* Trees SVG */}
        <div className="mb-6 flex justify-center">
          <svg
            width={700}
            height={200}
            className="border border-border rounded"
          >
            {renderTree(tree1, pos1, step.tree1Labels, step.highlightNodes1, step.tree1Center, 10, "木1")}
            {renderTree(tree2, pos2, step.tree2Labels, step.highlightNodes2, step.tree2Center, 370, "木2")}
          </svg>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
          {step.isIsomorphic !== null && (
            <span>
              結果:{" "}
              <span
                className={`font-semibold ${step.isIsomorphic ? "text-emerald-600" : "text-red-600"}`}
              >
                {step.isIsomorphic ? "同型" : "非同型"}
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
            <span>注目ノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>中心</span>
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
