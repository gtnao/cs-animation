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
  type:
    | "init"
    | "euler_visit"
    | "euler_return"
    | "build_sparse"
    | "query_range"
    | "query_result";
  description: string;
  highlightNodes: number[];
  eulerTour: number[];
  eulerDepth: number[];
  firstOccurrence: number[];
  sparseTable: number[][];
  queryL: number;
  queryR: number;
  lca: number | null;
  currentEulerIdx: number;
  k?: number;
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
const DEFAULT_U = 6;
const DEFAULT_V = 5;

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
  nodes[0].parent = -1;
  nodes[0].depth = 0;
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

// --- Algorithm step generation ---

function generateSteps(
  n: number,
  edges: [number, number][],
  queryU: number,
  queryV: number
): Step[] {
  const nodes = buildTree(n, edges);
  const steps: Step[] = [];

  // Euler Tour
  const euler: number[] = [];
  const eulerDepth: number[] = [];
  const first: number[] = new Array(n).fill(-1);

  function dfs(u: number) {
    first[u] = euler.length;
    euler.push(u);
    eulerDepth.push(nodes[u].depth);
    for (const c of nodes[u].children) {
      dfs(c);
      euler.push(u);
      eulerDepth.push(nodes[u].depth);
    }
  }

  steps.push({
    type: "init",
    description: "Euler Tour を開始する",
    highlightNodes: [],
    eulerTour: [],
    eulerDepth: [],
    firstOccurrence: new Array(n).fill(-1),
    sparseTable: [],
    queryL: -1,
    queryR: -1,
    lca: null,
    currentEulerIdx: -1,
  });

  // Generate Euler Tour with steps
  const eulerSteps: { euler: number[]; depth: number[]; first: number[]; node: number; type: "visit" | "return" }[] = [];

  function dfsWithSteps(u: number) {
    first[u] = euler.length;
    euler.push(u);
    eulerDepth.push(nodes[u].depth);
    eulerSteps.push({
      euler: [...euler],
      depth: [...eulerDepth],
      first: [...first],
      node: u,
      type: "visit",
    });

    for (const c of nodes[u].children) {
      dfsWithSteps(c);
      euler.push(u);
      eulerDepth.push(nodes[u].depth);
      eulerSteps.push({
        euler: [...euler],
        depth: [...eulerDepth],
        first: [...first],
        node: u,
        type: "return",
      });
    }
  }

  dfsWithSteps(0);

  for (const es of eulerSteps) {
    steps.push({
      type: es.type === "visit" ? "euler_visit" : "euler_return",
      description:
        es.type === "visit"
          ? `頂点 ${es.node} を初訪問。first[${es.node}] = ${es.first[es.node]}`
          : `頂点 ${es.node} に戻る (Euler Tour index = ${es.euler.length - 1})`,
      highlightNodes: [es.node],
      eulerTour: es.euler,
      eulerDepth: es.depth,
      firstOccurrence: es.first,
      sparseTable: [],
      queryL: -1,
      queryR: -1,
      lca: null,
      currentEulerIdx: es.euler.length - 1,
    });
  }

  // Build Sparse Table for RMQ
  const m = euler.length;
  const LOG = Math.max(1, Math.floor(Math.log2(m)));
  const sparse: number[][] = Array.from({ length: LOG + 1 }, () =>
    new Array(m).fill(0)
  );

  // Initialize: sparse[0][i] = index of min depth in [i, i]
  for (let i = 0; i < m; i++) {
    sparse[0][i] = i;
  }

  steps.push({
    type: "build_sparse",
    description: `Sparse Table を構築。配列長 = ${m}, LOG = ${LOG}`,
    highlightNodes: [],
    eulerTour: [...euler],
    eulerDepth: [...eulerDepth],
    firstOccurrence: [...first],
    sparseTable: sparse.map((row) => [...row]),
    queryL: -1,
    queryR: -1,
    lca: null,
    currentEulerIdx: -1,
  });

  for (let k = 1; k <= LOG; k++) {
    for (let i = 0; i + (1 << k) <= m; i++) {
      const left = sparse[k - 1][i];
      const right = sparse[k - 1][i + (1 << (k - 1))];
      sparse[k][i] = eulerDepth[left] <= eulerDepth[right] ? left : right;
    }
    steps.push({
      type: "build_sparse",
      description: `Sparse Table k=${k} を構築 (区間長 2^${k} = ${1 << k})`,
      highlightNodes: [],
      eulerTour: [...euler],
      eulerDepth: [...eulerDepth],
      firstOccurrence: [...first],
      sparseTable: sparse.map((row) => [...row]),
      queryL: -1,
      queryR: -1,
      lca: null,
      currentEulerIdx: -1,
      k,
    });
  }

  // LCA Query
  let l = first[queryU];
  let r = first[queryV];
  if (l > r) [l, r] = [r, l];

  steps.push({
    type: "query_range",
    description: `LCA(${queryU}, ${queryV}): first[${queryU}]=${first[queryU]}, first[${queryV}]=${first[queryV]} → 区間 [${l}, ${r}] の RMQ`,
    highlightNodes: [queryU, queryV],
    eulerTour: [...euler],
    eulerDepth: [...eulerDepth],
    firstOccurrence: [...first],
    sparseTable: sparse.map((row) => [...row]),
    queryL: l,
    queryR: r,
    lca: null,
    currentEulerIdx: -1,
  });

  // RMQ
  const kk = Math.floor(Math.log2(r - l + 1));
  const leftIdx = sparse[kk][l];
  const rightIdx = sparse[kk][r - (1 << kk) + 1];
  const ansIdx = eulerDepth[leftIdx] <= eulerDepth[rightIdx] ? leftIdx : rightIdx;
  const lcaNode = euler[ansIdx];

  steps.push({
    type: "query_result",
    description: `RMQ([${l}, ${r}]): k=${kk}, euler[${ansIdx}] = ${lcaNode}。LCA(${queryU}, ${queryV}) = ${lcaNode}`,
    highlightNodes: [lcaNode],
    eulerTour: [...euler],
    eulerDepth: [...eulerDepth],
    firstOccurrence: [...first],
    sparseTable: sparse.map((row) => [...row]),
    queryL: l,
    queryR: r,
    lca: lcaNode,
    currentEulerIdx: ansIdx,
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

export default function LCAEulerTourAnimationPage() {
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
    const s = generateSteps(DEFAULT_N, treeEdges, DEFAULT_U, DEFAULT_V);
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
    if (step.lca !== null && nodeId === step.lca) {
      return { fill: "#d1fae5", stroke: "#10b981" };
    }
    if (step.highlightNodes.includes(nodeId)) {
      return { fill: "#dbeafe", stroke: "#60a5fa" };
    }
    return { fill: "#ffffff", stroke: "#d1d5db" };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">
          LCA - Euler Tour + Sparse Table
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Euler Tour と RMQ による LCA の求め方を可視化 (クエリ: u={DEFAULT_U},
          v={DEFAULT_V})
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
        {step.eulerTour.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Euler Tour
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {step.eulerTour.map((nodeId, idx) => {
                let cls =
                  "w-8 h-8 flex items-center justify-center border-2 text-xs font-mono transition-colors";
                if (idx === step.currentEulerIdx) {
                  cls += " bg-blue-100 border-blue-400";
                } else if (
                  step.queryL >= 0 &&
                  idx >= step.queryL &&
                  idx <= step.queryR
                ) {
                  cls += " bg-amber-50 border-amber-400";
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
            </div>
          </div>
        )}

        {/* Depth array */}
        {step.eulerDepth.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              深さ配列
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {step.eulerDepth.map((d, idx) => {
                let cls =
                  "w-8 h-8 flex items-center justify-center border-2 text-xs font-mono transition-colors";
                if (idx === step.currentEulerIdx) {
                  cls += " bg-blue-100 border-blue-400";
                } else if (
                  step.queryL >= 0 &&
                  idx >= step.queryL &&
                  idx <= step.queryR
                ) {
                  cls += " bg-amber-50 border-amber-400";
                } else {
                  cls += " bg-white border-gray-200";
                }
                return (
                  <div key={idx} className="flex flex-col items-center gap-0.5">
                    <div className={cls}>{d}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.lca !== null && (
            <span>
              LCA ={" "}
              <span className="font-mono font-semibold text-foreground">
                {step.lca}
              </span>
            </span>
          )}
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
            <span>現在位置</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>クエリ区間</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>LCA</span>
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
