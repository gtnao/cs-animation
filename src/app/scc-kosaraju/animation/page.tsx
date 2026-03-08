"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface GraphInput {
  nodeCount: number;
  edges: [number, number][];
}

type StepType =
  | "init"
  | "dfs1_visit"
  | "dfs1_finish"
  | "dfs1_done"
  | "dfs2_start"
  | "dfs2_visit"
  | "dfs2_scc"
  | "done";

interface Step {
  type: StepType;
  phase: 1 | 2;
  currentNode: number;
  visited: boolean[];
  finishOrder: number[];
  sccList: number[][];
  sccId: number[];
  currentScc: number[];
  highlightEdge: [number, number] | null;
  description: string;
}

// --- Step generation (Kosaraju) ---

function generateSteps(graph: GraphInput): Step[] {
  const { nodeCount, edges } = graph;
  const steps: Step[] = [];

  const adj: number[][] = Array.from({ length: nodeCount }, () => []);
  const radj: number[][] = Array.from({ length: nodeCount }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    radj[v].push(u);
  }

  const visited = new Array(nodeCount).fill(false);
  const finishOrder: number[] = [];
  const sccList: number[][] = [];
  const sccId = new Array(nodeCount).fill(-1);

  steps.push({
    type: "init",
    phase: 1,
    currentNode: -1,
    visited: [...visited],
    finishOrder: [],
    sccList: [],
    sccId: [...sccId],
    currentScc: [],
    highlightEdge: null,
    description: "Kosaraju のアルゴリズム開始。第1段階: 元グラフで DFS。",
  });

  // Phase 1: DFS on original graph
  function dfs1(u: number) {
    visited[u] = true;
    steps.push({
      type: "dfs1_visit",
      phase: 1,
      currentNode: u,
      visited: [...visited],
      finishOrder: [...finishOrder],
      sccList: [],
      sccId: [...sccId],
      currentScc: [],
      highlightEdge: null,
      description: `[第1段階] 頂点 ${u} を訪問。`,
    });

    for (const v of adj[u]) {
      if (!visited[v]) {
        dfs1(v);
      }
    }

    finishOrder.push(u);
    steps.push({
      type: "dfs1_finish",
      phase: 1,
      currentNode: u,
      visited: [...visited],
      finishOrder: [...finishOrder],
      sccList: [],
      sccId: [...sccId],
      currentScc: [],
      highlightEdge: null,
      description: `[第1段階] 頂点 ${u} の DFS 完了。帰りがけ順に追加。`,
    });
  }

  for (let i = 0; i < nodeCount; i++) {
    if (!visited[i]) {
      dfs1(i);
    }
  }

  steps.push({
    type: "dfs1_done",
    phase: 1,
    currentNode: -1,
    visited: [...visited],
    finishOrder: [...finishOrder],
    sccList: [],
    sccId: [...sccId],
    currentScc: [],
    highlightEdge: null,
    description: `第1段階完了。帰りがけ順: [${finishOrder.join(", ")}]。第2段階へ。`,
  });

  // Phase 2: DFS on reverse graph in reverse finish order
  visited.fill(false);

  steps.push({
    type: "dfs2_start",
    phase: 2,
    currentNode: -1,
    visited: [...visited],
    finishOrder: [...finishOrder],
    sccList: [],
    sccId: [...sccId],
    currentScc: [],
    highlightEdge: null,
    description: "第2段階: 転置グラフで帰りがけ順の逆順に DFS。",
  });

  let currentScc: number[] = [];

  function dfs2(u: number) {
    visited[u] = true;
    currentScc.push(u);
    sccId[u] = sccList.length;

    steps.push({
      type: "dfs2_visit",
      phase: 2,
      currentNode: u,
      visited: [...visited],
      finishOrder: [...finishOrder],
      sccList: sccList.map((s) => [...s]),
      sccId: [...sccId],
      currentScc: [...currentScc],
      highlightEdge: null,
      description: `[第2段階] 頂点 ${u} を訪問。現在の SCC: {${currentScc.join(", ")}}`,
    });

    for (const v of radj[u]) {
      if (!visited[v]) {
        dfs2(v);
      }
    }
  }

  for (let i = finishOrder.length - 1; i >= 0; i--) {
    const u = finishOrder[i];
    if (!visited[u]) {
      currentScc = [];
      dfs2(u);
      sccList.push([...currentScc]);

      steps.push({
        type: "dfs2_scc",
        phase: 2,
        currentNode: -1,
        visited: [...visited],
        finishOrder: [...finishOrder],
        sccList: sccList.map((s) => [...s]),
        sccId: [...sccId],
        currentScc: [],
        highlightEdge: null,
        description: `SCC #{${sccList.length}}: {${currentScc.join(", ")}} を確定。`,
      });
    }
  }

  steps.push({
    type: "done",
    phase: 2,
    currentNode: -1,
    visited: [...visited],
    finishOrder: [...finishOrder],
    sccList: sccList.map((s) => [...s]),
    sccId: [...sccId],
    currentScc: [],
    highlightEdge: null,
    description: `完了。${sccList.length} 個の強連結成分を検出。`,
  });

  return steps;
}

// --- Default graph ---

const DEFAULT_GRAPH: GraphInput = {
  nodeCount: 7,
  edges: [
    [0, 1],
    [1, 2],
    [2, 0],
    [1, 3],
    [3, 4],
    [4, 5],
    [5, 3],
    [4, 6],
  ],
};

function getNodePositions(n: number): { x: number; y: number }[] {
  const cx = 300;
  const cy = 200;
  const r = 150;
  return Array.from({ length: n }, (_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
  }));
}

const SCC_COLORS = [
  { fill: "fill-emerald-100", stroke: "stroke-emerald-500" },
  { fill: "fill-blue-100", stroke: "stroke-blue-400" },
  { fill: "fill-amber-100", stroke: "stroke-amber-400" },
  { fill: "fill-red-100", stroke: "stroke-red-400" },
  { fill: "fill-purple-100", stroke: "stroke-purple-400" },
  { fill: "fill-pink-100", stroke: "stroke-pink-400" },
  { fill: "fill-cyan-100", stroke: "stroke-cyan-400" },
];

export default function SccKosarajuAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const graph = DEFAULT_GRAPH;
  const positions = getNodePositions(graph.nodeCount);

  const run = useCallback(() => {
    setSteps(generateSteps(graph));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [graph]);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const currentSccSet = new Set(step.currentScc);

  const getNodeFill = (idx: number) => {
    if (step.sccId[idx] >= 0 && !currentSccSet.has(idx)) {
      return SCC_COLORS[step.sccId[idx] % SCC_COLORS.length].fill;
    }
    if (currentSccSet.has(idx)) return "fill-amber-50";
    if (idx === step.currentNode) return "fill-blue-100";
    if (step.visited[idx]) return "fill-gray-100";
    return "fill-white";
  };

  const getNodeStroke = (idx: number) => {
    if (step.sccId[idx] >= 0 && !currentSccSet.has(idx)) {
      return SCC_COLORS[step.sccId[idx] % SCC_COLORS.length].stroke;
    }
    if (currentSccSet.has(idx)) return "stroke-amber-400";
    if (idx === step.currentNode) return "stroke-blue-400";
    return "stroke-gray-300";
  };

  const showReverse = step.phase === 2;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">強連結成分分解 (Kosaraju)</h1>
        <p className="text-sm text-muted-foreground mb-6">
          2回のDFSで有向グラフの強連結成分を求めるアルゴリズム
        </p>

        {/* Graph SVG */}
        <div className="mb-6 border border-border rounded p-4">
          <div className="text-xs text-muted-foreground mb-2">
            {showReverse ? "転置グラフ (逆辺)" : "元グラフ"}
          </div>
          <svg viewBox="0 0 600 400" className="w-full h-auto max-h-[400px]">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="25"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" className="fill-gray-400" />
              </marker>
            </defs>
            {graph.edges.map(([u, v], idx) => {
              const src = showReverse ? v : u;
              const dst = showReverse ? u : v;
              const p1 = positions[src];
              const p2 = positions[dst];
              return (
                <line
                  key={`edge-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  className="stroke-gray-300"
                  strokeWidth={1.5}
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
            {positions.map((pos, idx) => (
              <g key={`node-${idx}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={20}
                  className={`${getNodeFill(idx)} ${getNodeStroke(idx)}`}
                  strokeWidth={2}
                />
                <text
                  x={pos.x}
                  y={pos.y + 5}
                  textAnchor="middle"
                  className="fill-foreground text-sm font-semibold"
                >
                  {idx}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Finish order */}
        <div className="mb-4">
          <span className="text-xs text-muted-foreground">
            帰りがけ順: [{step.finishOrder.join(", ")}]
          </span>
        </div>

        {/* SCC list */}
        {step.sccList.length > 0 && (
          <div className="mb-4">
            <span className="text-xs text-muted-foreground">
              SCC: {step.sccList.map((s) => `{${s.join(",")}}`).join(", ")}
            </span>
          </div>
        )}

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
          <span>
            段階:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.phase}
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>現在のSCC</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>SCC確定</span>
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
