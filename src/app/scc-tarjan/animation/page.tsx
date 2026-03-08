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
  | "visit"
  | "explore_edge"
  | "back_edge"
  | "update_low"
  | "pop_scc"
  | "done";

interface Step {
  type: StepType;
  currentNode: number;
  disc: number[];
  low: number[];
  onStack: boolean[];
  stack: number[];
  sccList: number[][];
  sccId: number[];
  highlightEdge: [number, number] | null;
  description: string;
}

// --- Step generation (Tarjan's SCC) ---

function generateSteps(graph: GraphInput): Step[] {
  const { nodeCount, edges } = graph;
  const steps: Step[] = [];
  const adj: number[][] = Array.from({ length: nodeCount }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
  }

  const disc = new Array(nodeCount).fill(-1);
  const low = new Array(nodeCount).fill(-1);
  const onStack = new Array(nodeCount).fill(false);
  const stack: number[] = [];
  const sccList: number[][] = [];
  const sccId = new Array(nodeCount).fill(-1);
  let timer = 0;

  steps.push({
    type: "init",
    currentNode: -1,
    disc: [...disc],
    low: [...low],
    onStack: [...onStack],
    stack: [...stack],
    sccList: [],
    sccId: [...sccId],
    highlightEdge: null,
    description: "Tarjan の SCC アルゴリズムを開始。",
  });

  function dfs(u: number) {
    disc[u] = low[u] = timer++;
    stack.push(u);
    onStack[u] = true;

    steps.push({
      type: "visit",
      currentNode: u,
      disc: [...disc],
      low: [...low],
      onStack: [...onStack],
      stack: [...stack],
      sccList: sccList.map((s) => [...s]),
      sccId: [...sccId],
      highlightEdge: null,
      description: `頂点 ${u} を訪問。disc[${u}] = low[${u}] = ${disc[u]}。スタックに追加。`,
    });

    for (const v of adj[u]) {
      if (disc[v] === -1) {
        steps.push({
          type: "explore_edge",
          currentNode: u,
          disc: [...disc],
          low: [...low],
          onStack: [...onStack],
          stack: [...stack],
          sccList: sccList.map((s) => [...s]),
          sccId: [...sccId],
          highlightEdge: [u, v],
          description: `辺 (${u}, ${v}): 頂点 ${v} は未訪問。DFS を再帰。`,
        });
        dfs(v);
        low[u] = Math.min(low[u], low[v]);

        steps.push({
          type: "update_low",
          currentNode: u,
          disc: [...disc],
          low: [...low],
          onStack: [...onStack],
          stack: [...stack],
          sccList: sccList.map((s) => [...s]),
          sccId: [...sccId],
          highlightEdge: [u, v],
          description: `low[${u}] = min(low[${u}], low[${v}]) = ${low[u]}。`,
        });
      } else if (onStack[v]) {
        low[u] = Math.min(low[u], disc[v]);
        steps.push({
          type: "back_edge",
          currentNode: u,
          disc: [...disc],
          low: [...low],
          onStack: [...onStack],
          stack: [...stack],
          sccList: sccList.map((s) => [...s]),
          sccId: [...sccId],
          highlightEdge: [u, v],
          description: `辺 (${u}, ${v}): 頂点 ${v} はスタック上。low[${u}] = min(low[${u}], disc[${v}]) = ${low[u]}。`,
        });
      }
    }

    // Root of SCC
    if (low[u] === disc[u]) {
      const scc: number[] = [];
      let w: number;
      do {
        w = stack.pop()!;
        onStack[w] = false;
        sccId[w] = sccList.length;
        scc.push(w);
      } while (w !== u);
      sccList.push(scc);

      steps.push({
        type: "pop_scc",
        currentNode: u,
        disc: [...disc],
        low: [...low],
        onStack: [...onStack],
        stack: [...stack],
        sccList: sccList.map((s) => [...s]),
        sccId: [...sccId],
        highlightEdge: null,
        description: `low[${u}] == disc[${u}] → SCC の根。SCC = {${scc.join(", ")}} を確定。`,
      });
    }
  }

  for (let i = 0; i < nodeCount; i++) {
    if (disc[i] === -1) {
      dfs(i);
    }
  }

  steps.push({
    type: "done",
    currentNode: -1,
    disc: [...disc],
    low: [...low],
    onStack: [...onStack],
    stack: [...stack],
    sccList: sccList.map((s) => [...s]),
    sccId: [...sccId],
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

export default function SccTarjanAnimationPage() {
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

  const getNodeFill = (idx: number) => {
    if (step.sccId[idx] >= 0) {
      return SCC_COLORS[step.sccId[idx] % SCC_COLORS.length].fill;
    }
    if (idx === step.currentNode) return "fill-blue-100";
    if (step.onStack[idx]) return "fill-amber-50";
    if (step.disc[idx] >= 0) return "fill-gray-100";
    return "fill-white";
  };

  const getNodeStroke = (idx: number) => {
    if (step.sccId[idx] >= 0) {
      return SCC_COLORS[step.sccId[idx] % SCC_COLORS.length].stroke;
    }
    if (idx === step.currentNode) return "stroke-blue-400";
    if (step.onStack[idx]) return "stroke-amber-400";
    return "stroke-gray-300";
  };

  return (
    <>
{/* Graph SVG */}
        <div className="mb-6 border border-border rounded p-4">
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
              <marker
                id="arrowhead-blue"
                markerWidth="10"
                markerHeight="7"
                refX="25"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" className="fill-blue-400" />
              </marker>
            </defs>
            {graph.edges.map(([u, v], idx) => {
              const p1 = positions[u];
              const p2 = positions[v];
              const isHighlight =
                step.highlightEdge &&
                step.highlightEdge[0] === u &&
                step.highlightEdge[1] === v;
              return (
                <line
                  key={`edge-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  className={
                    isHighlight ? "stroke-blue-400" : "stroke-gray-300"
                  }
                  strokeWidth={isHighlight ? 2.5 : 1.5}
                  markerEnd={
                    isHighlight
                      ? "url(#arrowhead-blue)"
                      : "url(#arrowhead)"
                  }
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

        {/* disc/low table */}
        <div className="mb-4 overflow-x-auto">
          <table className="text-xs font-mono border-collapse">
            <thead>
              <tr>
                <td className="px-2 py-1 text-muted-foreground">頂点</td>
                {Array.from({ length: graph.nodeCount }, (_, i) => (
                  <td key={i} className="px-2 py-1 text-center">
                    {i}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-1 text-muted-foreground">disc</td>
                {step.disc.map((d, i) => (
                  <td key={i} className="px-2 py-1 text-center">
                    {d >= 0 ? d : "-"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-2 py-1 text-muted-foreground">low</td>
                {step.low.map((l, i) => (
                  <td key={i} className="px-2 py-1 text-center">
                    {l >= 0 ? l : "-"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Stack */}
        <div className="mb-4">
          <span className="text-xs text-muted-foreground">
            スタック: [{step.stack.join(", ")}]
          </span>
        </div>

        {/* SCC list */}
        {step.sccList.length > 0 && (
          <div className="mb-4">
            <span className="text-xs text-muted-foreground">
              SCC: {step.sccList.map((s, i) => `{${s.join(",")}}`).join(", ")}
            </span>
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>スタック上</span>
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
    </>
  );
}
