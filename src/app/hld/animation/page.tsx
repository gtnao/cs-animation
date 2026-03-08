"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface TreeNode {
  id: number;
  children: number[];
  parent: number;
  depth: number;
  subtreeSize: number;
  heavyChild: number;
  chainHead: number;
  posInArray: number;
}

interface Step {
  type: "init" | "compute_size" | "assign_heavy" | "decompose" | "query_path" | "done";
  description: string;
  highlightNodes: number[];
  chainColors: Map<number, number>;
  chains: number[][];
  currentChainIdx: number;
  pathSegments: [number, number][];
}

// --- Default tree ---
//        0
//       /|\
//      1  2  3
//     /|   \
//    4  5   6
//   /|
//  7  8

const DEFAULT_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 4],
  [1, 5],
  [2, 6],
  [4, 7],
  [4, 8],
];
const DEFAULT_N = 9;

// --- Build tree ---

function buildTree(n: number, edges: [number, number][]): TreeNode[] {
  const nodes: TreeNode[] = Array.from({ length: n }, (_, i) => ({
    id: i,
    children: [],
    parent: -1,
    depth: 0,
    subtreeSize: 1,
    heavyChild: -1,
    chainHead: i,
    posInArray: -1,
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

// --- Algorithm step generation ---

function generateSteps(n: number, edges: [number, number][]): Step[] {
  const nodes = buildTree(n, edges);
  const steps: Step[] = [];
  const chainColors = new Map<number, number>();
  const chains: number[][] = [];

  steps.push({
    type: "init",
    description: "木を構築。Heavy-Light Decomposition を開始する",
    highlightNodes: [],
    chainColors: new Map(),
    chains: [],
    currentChainIdx: -1,
    pathSegments: [],
  });

  // Compute subtree sizes (post-order)
  function computeSize(u: number): number {
    let size = 1;
    for (const c of nodes[u].children) {
      size += computeSize(c);
    }
    nodes[u].subtreeSize = size;
    return size;
  }
  computeSize(0);

  steps.push({
    type: "compute_size",
    description: `部分木サイズを計算。${nodes.map((nd) => `size[${nd.id}]=${nd.subtreeSize}`).join(", ")}`,
    highlightNodes: [],
    chainColors: new Map(),
    chains: [],
    currentChainIdx: -1,
    pathSegments: [],
  });

  // Assign heavy children
  for (let u = 0; u < n; u++) {
    if (nodes[u].children.length > 0) {
      let heaviest = -1;
      let maxSize = 0;
      for (const c of nodes[u].children) {
        if (nodes[c].subtreeSize > maxSize) {
          maxSize = nodes[c].subtreeSize;
          heaviest = c;
        }
      }
      nodes[u].heavyChild = heaviest;
    }
  }

  const heavyEdges: string[] = [];
  for (let u = 0; u < n; u++) {
    if (nodes[u].heavyChild !== -1) {
      heavyEdges.push(`${u}→${nodes[u].heavyChild}`);
    }
  }

  steps.push({
    type: "assign_heavy",
    description: `ヘビー辺を決定: ${heavyEdges.join(", ")}`,
    highlightNodes: [],
    chainColors: new Map(),
    chains: [],
    currentChainIdx: -1,
    pathSegments: [],
  });

  // Decompose into chains
  let posCounter = 0;

  function decompose(u: number, head: number) {
    nodes[u].chainHead = head;
    nodes[u].posInArray = posCounter++;
    chainColors.set(u, chains.length);

    if (chains.length === 0 || chains[chains.length - 1][0] !== head) {
      chains.push([u]);
    } else {
      chains[chains.length - 1].push(u);
    }

    // Heavy child first
    if (nodes[u].heavyChild !== -1) {
      decompose(nodes[u].heavyChild, head);
    }
    // Light children
    for (const c of nodes[u].children) {
      if (c !== nodes[u].heavyChild) {
        decompose(c, c);
      }
    }
  }

  decompose(0, 0);

  for (let ci = 0; ci < chains.length; ci++) {
    steps.push({
      type: "decompose",
      description: `チェーン ${ci}: [${chains[ci].join(", ")}] (head = ${chains[ci][0]})`,
      highlightNodes: [...chains[ci]],
      chainColors: new Map(chainColors),
      chains: chains.map((c) => [...c]),
      currentChainIdx: ci,
      pathSegments: [],
    });
  }

  // Example path query: from node 7 to node 6
  const queryU = 7;
  const queryV = 6;
  const pathSegs: [number, number][] = [];
  let u = queryU;
  let v = queryV;

  while (nodes[u].chainHead !== nodes[v].chainHead) {
    if (nodes[nodes[u].chainHead].depth < nodes[nodes[v].chainHead].depth) {
      [u, v] = [v, u];
    }
    pathSegs.push([nodes[u].posInArray, nodes[nodes[u].chainHead].posInArray]);

    steps.push({
      type: "query_path",
      description: `パスクエリ (${queryU}→${queryV}): 頂点 ${u} のチェーン [${nodes[u].chainHead}..${u}] を処理。u を ${nodes[nodes[u].chainHead].parent} に移動`,
      highlightNodes: [u, nodes[u].chainHead],
      chainColors: new Map(chainColors),
      chains: chains.map((c) => [...c]),
      currentChainIdx: -1,
      pathSegments: [...pathSegs],
    });

    u = nodes[nodes[u].chainHead].parent;
  }

  if (nodes[u].depth > nodes[v].depth) {
    [u, v] = [v, u];
  }
  pathSegs.push([nodes[u].posInArray, nodes[v].posInArray]);

  steps.push({
    type: "done",
    description: `パスクエリ完了。${queryU} から ${queryV} のパスは ${pathSegs.length} 個のチェーン区間に分解された。LCA = ${u}`,
    highlightNodes: [u],
    chainColors: new Map(chainColors),
    chains: chains.map((c) => [...c]),
    currentChainIdx: -1,
    pathSegments: [...pathSegs],
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
        x: xCounter * 70 + 40,
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

// Chain colors palette
const CHAIN_PALETTE = [
  { fill: "#dbeafe", stroke: "#3b82f6" },
  { fill: "#fef3c7", stroke: "#f59e0b" },
  { fill: "#d1fae5", stroke: "#10b981" },
  { fill: "#fce7f3", stroke: "#ec4899" },
  { fill: "#e0e7ff", stroke: "#6366f1" },
  { fill: "#fed7aa", stroke: "#f97316" },
  { fill: "#ccfbf1", stroke: "#14b8a6" },
];

// --- Component ---

export default function HLDAnimationPage() {
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
    if (step.highlightNodes.includes(nodeId) && step.type === "done") {
      return { fill: "#d1fae5", stroke: "#10b981" };
    }
    const chainIdx = step.chainColors.get(nodeId);
    if (chainIdx !== undefined) {
      return CHAIN_PALETTE[chainIdx % CHAIN_PALETTE.length];
    }
    if (step.highlightNodes.includes(nodeId)) {
      return { fill: "#dbeafe", stroke: "#60a5fa" };
    }
    return { fill: "#ffffff", stroke: "#d1d5db" };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Heavy-Light Decomposition</h1>
        <p className="text-sm text-muted-foreground mb-6">
          木をヘビーチェーンに分解する過程を可視化
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
              const isHeavy = nodes[parent] && nodes[parent].heavyChild === child && step.type !== "init";
              return (
                <line
                  key={idx}
                  x1={positions[parent].x}
                  y1={positions[parent].y}
                  x2={positions[child].x}
                  y2={positions[child].y}
                  stroke={isHeavy ? "#3b82f6" : "#d1d5db"}
                  strokeWidth={isHeavy ? 4 : 2}
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

        {/* Chains list */}
        {step.chains.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              チェーン一覧
            </div>
            <div className="flex flex-wrap gap-2">
              {step.chains.map((chain, ci) => (
                <div
                  key={ci}
                  className={`px-3 py-1 border-2 rounded text-xs font-mono ${
                    ci === step.currentChainIdx
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                  style={{
                    borderColor: CHAIN_PALETTE[ci % CHAIN_PALETTE.length].stroke,
                    backgroundColor: CHAIN_PALETTE[ci % CHAIN_PALETTE.length].fill,
                  }}
                >
                  Chain {ci}: [{chain.join(", ")}]
                </div>
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" />
            <span>現在のチェーン</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>LCA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-0.5 bg-blue-500" />
            <span>ヘビー辺</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-0.5 bg-gray-300" />
            <span>ライト辺</span>
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
