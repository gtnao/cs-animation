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
  | "back_edge"
  | "update_low"
  | "find_bridge"
  | "assign_component"
  | "done";

interface Step {
  type: StepType;
  currentNode: number;
  disc: number[];
  low: number[];
  bridges: [number, number][];
  componentId: number[];
  highlightEdge: [number, number] | null;
  description: string;
}

// --- Step generation ---

function generateSteps(graph: GraphInput): Step[] {
  const { nodeCount, edges } = graph;
  const steps: Step[] = [];

  const adj: { to: number; idx: number }[][] = Array.from(
    { length: nodeCount },
    () => []
  );
  for (let i = 0; i < edges.length; i++) {
    const [u, v] = edges[i];
    adj[u].push({ to: v, idx: i });
    adj[v].push({ to: u, idx: i });
  }

  const disc = new Array(nodeCount).fill(-1);
  const low = new Array(nodeCount).fill(-1);
  const bridges: [number, number][] = [];
  let timer = 0;

  steps.push({
    type: "init",
    currentNode: -1,
    disc: [...disc],
    low: [...low],
    bridges: [],
    componentId: new Array(nodeCount).fill(-1),
    highlightEdge: null,
    description: "二重辺連結成分分解を開始。まず橋を検出する。",
  });

  function dfs(u: number, parentEdge: number) {
    disc[u] = low[u] = timer++;

    steps.push({
      type: "visit",
      currentNode: u,
      disc: [...disc],
      low: [...low],
      bridges: [...bridges],
      componentId: new Array(nodeCount).fill(-1),
      highlightEdge: null,
      description: `頂点 ${u} を訪問。disc[${u}] = low[${u}] = ${disc[u]}。`,
    });

    for (const { to: v, idx } of adj[u]) {
      if (idx === parentEdge) continue;
      if (disc[v] === -1) {
        dfs(v, idx);
        low[u] = Math.min(low[u], low[v]);

        steps.push({
          type: "update_low",
          currentNode: u,
          disc: [...disc],
          low: [...low],
          bridges: [...bridges],
          componentId: new Array(nodeCount).fill(-1),
          highlightEdge: [u, v],
          description: `low[${u}] = min(low[${u}], low[${v}]) = ${low[u]}。`,
        });

        if (low[v] > disc[u]) {
          bridges.push([u, v]);
          steps.push({
            type: "find_bridge",
            currentNode: u,
            disc: [...disc],
            low: [...low],
            bridges: bridges.map((b) => [...b] as [number, number]),
            componentId: new Array(nodeCount).fill(-1),
            highlightEdge: [u, v],
            description: `low[${v}]=${low[v]} > disc[${u}]=${disc[u]} → 辺 (${u},${v}) は橋。`,
          });
        }
      } else {
        low[u] = Math.min(low[u], disc[v]);
        steps.push({
          type: "back_edge",
          currentNode: u,
          disc: [...disc],
          low: [...low],
          bridges: [...bridges],
          componentId: new Array(nodeCount).fill(-1),
          highlightEdge: [u, v],
          description: `後退辺 (${u},${v}): low[${u}] = min(low[${u}], disc[${v}]) = ${low[u]}。`,
        });
      }
    }
  }

  for (let i = 0; i < nodeCount; i++) {
    if (disc[i] === -1) {
      dfs(i, -1);
    }
  }

  // Assign components by removing bridges
  const bridgeSet = new Set<string>();
  for (const [u, v] of bridges) {
    bridgeSet.add(`${u}-${v}`);
    bridgeSet.add(`${v}-${u}`);
  }

  const componentId = new Array(nodeCount).fill(-1);
  let compCount = 0;
  for (let i = 0; i < nodeCount; i++) {
    if (componentId[i] !== -1) continue;
    const queue = [i];
    componentId[i] = compCount;
    while (queue.length > 0) {
      const u = queue.shift()!;
      for (const { to: v } of adj[u]) {
        if (componentId[v] !== -1) continue;
        if (bridgeSet.has(`${u}-${v}`)) continue;
        componentId[v] = compCount;
        queue.push(v);
      }
    }
    compCount++;
  }

  steps.push({
    type: "assign_component",
    currentNode: -1,
    disc: [...disc],
    low: [...low],
    bridges: bridges.map((b) => [...b] as [number, number]),
    componentId: [...componentId],
    highlightEdge: null,
    description: `橋を除いた連結成分で分解。${compCount} 個の二重辺連結成分を検出。`,
  });

  steps.push({
    type: "done",
    currentNode: -1,
    disc: [...disc],
    low: [...low],
    bridges: bridges.map((b) => [...b] as [number, number]),
    componentId: [...componentId],
    highlightEdge: null,
    description: `完了。橋: ${bridges.length} 本、二重辺連結成分: ${compCount} 個。`,
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
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 4],
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

const COMP_COLORS = [
  { fill: "fill-emerald-100", stroke: "stroke-emerald-500" },
  { fill: "fill-blue-100", stroke: "stroke-blue-400" },
  { fill: "fill-amber-100", stroke: "stroke-amber-400" },
  { fill: "fill-red-100", stroke: "stroke-red-400" },
  { fill: "fill-purple-100", stroke: "stroke-purple-400" },
  { fill: "fill-pink-100", stroke: "stroke-pink-400" },
  { fill: "fill-cyan-100", stroke: "stroke-cyan-400" },
];

export default function TwoEdgeCCAnimationPage() {
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

  const bridgeSet = new Set<string>();
  for (const [u, v] of step.bridges) {
    bridgeSet.add(`${u}-${v}`);
    bridgeSet.add(`${v}-${u}`);
  }

  const getNodeFill = (idx: number) => {
    if (step.componentId[idx] >= 0) {
      return COMP_COLORS[step.componentId[idx] % COMP_COLORS.length].fill;
    }
    if (idx === step.currentNode) return "fill-blue-100";
    if (step.disc[idx] >= 0) return "fill-gray-100";
    return "fill-white";
  };

  const getNodeStroke = (idx: number) => {
    if (step.componentId[idx] >= 0) {
      return COMP_COLORS[step.componentId[idx] % COMP_COLORS.length].stroke;
    }
    if (idx === step.currentNode) return "stroke-blue-400";
    return "stroke-gray-300";
  };

  const getEdgeColor = (u: number, v: number) => {
    if (bridgeSet.has(`${u}-${v}`)) return "stroke-red-500";
    if (
      step.highlightEdge &&
      ((step.highlightEdge[0] === u && step.highlightEdge[1] === v) ||
        (step.highlightEdge[0] === v && step.highlightEdge[1] === u))
    )
      return "stroke-blue-400";
    return "stroke-gray-300";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">二重辺連結成分分解</h1>
        <p className="text-sm text-muted-foreground mb-6">
          橋を検出し、橋を除いた連結成分に分解する
        </p>

        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 600 400" className="w-full h-auto max-h-[400px]">
            {graph.edges.map(([u, v], idx) => {
              const p1 = positions[u];
              const p2 = positions[v];
              const color = getEdgeColor(u, v);
              const isBridge = bridgeSet.has(`${u}-${v}`);
              return (
                <line
                  key={`edge-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  className={color}
                  strokeWidth={isBridge ? 3 : 1.5}
                  strokeDasharray={isBridge ? "6,3" : "none"}
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
                  <td key={i} className="px-2 py-1 text-center">{i}</td>
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

        {step.bridges.length > 0 && (
          <div className="mb-4">
            <span className="text-xs text-muted-foreground">
              橋: {step.bridges.map(([u, v]) => `(${u},${v})`).join(", ")}
            </span>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-0.5 bg-red-500" style={{ borderTop: "2px dashed" }} />
            <span>橋</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>成分</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }}
            disabled={currentStep === 0}
          >
            ← 前へ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }}
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
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>
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
