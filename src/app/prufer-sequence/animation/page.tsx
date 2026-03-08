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
  | "find_leaf"
  | "record_neighbor"
  | "remove_leaf"
  | "encode_done"
  | "decode_start"
  | "decode_step"
  | "done";

interface Step {
  type: StepType;
  description: string;
  currentLeaf: number;
  neighbor: number;
  pruferSeq: number[];
  remainingNodes: number[];
  degree: number[];
  removedEdges: Set<string>;
  highlightNodes: number[];
  // For decoding phase
  decodedEdges: [number, number][];
}

// --- Default tree ---

function defaultTree(): Tree {
  // Labeled tree: 0-1, 0-2, 0-3, 3-4
  return {
    nodes: [0, 1, 2, 3, 4],
    edges: [
      [0, 1],
      [0, 2],
      [0, 3],
      [3, 4],
    ],
  };
}

function getNodePositions(): { x: number; y: number }[] {
  return [
    { x: 250, y: 80 },  // 0
    { x: 120, y: 180 }, // 1
    { x: 250, y: 180 }, // 2
    { x: 380, y: 180 }, // 3
    { x: 380, y: 280 }, // 4
  ];
}

// --- Step generation (encoding) ---

function generateSteps(tree: Tree): Step[] {
  const { nodes, edges } = tree;
  const n = nodes.length;
  const steps: Step[] = [];

  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const degree = nodes.map((v) => adj[v].length);
  const pruferSeq: number[] = [];
  const removed = new Set<number>();
  const removedEdges = new Set<string>();

  steps.push({
    type: "init",
    description: `Prufer列のエンコードを開始。${n}頂点の木 → 長さ${n - 2}のPrufer列`,
    currentLeaf: -1,
    neighbor: -1,
    pruferSeq: [],
    remainingNodes: [...nodes],
    degree: [...degree],
    removedEdges: new Set(),
    highlightNodes: [],
    decodedEdges: [],
  });

  // Encode: remove n-2 leaves
  for (let iter = 0; iter < n - 2; iter++) {
    // Find smallest leaf
    let leaf = -1;
    for (let v = 0; v < n; v++) {
      if (!removed.has(v) && degree[v] === 1) {
        leaf = v;
        break;
      }
    }

    steps.push({
      type: "find_leaf",
      description: `最小の葉を探す → ノード ${leaf}`,
      currentLeaf: leaf,
      neighbor: -1,
      pruferSeq: [...pruferSeq],
      remainingNodes: nodes.filter((v) => !removed.has(v)),
      degree: [...degree],
      removedEdges: new Set(removedEdges),
      highlightNodes: [leaf],
      decodedEdges: [],
    });

    // Find its neighbor
    let neighbor = -1;
    for (const v of adj[leaf]) {
      if (!removed.has(v)) {
        neighbor = v;
        break;
      }
    }

    pruferSeq.push(neighbor);

    steps.push({
      type: "record_neighbor",
      description: `葉 ${leaf} の隣接ノード ${neighbor} をPrufer列に記録`,
      currentLeaf: leaf,
      neighbor: neighbor,
      pruferSeq: [...pruferSeq],
      remainingNodes: nodes.filter((v) => !removed.has(v)),
      degree: [...degree],
      removedEdges: new Set(removedEdges),
      highlightNodes: [leaf, neighbor],
      decodedEdges: [],
    });

    // Remove leaf
    removed.add(leaf);
    degree[leaf] = 0;
    degree[neighbor]--;
    const edgeKey = Math.min(leaf, neighbor) + "-" + Math.max(leaf, neighbor);
    removedEdges.add(edgeKey);

    steps.push({
      type: "remove_leaf",
      description: `ノード ${leaf} を削除`,
      currentLeaf: -1,
      neighbor: -1,
      pruferSeq: [...pruferSeq],
      remainingNodes: nodes.filter((v) => !removed.has(v)),
      degree: [...degree],
      removedEdges: new Set(removedEdges),
      highlightNodes: [],
      decodedEdges: [],
    });
  }

  steps.push({
    type: "encode_done",
    description: `エンコード完了。Prufer列: [${pruferSeq.join(", ")}]`,
    currentLeaf: -1,
    neighbor: -1,
    pruferSeq: [...pruferSeq],
    remainingNodes: nodes.filter((v) => !removed.has(v)),
    degree: [...degree],
    removedEdges: new Set(removedEdges),
    highlightNodes: [],
    decodedEdges: [],
  });

  // Decode phase
  steps.push({
    type: "decode_start",
    description: "デコード: Prufer列から木を復元",
    currentLeaf: -1,
    neighbor: -1,
    pruferSeq: [...pruferSeq],
    remainingNodes: [...nodes],
    degree: new Array(n).fill(0),
    removedEdges: new Set(),
    highlightNodes: [],
    decodedEdges: [],
  });

  // Compute degree from Prufer sequence
  const decodeDegree = new Array(n).fill(1);
  for (const v of pruferSeq) {
    decodeDegree[v]++;
  }

  const decodedEdges: [number, number][] = [];

  for (const v of pruferSeq) {
    // Find smallest leaf (degree 1)
    let leaf = -1;
    for (let u = 0; u < n; u++) {
      if (decodeDegree[u] === 1) {
        leaf = u;
        break;
      }
    }

    decodedEdges.push([leaf, v]);
    decodeDegree[leaf]--;
    decodeDegree[v]--;

    steps.push({
      type: "decode_step",
      description: `Prufer列の値 ${v}: 最小の次数1ノード ${leaf} と接続。辺 (${leaf}, ${v}) を追加`,
      currentLeaf: leaf,
      neighbor: v,
      pruferSeq: [...pruferSeq],
      remainingNodes: [...nodes],
      degree: [...decodeDegree],
      removedEdges: new Set(),
      highlightNodes: [leaf, v],
      decodedEdges: [...decodedEdges],
    });
  }

  // Last edge: two remaining degree-1 vertices
  const lastTwo = nodes.filter((v) => decodeDegree[v] === 1);
  if (lastTwo.length === 2) {
    decodedEdges.push([lastTwo[0], lastTwo[1]]);
    steps.push({
      type: "decode_step",
      description: `残りの2頂点 ${lastTwo[0]} と ${lastTwo[1]} を接続`,
      currentLeaf: lastTwo[0],
      neighbor: lastTwo[1],
      pruferSeq: [...pruferSeq],
      remainingNodes: [...nodes],
      degree: [...decodeDegree],
      removedEdges: new Set(),
      highlightNodes: lastTwo,
      decodedEdges: [...decodedEdges],
    });
  }

  steps.push({
    type: "done",
    description: "デコード完了。元の木を復元しました",
    currentLeaf: -1,
    neighbor: -1,
    pruferSeq: [...pruferSeq],
    remainingNodes: [...nodes],
    degree: [...decodeDegree],
    removedEdges: new Set(),
    highlightNodes: [],
    decodedEdges: [...decodedEdges],
  });

  return steps;
}

// --- Component ---

export default function PruferSequenceAnimationPage() {
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

  // Check if we are in decode phase
  const isDecodePhase =
    step.type === "decode_start" ||
    (step.type === "decode_step") ||
    (step.type === "done" && step.decodedEdges.length > 0);

  function getNodeColor(idx: number): string {
    if (step.highlightNodes.includes(idx)) {
      if (idx === step.currentLeaf) return "fill-red-100 stroke-red-500";
      return "fill-blue-100 stroke-blue-400";
    }
    if (!isDecodePhase && !step.remainingNodes.includes(idx)) {
      return "fill-gray-100 stroke-gray-300";
    }
    return "fill-white stroke-gray-300";
  }

  function getEdgeColor(u: number, v: number): string {
    const key = Math.min(u, v) + "-" + Math.max(u, v);
    if (!isDecodePhase && step.removedEdges.has(key)) {
      return "stroke-gray-200";
    }
    return "stroke-gray-300";
  }

  const displayEdges = isDecodePhase ? step.decodedEdges : tree.edges;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Prufer Sequence</h1>
        <p className="text-sm text-muted-foreground mb-6">
          ラベル付き木とPrufer列の全単射
        </p>

        {/* Tree SVG */}
        <div className="mb-6 flex justify-center">
          <svg
            width={500}
            height={340}
            className="border border-border rounded"
          >
            {(isDecodePhase ? step.decodedEdges : tree.edges).map(([u, v], i) => (
              <line
                key={`e-${i}`}
                x1={positions[u].x}
                y1={positions[u].y}
                x2={positions[v].x}
                y2={positions[v].y}
                className={isDecodePhase ? "stroke-emerald-400" : getEdgeColor(u, v)}
                strokeWidth={2}
                strokeDasharray={
                  !isDecodePhase && step.removedEdges.has(Math.min(u, v) + "-" + Math.max(u, v))
                    ? "4"
                    : undefined
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

        {/* Prufer Sequence */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Prufer列
          </div>
          <div className="flex gap-1">
            {step.pruferSeq.length === 0 ? (
              <span className="text-xs text-muted-foreground">(空)</span>
            ) : (
              step.pruferSeq.map((val, i) => (
                <div
                  key={i}
                  className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 bg-white text-sm font-mono"
                >
                  {val}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
          <span>
            フェーズ:{" "}
            <span className="font-semibold text-foreground">
              {isDecodePhase ? "デコード" : "エンコード"}
            </span>
          </span>
        </div>

        {/* Description */}
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>削除する葉</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>隣接ノード</span>
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
      </div>
    </div>
  );
}
