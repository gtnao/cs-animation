"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface TreeNode {
  id: number;
  children: number[];
  parent: number;
  depth: number;
  value: number;
}

interface Step {
  type:
    | "init"
    | "find_lca"
    | "climb_u"
    | "climb_v"
    | "accumulate"
    | "done";
  description: string;
  highlightNodes: number[];
  pathNodes: number[];
  currentU: number;
  currentV: number;
  lca: number;
  accumulated: number;
  visitedOnPath: number[];
}

// --- Default tree ---
//       0(5)
//      / \
//     1(3) 2(7)
//    / \    \
//   3(2) 4(8) 5(1)
//  /
// 6(4)

const DEFAULT_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [3, 6],
];
const DEFAULT_N = 7;
const DEFAULT_VALUES = [5, 3, 7, 2, 8, 1, 4];
const DEFAULT_U = 6;
const DEFAULT_V = 4;

// --- Build tree ---

function buildTree(
  n: number,
  edges: [number, number][],
  values: number[]
): TreeNode[] {
  const nodes: TreeNode[] = Array.from({ length: n }, (_, i) => ({
    id: i,
    children: [],
    parent: -1,
    depth: 0,
    value: values[i],
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

// --- Find path ---

function getPath(
  u: number,
  v: number,
  nodes: TreeNode[]
): { lca: number; pathFromU: number[]; pathFromV: number[] } {
  // Find LCA by simple climb
  const ancestorsU = new Set<number>();
  let cu = u;
  while (cu !== -1) {
    ancestorsU.add(cu);
    cu = nodes[cu].parent;
  }
  let lcaNode = v;
  while (!ancestorsU.has(lcaNode)) {
    lcaNode = nodes[lcaNode].parent;
  }

  const pathFromU: number[] = [];
  cu = u;
  while (cu !== lcaNode) {
    pathFromU.push(cu);
    cu = nodes[cu].parent;
  }
  pathFromU.push(lcaNode);

  const pathFromV: number[] = [];
  let cv = v;
  while (cv !== lcaNode) {
    pathFromV.push(cv);
    cv = nodes[cv].parent;
  }

  return { lca: lcaNode, pathFromU, pathFromV };
}

// --- Step generation ---

function generateSteps(
  n: number,
  edges: [number, number][],
  values: number[],
  queryU: number,
  queryV: number
): Step[] {
  const nodes = buildTree(n, edges, values);
  const steps: Step[] = [];

  steps.push({
    type: "init",
    description: `パスクエリ: ${queryU} から ${queryV} への頂点値の合計を求める。各頂点の値 = [${values.join(", ")}]`,
    highlightNodes: [queryU, queryV],
    pathNodes: [],
    currentU: queryU,
    currentV: queryV,
    lca: -1,
    accumulated: 0,
    visitedOnPath: [],
  });

  const { lca, pathFromU, pathFromV } = getPath(queryU, queryV, nodes);
  const fullPath = [...pathFromU, ...pathFromV.reverse()];

  steps.push({
    type: "find_lca",
    description: `LCA(${queryU}, ${queryV}) = ${lca}。パス: ${fullPath.join(" → ")}`,
    highlightNodes: [lca],
    pathNodes: fullPath,
    currentU: queryU,
    currentV: queryV,
    lca,
    accumulated: 0,
    visitedOnPath: [],
  });

  // Climb from u to lca
  let sum = 0;
  const visited: number[] = [];

  for (const node of pathFromU) {
    sum += nodes[node].value;
    visited.push(node);
    steps.push({
      type: node === lca ? "accumulate" : "climb_u",
      description: `頂点 ${node} (値=${nodes[node].value}) を加算。累積 = ${sum}`,
      highlightNodes: [node],
      pathNodes: fullPath,
      currentU: node,
      currentV: queryV,
      lca,
      accumulated: sum,
      visitedOnPath: [...visited],
    });
  }

  // Climb from v to lca (excluding lca itself)
  const pathVReversed = [...pathFromV].reverse(); // already reversed above, so reverse back
  const pathVToLCA: number[] = [];
  let cv = queryV;
  while (cv !== lca) {
    pathVToLCA.push(cv);
    cv = nodes[cv].parent;
  }

  for (const node of pathVToLCA) {
    sum += nodes[node].value;
    visited.push(node);
    steps.push({
      type: "climb_v",
      description: `頂点 ${node} (値=${nodes[node].value}) を加算。累積 = ${sum}`,
      highlightNodes: [node],
      pathNodes: fullPath,
      currentU: queryU,
      currentV: node,
      lca,
      accumulated: sum,
      visitedOnPath: [...visited],
    });
  }

  steps.push({
    type: "done",
    description: `パスクエリ完了。${queryU} → ${queryV} の頂点値の合計 = ${sum}`,
    highlightNodes: [],
    pathNodes: fullPath,
    currentU: queryU,
    currentV: queryV,
    lca,
    accumulated: sum,
    visitedOnPath: [...visited],
  });

  return steps;
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

export default function TreePathQueryAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [positions, setPositions] = useState<NodePosition[]>([]);
  const [treeEdges] = useState<[number, number][]>(DEFAULT_EDGES);

  const run = useCallback(() => {
    const treeNodes = buildTree(DEFAULT_N, treeEdges, DEFAULT_VALUES);
    setNodes(treeNodes);
    setPositions(computeLayout(treeNodes));
    const s = generateSteps(
      DEFAULT_N,
      treeEdges,
      DEFAULT_VALUES,
      DEFAULT_U,
      DEFAULT_V
    );
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
  if (!step || nodes.length === 0 || positions.length === 0) return null;

  const svgWidth = Math.max(...positions.map((p) => p.x)) + 80;
  const svgHeight = Math.max(...positions.map((p) => p.y)) + 60;

  const getNodeColor = (nodeId: number) => {
    if (step.highlightNodes.includes(nodeId) && step.type === "find_lca") {
      return { fill: "#d1fae5", stroke: "#10b981" }; // green - LCA
    }
    if (step.highlightNodes.includes(nodeId)) {
      return { fill: "#dbeafe", stroke: "#60a5fa" }; // blue - current
    }
    if (step.visitedOnPath.includes(nodeId)) {
      return { fill: "#d1fae5", stroke: "#10b981" }; // green - accumulated
    }
    if (step.pathNodes.includes(nodeId)) {
      return { fill: "#fef3c7", stroke: "#f59e0b" }; // amber - on path
    }
    return { fill: "#ffffff", stroke: "#d1d5db" }; // white
  };

  const isPathEdge = (u: number, v: number) => {
    const uIdx = step.pathNodes.indexOf(u);
    const vIdx = step.pathNodes.indexOf(v);
    return uIdx !== -1 && vIdx !== -1 && Math.abs(uIdx - vIdx) === 1;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">木上のパスクエリ</h1>
        <p className="text-sm text-muted-foreground mb-6">
          頂点 {DEFAULT_U} から頂点 {DEFAULT_V} へのパス上の値の合計を求める
        </p>

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
              const onPath = isPathEdge(parent, child);
              return (
                <line
                  key={idx}
                  x1={positions[parent].x}
                  y1={positions[parent].y}
                  x2={positions[child].x}
                  y2={positions[child].y}
                  stroke={onPath ? "#f59e0b" : "#d1d5db"}
                  strokeWidth={onPath ? 3 : 2}
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
                    r={22}
                    fill={color.fill}
                    stroke={color.stroke}
                    strokeWidth={2}
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 3}
                    textAnchor="middle"
                    className="text-xs font-mono"
                    fill="#374151"
                  >
                    {node.id}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 10}
                    textAnchor="middle"
                    className="text-[10px] font-mono"
                    fill="#6b7280"
                  >
                    val={node.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.lca >= 0 && (
            <span>
              LCA ={" "}
              <span className="font-mono font-semibold text-foreground">
                {step.lca}
              </span>
            </span>
          )}
          <span>
            累積値 ={" "}
            <span className="font-mono font-semibold text-foreground">
              {step.accumulated}
            </span>
          </span>
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
            <span>現在処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>パス上</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>累積済み / LCA</span>
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
