"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface LCTNode {
  id: number;
  left: number;
  right: number;
  parent: number;
  reversed: boolean;
}

interface Step {
  type:
    | "init"
    | "access_start"
    | "splay"
    | "cut_right"
    | "link_preferred"
    | "access_done"
    | "link_op"
    | "cut_op"
    | "find_root"
    | "done";
  description: string;
  nodes: LCTNode[];
  highlightNodes: number[];
  preferredPath: number[];
  operation: string;
}

// --- Default tree (represented forest) ---
// Initial tree:
//       0
//      / \
//     1   2
//    / \
//   3   4

const DEFAULT_N = 5;

// --- Simulated Link-Cut Tree ---

function initNodes(n: number): LCTNode[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    left: -1,
    right: -1,
    parent: -1,
    reversed: false,
  }));
}

// --- Step generation ---

function generateSteps(): Step[] {
  const steps: Step[] = [];
  const n = DEFAULT_N;

  // Initial state: isolated nodes
  let nodes = initNodes(n);

  steps.push({
    type: "init",
    description: `${n} 個の孤立した頂点で初期化`,
    nodes: nodes.map((nd) => ({ ...nd })),
    highlightNodes: [],
    preferredPath: [],
    operation: "",
  });

  // Link operations: build tree 0-1, 0-2, 1-3, 1-4
  const linkOps: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
  ];

  for (const [u, v] of linkOps) {
    // Simulate: after link(u, v), v becomes a child of u in the represented tree
    nodes[v].parent = u;

    steps.push({
      type: "link_op",
      description: `link(${u}, ${v}): 頂点 ${v} を頂点 ${u} の子として接続`,
      nodes: nodes.map((nd) => ({ ...nd })),
      highlightNodes: [u, v],
      preferredPath: [],
      operation: `link(${u}, ${v})`,
    });
  }

  // Access operation on node 3
  // Simulates access(3): makes path from 3 to root (0) preferred
  const accessNode = 3;
  const pathToRoot = [3, 1, 0];

  steps.push({
    type: "access_start",
    description: `access(${accessNode}): 頂点 ${accessNode} から根への preferred path を構築開始`,
    nodes: nodes.map((nd) => ({ ...nd })),
    highlightNodes: [accessNode],
    preferredPath: [],
    operation: `access(${accessNode})`,
  });

  // Step through path nodes
  for (let i = 0; i < pathToRoot.length; i++) {
    const v = pathToRoot[i];
    const currentPath = pathToRoot.slice(0, i + 1);

    steps.push({
      type: "splay",
      description: `頂点 ${v} を Splay。preferred path に追加`,
      nodes: nodes.map((nd) => ({ ...nd })),
      highlightNodes: [v],
      preferredPath: currentPath,
      operation: `access(${accessNode})`,
    });

    if (i < pathToRoot.length - 1) {
      steps.push({
        type: "link_preferred",
        description: `頂点 ${v} と ${pathToRoot[i + 1]} の preferred edge を設定`,
        nodes: nodes.map((nd) => ({ ...nd })),
        highlightNodes: [v, pathToRoot[i + 1]],
        preferredPath: currentPath,
        operation: `access(${accessNode})`,
      });
    }
  }

  steps.push({
    type: "access_done",
    description: `access(${accessNode}) 完了。3 → 1 → 0 が preferred path になった`,
    nodes: nodes.map((nd) => ({ ...nd })),
    highlightNodes: [],
    preferredPath: pathToRoot,
    operation: `access(${accessNode})`,
  });

  // Cut operation: cut(1, 4)
  steps.push({
    type: "cut_op",
    description: `cut(4): 頂点 4 と親 1 の間の辺を切断`,
    nodes: nodes.map((nd) => ({ ...nd })),
    highlightNodes: [4, 1],
    preferredPath: [],
    operation: "cut(4)",
  });

  nodes[4].parent = -1;

  steps.push({
    type: "cut_op",
    description: `cut(4) 完了。頂点 4 は独立した木の根になった`,
    nodes: nodes.map((nd) => ({ ...nd })),
    highlightNodes: [4],
    preferredPath: [],
    operation: "cut(4)",
  });

  // Find root of node 3
  steps.push({
    type: "find_root",
    description: `find_root(3): 頂点 3 の属する木の根を探索 → 根 = 0`,
    nodes: nodes.map((nd) => ({ ...nd })),
    highlightNodes: [3, 0],
    preferredPath: [3, 1, 0],
    operation: "find_root(3)",
  });

  steps.push({
    type: "done",
    description: "全操作完了。Link-Cut Tree は動的な森の管理を実現する",
    nodes: nodes.map((nd) => ({ ...nd })),
    highlightNodes: [],
    preferredPath: [],
    operation: "",
  });

  return steps;
}

// --- Tree layout ---

interface NodePosition {
  x: number;
  y: number;
}

function computePositions(nodes: LCTNode[]): NodePosition[] {
  const n = nodes.length;
  const positions: NodePosition[] = new Array(n);

  // Build adjacency from parent pointers
  const children: number[][] = Array.from({ length: n }, () => []);
  const roots: number[] = [];
  for (let i = 0; i < n; i++) {
    if (nodes[i].parent === -1) {
      roots.push(i);
    } else {
      children[nodes[i].parent].push(i);
    }
  }

  let globalX = 0;
  const Y_STEP = 70;

  function layoutTree(root: number, depth: number) {
    const ch = children[root];
    if (ch.length === 0) {
      positions[root] = { x: globalX * 80 + 50, y: depth * Y_STEP + 40 };
      globalX++;
      return;
    }
    for (const c of ch) {
      layoutTree(c, depth + 1);
    }
    const firstChild = positions[ch[0]];
    const lastChild = positions[ch[ch.length - 1]];
    positions[root] = {
      x: (firstChild.x + lastChild.x) / 2,
      y: depth * Y_STEP + 40,
    };
  }

  for (const r of roots) {
    layoutTree(r, 0);
    globalX++; // gap between trees
  }

  return positions;
}

// --- Component ---

export default function LinkCutTreeAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    const s = generateSteps();
    setSteps(s);
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 1000);
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

  const positions = computePositions(step.nodes);
  const svgWidth = Math.max(...positions.map((p) => p.x)) + 100;
  const svgHeight = Math.max(...positions.map((p) => p.y)) + 60;

  const getNodeColor = (nodeId: number) => {
    if (step.preferredPath.includes(nodeId)) {
      return { fill: "#fef3c7", stroke: "#f59e0b" }; // amber - preferred path
    }
    if (step.highlightNodes.includes(nodeId)) {
      return { fill: "#dbeafe", stroke: "#60a5fa" }; // blue - highlight
    }
    return { fill: "#ffffff", stroke: "#d1d5db" }; // white - default
  };

  // Build edges from parent pointers
  const edges: [number, number][] = [];
  for (const nd of step.nodes) {
    if (nd.parent !== -1) {
      edges.push([nd.parent, nd.id]);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Link-Cut Tree</h1>
        <p className="text-sm text-muted-foreground mb-6">
          動的な森上の操作 (link, cut, access, find_root) を可視化
        </p>

        {/* Operation */}
        {step.operation && (
          <div className="mb-4">
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200">
              {step.operation}
            </span>
          </div>
        )}

        {/* Tree SVG */}
        <div className="mb-6 overflow-x-auto">
          <svg
            width={svgWidth}
            height={svgHeight}
            className="border border-border rounded"
          >
            {/* Edges */}
            {edges.map(([parent, child], idx) => {
              const isPreferred =
                step.preferredPath.includes(parent) &&
                step.preferredPath.includes(child);
              return (
                <line
                  key={idx}
                  x1={positions[parent].x}
                  y1={positions[parent].y}
                  x2={positions[child].x}
                  y2={positions[child].y}
                  stroke={isPreferred ? "#f59e0b" : "#d1d5db"}
                  strokeWidth={isPreferred ? 4 : 2}
                />
              );
            })}
            {/* Nodes */}
            {step.nodes.map((nd) => {
              const pos = positions[nd.id];
              const color = getNodeColor(nd.id);
              return (
                <g key={nd.id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={20}
                    fill={color.fill}
                    stroke={color.stroke}
                    strokeWidth={2}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 5}
                    textAnchor="middle"
                    className="text-sm font-mono"
                    fill="#374151"
                  >
                    {nd.id}
                  </text>
                </g>
              );
            })}
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" />
            <span>操作対象</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>Preferred Path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-0.5 bg-amber-400" />
            <span>Preferred Edge</span>
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
