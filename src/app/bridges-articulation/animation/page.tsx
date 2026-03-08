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
  | "find_ap"
  | "done";

interface Step {
  type: StepType;
  currentNode: number;
  disc: number[];
  low: number[];
  bridges: [number, number][];
  articulationPoints: Set<number>;
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
  const articulationPoints = new Set<number>();
  let timer = 0;

  steps.push({
    type: "init",
    currentNode: -1,
    disc: [...disc],
    low: [...low],
    bridges: [],
    articulationPoints: new Set(),
    highlightEdge: null,
    description: "橋・関節点検出を開始。DFS で low-link 値を計算する。",
  });

  function dfs(u: number, parentEdge: number) {
    disc[u] = low[u] = timer++;
    let children = 0;

    steps.push({
      type: "visit",
      currentNode: u,
      disc: [...disc],
      low: [...low],
      bridges: bridges.map((b) => [...b] as [number, number]),
      articulationPoints: new Set(articulationPoints),
      highlightEdge: null,
      description: `頂点 ${u} を訪問。disc[${u}] = low[${u}] = ${disc[u]}。`,
    });

    for (const { to: v, idx } of adj[u]) {
      if (idx === parentEdge) continue;

      if (disc[v] === -1) {
        children++;
        dfs(v, idx);
        low[u] = Math.min(low[u], low[v]);

        steps.push({
          type: "update_low",
          currentNode: u,
          disc: [...disc],
          low: [...low],
          bridges: bridges.map((b) => [...b] as [number, number]),
          articulationPoints: new Set(articulationPoints),
          highlightEdge: [u, v],
          description: `low[${u}] = min(low[${u}], low[${v}]) = ${low[u]}。`,
        });

        // Bridge check
        if (low[v] > disc[u]) {
          bridges.push([u, v]);
          steps.push({
            type: "find_bridge",
            currentNode: u,
            disc: [...disc],
            low: [...low],
            bridges: bridges.map((b) => [...b] as [number, number]),
            articulationPoints: new Set(articulationPoints),
            highlightEdge: [u, v],
            description: `low[${v}]=${low[v]} > disc[${u}]=${disc[u]} → 辺 (${u},${v}) は橋!`,
          });
        }

        // Articulation point check (non-root)
        if (parentEdge !== -1 && low[v] >= disc[u]) {
          articulationPoints.add(u);
          steps.push({
            type: "find_ap",
            currentNode: u,
            disc: [...disc],
            low: [...low],
            bridges: bridges.map((b) => [...b] as [number, number]),
            articulationPoints: new Set(articulationPoints),
            highlightEdge: [u, v],
            description: `low[${v}]=${low[v]} >= disc[${u}]=${disc[u]} → 頂点 ${u} は関節点!`,
          });
        }
      } else {
        low[u] = Math.min(low[u], disc[v]);
        steps.push({
          type: "back_edge",
          currentNode: u,
          disc: [...disc],
          low: [...low],
          bridges: bridges.map((b) => [...b] as [number, number]),
          articulationPoints: new Set(articulationPoints),
          highlightEdge: [u, v],
          description: `後退辺 (${u},${v}): low[${u}] = min(low[${u}], disc[${v}]) = ${low[u]}。`,
        });
      }
    }

    // Root articulation point check
    if (parentEdge === -1 && children > 1) {
      articulationPoints.add(u);
      steps.push({
        type: "find_ap",
        currentNode: u,
        disc: [...disc],
        low: [...low],
        bridges: bridges.map((b) => [...b] as [number, number]),
        articulationPoints: new Set(articulationPoints),
        highlightEdge: null,
        description: `DFS 根 ${u} の子が ${children} 個 → 関節点!`,
      });
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
    bridges: bridges.map((b) => [...b] as [number, number]),
    articulationPoints: new Set(articulationPoints),
    highlightEdge: null,
    description: `完了。橋: ${bridges.length} 本、関節点: ${articulationPoints.size} 個。`,
  });

  return steps;
}

// --- Default graph ---

const DEFAULT_GRAPH: GraphInput = {
  nodeCount: 8,
  edges: [
    [0, 1],
    [1, 2],
    [2, 0],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 4],
    [6, 7],
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

export default function BridgesArticulationAnimationPage() {
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
        <h1 className="text-2xl font-bold mb-1">橋・関節点検出</h1>
        <p className="text-sm text-muted-foreground mb-6">
          DFS の low-link 値を用いて橋と関節点を同時に検出する
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
                  strokeWidth={step.articulationPoints.has(idx) ? 3 : 2}
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

        {step.bridges.length > 0 && (
          <div className="mb-2">
            <span className="text-xs text-muted-foreground">
              橋: {step.bridges.map(([u, v]) => `(${u},${v})`).join(", ")}
            </span>
          </div>
        )}
        {step.articulationPoints.size > 0 && (
          <div className="mb-4">
            <span className="text-xs text-muted-foreground">
              関節点: {`{${Array.from(step.articulationPoints).join(", ")}}`}
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
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>関節点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-0.5 bg-red-500" style={{ borderTop: "2px dashed" }} />
            <span>橋</span>
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
