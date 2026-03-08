"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface TreeNode {
  id: number;
  children: number[];
  parent: number;
  depth: number;
}

interface Step {
  type: "init" | "enter" | "leave" | "done";
  description: string;
  currentNode: number;
  visitedNodes: Set<number>;
  eulerTour: number[];
  tin: number[];
  tout: number[];
  highlightSubtree: number[];
}

// --- Default tree ---
//       0
//      / \
//     1   2
//    / \   \
//   3   4   5
//  /
// 6

const DEFAULT_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [3, 6],
];
const DEFAULT_N = 7;

// --- Build tree ---

function buildTree(n: number, edges: [number, number][]): TreeNode[] {
  const nodes: TreeNode[] = Array.from({ length: n }, (_, i) => ({
    id: i,
    children: [],
    parent: -1,
    depth: 0,
  }));
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const visited = new Array(n).fill(false);
  const queue = [0];
  visited[0] = true;
  while (queue.length > 0) {
    const u = queue.shift()!;
    for (const v of adj[u]) {
      if (!visited[v]) {
        visited[v] = true;
        nodes[v].parent = u;
        nodes[v].depth = nodes[u].depth + 1;
        nodes[u].children.push(v);
        queue.push(v);
      }
    }
  }
  return nodes;
}

// --- Step generation ---

function generateSteps(n: number, edges: [number, number][]): Step[] {
  const nodes = buildTree(n, edges);
  const steps: Step[] = [];
  const euler: number[] = [];
  const tin: number[] = new Array(n).fill(-1);
  const tout: number[] = new Array(n).fill(-1);
  const visited = new Set<number>();
  let timer = 0;

  steps.push({
    type: "init",
    description: "Euler Tour を開始。根 (頂点 0) から DFS を行う",
    currentNode: -1,
    visitedNodes: new Set(),
    eulerTour: [],
    tin: [...tin],
    tout: [...tout],
    highlightSubtree: [],
  });

  function dfs(u: number) {
    tin[u] = timer++;
    visited.add(u);
    euler.push(u);

    steps.push({
      type: "enter",
      description: `頂点 ${u} に入る (enter)。tin[${u}] = ${tin[u]}`,
      currentNode: u,
      visitedNodes: new Set(visited),
      eulerTour: [...euler],
      tin: [...tin],
      tout: [...tout],
      highlightSubtree: [],
    });

    for (const c of nodes[u].children) {
      dfs(c);
    }

    tout[u] = timer++;
    euler.push(u);

    steps.push({
      type: "leave",
      description: `頂点 ${u} から出る (leave)。tout[${u}] = ${tout[u]}。部分木 = [${tin[u]}, ${tout[u]}]`,
      currentNode: u,
      visitedNodes: new Set(visited),
      eulerTour: [...euler],
      tin: [...tin],
      tout: [...tout],
      highlightSubtree: getSubtreeNodes(u, nodes),
    });
  }

  dfs(0);

  steps.push({
    type: "done",
    description: `Euler Tour 完了。列の長さ = ${euler.length} = 2n = ${2 * n}`,
    currentNode: -1,
    visitedNodes: new Set(visited),
    eulerTour: [...euler],
    tin: [...tin],
    tout: [...tout],
    highlightSubtree: [],
  });

  return steps;
}

function getSubtreeNodes(u: number, nodes: TreeNode[]): number[] {
  const result: number[] = [u];
  for (const c of nodes[u].children) {
    result.push(...getSubtreeNodes(c, nodes));
  }
  return result;
}

// --- Tree layout ---

interface NodePosition {
  x: number;
  y: number;
}

function computeLayout(nodes: TreeNode[]): NodePosition[] {
  const positions: NodePosition[] = new Array(nodes.length);
  let xCounter = 0;
  const Y_STEP = 70;

  function dfs(nodeId: number) {
    const node = nodes[nodeId];
    if (node.children.length === 0) {
      positions[nodeId] = {
        x: xCounter * 80 + 40,
        y: node.depth * Y_STEP + 40,
      };
      xCounter++;
      return;
    }
    for (const child of node.children) {
      dfs(child);
    }
    const firstChild = positions[node.children[0]];
    const lastChild = positions[node.children[node.children.length - 1]];
    positions[nodeId] = {
      x: (firstChild.x + lastChild.x) / 2,
      y: node.depth * Y_STEP + 40,
    };
  }

  dfs(0);
  return positions;
}

// --- Component ---

export default function EulerTourAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [positions, setPositions] = useState<NodePosition[]>([]);
  const [treeEdges] = useState<[number, number][]>(DEFAULT_EDGES);

  const run = useCallback(() => {
    const treeNodes = buildTree(DEFAULT_N, treeEdges);
    setNodes(treeNodes);
    setPositions(computeLayout(treeNodes));
    const s = generateSteps(DEFAULT_N, treeEdges);
    setSteps(s);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [treeEdges]);

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
  if (!step || nodes.length === 0 || positions.length === 0) return null;

  const svgWidth = Math.max(...positions.map((p) => p.x)) + 80;
  const svgHeight = Math.max(...positions.map((p) => p.y)) + 60;

  const getNodeColor = (nodeId: number) => {
    if (nodeId === step.currentNode) {
      return { fill: "#dbeafe", stroke: "#60a5fa" }; // blue - current
    }
    if (step.highlightSubtree.includes(nodeId)) {
      return { fill: "#fef3c7", stroke: "#f59e0b" }; // amber - subtree
    }
    if (step.visitedNodes.has(nodeId)) {
      return { fill: "#d1fae5", stroke: "#10b981" }; // green - visited
    }
    return { fill: "#ffffff", stroke: "#d1d5db" }; // white - default
  };

  return (
    <>
{/* Tree SVG */}
        <div className="mb-6 overflow-x-auto">
          <svg
            width={svgWidth}
            height={svgHeight}
            className="border border-border rounded"
          >
            {treeEdges.map(([u, v], idx) => {
              const parent = nodes[u].parent === v ? v : u;
              const child = parent === u ? v : u;
              return (
                <line
                  key={idx}
                  x1={positions[parent].x}
                  y1={positions[parent].y}
                  x2={positions[child].x}
                  y2={positions[child].y}
                  stroke="#d1d5db"
                  strokeWidth={2}
                />
              );
            })}
            {nodes.map((node) => {
              const pos = positions[node.id];
              const color = getNodeColor(node.id);
              return (
                <g key={node.id}>
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
                    {node.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Euler Tour Array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Euler Tour 列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.eulerTour.map((nodeId, idx) => {
              let cls =
                "w-8 h-8 flex items-center justify-center border-2 text-xs font-mono transition-colors";
              if (idx === step.eulerTour.length - 1 && step.type !== "done") {
                cls += " bg-blue-100 border-blue-400";
              } else {
                cls += " bg-white border-gray-200";
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-0.5">
                  <div className={cls}>{nodeId}</div>
                  <div className="text-[9px] text-muted-foreground font-mono">
                    {idx}
                  </div>
                </div>
              );
            })}
            {step.eulerTour.length === 0 && (
              <div className="text-sm text-muted-foreground">（空）</div>
            )}
          </div>
        </div>

        {/* tin/tout table */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            tin / tout
          </div>
          <div className="overflow-x-auto">
            <table className="text-xs font-mono border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-2 py-1 bg-gray-50">
                    v
                  </th>
                  {nodes.map((node) => (
                    <th
                      key={node.id}
                      className="border border-gray-300 px-2 py-1 bg-gray-50"
                    >
                      {node.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-2 py-1 bg-gray-50 font-semibold">
                    tin
                  </td>
                  {step.tin.map((val, idx) => (
                    <td
                      key={idx}
                      className={`border border-gray-300 px-2 py-1 text-center ${
                        idx === step.currentNode ? "bg-blue-50" : ""
                      }`}
                    >
                      {val === -1 ? "-" : val}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-1 bg-gray-50 font-semibold">
                    tout
                  </td>
                  {step.tout.map((val, idx) => (
                    <td
                      key={idx}
                      className={`border border-gray-300 px-2 py-1 text-center ${
                        idx === step.currentNode ? "bg-blue-50" : ""
                      }`}
                    >
                      {val === -1 ? "-" : val}
                    </td>
                  ))}
                </tr>
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
            <span>現在の頂点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>部分木</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>訪問済み</span>
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
