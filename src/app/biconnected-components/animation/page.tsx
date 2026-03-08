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
  | "find_articulation"
  | "pop_component"
  | "done";

interface Step {
  type: StepType;
  currentNode: number;
  disc: number[];
  low: number[];
  articulationPoints: Set<number>;
  edgeStack: [number, number][];
  components: [number, number][][];
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
  const articulationPoints = new Set<number>();
  const edgeStack: [number, number][] = [];
  const components: [number, number][][] = [];
  let timer = 0;

  steps.push({
    type: "init",
    currentNode: -1,
    disc: [...disc],
    low: [...low],
    articulationPoints: new Set(),
    edgeStack: [],
    components: [],
    highlightEdge: null,
    description: "二重頂点連結成分分解を開始。",
  });

  function dfs(u: number, parent: number) {
    disc[u] = low[u] = timer++;
    let children = 0;

    steps.push({
      type: "visit",
      currentNode: u,
      disc: [...disc],
      low: [...low],
      articulationPoints: new Set(articulationPoints),
      edgeStack: [...edgeStack],
      components: components.map((c) => [...c]),
      highlightEdge: null,
      description: `頂点 ${u} を訪問。disc[${u}] = low[${u}] = ${disc[u]}。`,
    });

    for (const { to: v } of adj[u]) {
      if (disc[v] === -1) {
        children++;
        edgeStack.push([u, v]);
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);

        steps.push({
          type: "update_low",
          currentNode: u,
          disc: [...disc],
          low: [...low],
          articulationPoints: new Set(articulationPoints),
          edgeStack: [...edgeStack],
          components: components.map((c) => [...c]),
          highlightEdge: [u, v],
          description: `low[${u}] = min(low[${u}], low[${v}]) = ${low[u]}。`,
        });

        // Check if u is an articulation point
        const isAP =
          (parent === -1 && children > 1) ||
          (parent !== -1 && low[v] >= disc[u]);

        if (isAP) {
          articulationPoints.add(u);
        }

        if (low[v] >= disc[u]) {
          // Pop edges to form a biconnected component
          const comp: [number, number][] = [];
          while (edgeStack.length > 0) {
            const e = edgeStack.pop()!;
            comp.push(e);
            if (e[0] === u && e[1] === v) break;
          }
          components.push(comp);

          steps.push({
            type: "pop_component",
            currentNode: u,
            disc: [...disc],
            low: [...low],
            articulationPoints: new Set(articulationPoints),
            edgeStack: [...edgeStack],
            components: components.map((c) => [...c]),
            highlightEdge: null,
            description: `二重頂点連結成分 #${components.length}: 辺 ${comp.map(([a, b]) => `(${a},${b})`).join(",")}${isAP ? ` (頂点 ${u} は関節点)` : ""}`,
          });
        }
      } else if (v !== parent && disc[v] < disc[u]) {
        edgeStack.push([u, v]);
        low[u] = Math.min(low[u], disc[v]);
        steps.push({
          type: "back_edge",
          currentNode: u,
          disc: [...disc],
          low: [...low],
          articulationPoints: new Set(articulationPoints),
          edgeStack: [...edgeStack],
          components: components.map((c) => [...c]),
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

  steps.push({
    type: "done",
    currentNode: -1,
    disc: [...disc],
    low: [...low],
    articulationPoints: new Set(articulationPoints),
    edgeStack: [],
    components: components.map((c) => [...c]),
    highlightEdge: null,
    description: `完了。関節点: {${Array.from(articulationPoints).join(",")}}, 二重頂点連結成分: ${components.length} 個。`,
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
  "stroke-emerald-500",
  "stroke-blue-400",
  "stroke-amber-400",
  "stroke-red-400",
  "stroke-purple-400",
  "stroke-pink-400",
  "stroke-cyan-400",
];

export default function BiconnectedComponentsAnimationPage() {
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

  // Build edge-to-component map
  const edgeCompMap = new Map<string, number>();
  for (let ci = 0; ci < step.components.length; ci++) {
    for (const [u, v] of step.components[ci]) {
      edgeCompMap.set(`${u}-${v}`, ci);
      edgeCompMap.set(`${v}-${u}`, ci);
    }
  }

  const getEdgeColor = (u: number, v: number) => {
    const key1 = `${u}-${v}`;
    if (edgeCompMap.has(key1)) {
      return COMP_COLORS[edgeCompMap.get(key1)! % COMP_COLORS.length];
    }
    if (
      step.highlightEdge &&
      ((step.highlightEdge[0] === u && step.highlightEdge[1] === v) ||
        (step.highlightEdge[0] === v && step.highlightEdge[1] === u))
    )
      return "stroke-blue-400";
    return "stroke-gray-300";
  };

  const getNodeFill = (idx: number) => {
    if (step.articulationPoints.has(idx)) return "fill-red-100";
    if (idx === step.currentNode) return "fill-blue-100";
    if (step.disc[idx] >= 0) return "fill-gray-50";
    return "fill-white";
  };

  const getNodeStroke = (idx: number) => {
    if (step.articulationPoints.has(idx)) return "stroke-red-500";
    if (idx === step.currentNode) return "stroke-blue-400";
    return "stroke-gray-300";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">二重頂点連結成分分解</h1>
        <p className="text-sm text-muted-foreground mb-6">
          関節点を検出し、グラフを二重頂点連結成分に分解する
        </p>

        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 600 400" className="w-full h-auto max-h-[400px]">
            {graph.edges.map(([u, v], idx) => {
              const p1 = positions[u];
              const p2 = positions[v];
              const color = getEdgeColor(u, v);
              const isComp = edgeCompMap.has(`${u}-${v}`);
              return (
                <line
                  key={`edge-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  className={color}
                  strokeWidth={isComp ? 3 : 1.5}
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
                  <td key={i} className="px-2 py-1 text-center">{d >= 0 ? d : "-"}</td>
                ))}
              </tr>
              <tr>
                <td className="px-2 py-1 text-muted-foreground">low</td>
                {step.low.map((l, i) => (
                  <td key={i} className="px-2 py-1 text-center">{l >= 0 ? l : "-"}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
          <span>関節点: {`{${Array.from(step.articulationPoints).join(",")}}`}</span>
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
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>関節点</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
      </div>
    </div>
  );
}
