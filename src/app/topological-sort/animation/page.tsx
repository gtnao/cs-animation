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
  | "enqueue"
  | "dequeue"
  | "decrement"
  | "done";

interface Step {
  type: StepType;
  inDegree: number[];
  queue: number[];
  result: number[];
  currentNode: number;
  highlightEdge: [number, number] | null;
  description: string;
}

// --- Step generation (Kahn's algorithm) ---

function generateSteps(graph: GraphInput): Step[] {
  const { nodeCount, edges } = graph;
  const steps: Step[] = [];

  const adj: number[][] = Array.from({ length: nodeCount }, () => []);
  const inDegree = new Array(nodeCount).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v);
    inDegree[v]++;
  }

  steps.push({
    type: "init",
    inDegree: [...inDegree],
    queue: [],
    result: [],
    currentNode: -1,
    highlightEdge: null,
    description: `入次数を計算。${inDegree.map((d, i) => `${i}:${d}`).join(", ")}`,
  });

  const queue: number[] = [];
  for (let i = 0; i < nodeCount; i++) {
    if (inDegree[i] === 0) {
      queue.push(i);
    }
  }

  steps.push({
    type: "enqueue",
    inDegree: [...inDegree],
    queue: [...queue],
    result: [],
    currentNode: -1,
    highlightEdge: null,
    description: `入次数 0 の頂点 [${queue.join(", ")}] をキューに追加。`,
  });

  const result: number[] = [];

  while (queue.length > 0) {
    const u = queue.shift()!;

    steps.push({
      type: "dequeue",
      inDegree: [...inDegree],
      queue: [...queue],
      result: [...result],
      currentNode: u,
      highlightEdge: null,
      description: `頂点 ${u} をキューから取り出し、結果に追加。`,
    });

    result.push(u);

    for (const v of adj[u]) {
      inDegree[v]--;

      steps.push({
        type: "decrement",
        inDegree: [...inDegree],
        queue: [...queue],
        result: [...result],
        currentNode: u,
        highlightEdge: [u, v],
        description: `辺 (${u}, ${v}): 頂点 ${v} の入次数を ${inDegree[v] + 1} → ${inDegree[v]} に。${inDegree[v] === 0 ? `入次数 0 → キューに追加。` : ""}`,
      });

      if (inDegree[v] === 0) {
        queue.push(v);
      }
    }
  }

  steps.push({
    type: "done",
    inDegree: [...inDegree],
    queue: [],
    result: [...result],
    currentNode: -1,
    highlightEdge: null,
    description: `完了。トポロジカル順序: [${result.join(", ")}]`,
  });

  return steps;
}

// --- Default graph (DAG) ---

const DEFAULT_GRAPH: GraphInput = {
  nodeCount: 6,
  edges: [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [2, 4],
    [3, 5],
    [4, 5],
  ],
};

// --- Layered layout for DAG ---
function getNodePositions(
  nodeCount: number,
  edges: [number, number][]
): { x: number; y: number }[] {
  // Simple topological layering
  const adj: number[][] = Array.from({ length: nodeCount }, () => []);
  const inDeg = new Array(nodeCount).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v);
    inDeg[v]++;
  }

  const layers: number[][] = [];
  const layer = new Array(nodeCount).fill(-1);
  const queue = [];
  for (let i = 0; i < nodeCount; i++) {
    if (inDeg[i] === 0) queue.push(i);
  }

  let l = 0;
  while (queue.length > 0) {
    const nextQueue: number[] = [];
    layers.push([...queue]);
    for (const u of queue) {
      layer[u] = l;
      for (const v of adj[u]) {
        inDeg[v]--;
        if (inDeg[v] === 0) nextQueue.push(v);
      }
    }
    queue.length = 0;
    queue.push(...nextQueue);
    l++;
  }

  const positions: { x: number; y: number }[] = new Array(nodeCount);
  const totalLayers = layers.length;
  for (let li = 0; li < totalLayers; li++) {
    const nodesInLayer = layers[li];
    const layerWidth = nodesInLayer.length;
    for (let ni = 0; ni < layerWidth; ni++) {
      positions[nodesInLayer[ni]] = {
        x: 80 + (li * 440) / Math.max(totalLayers - 1, 1),
        y: 60 + (ni * 280) / Math.max(layerWidth - 1, 1),
      };
    }
  }

  return positions;
}

export default function TopologicalSortAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const graph = DEFAULT_GRAPH;
  const positions = getNodePositions(graph.nodeCount, graph.edges);

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

  const resultSet = new Set(step.result);
  const queueSet = new Set(step.queue);

  const getNodeFill = (idx: number) => {
    if (idx === step.currentNode) return "fill-blue-100";
    if (resultSet.has(idx)) return "fill-emerald-100";
    if (queueSet.has(idx)) return "fill-amber-50";
    return "fill-white";
  };

  const getNodeStroke = (idx: number) => {
    if (idx === step.currentNode) return "stroke-blue-400";
    if (resultSet.has(idx)) return "stroke-emerald-500";
    if (queueSet.has(idx)) return "stroke-amber-400";
    return "stroke-gray-300";
  };

  const getEdgeColor = (u: number, v: number) => {
    if (
      step.highlightEdge &&
      step.highlightEdge[0] === u &&
      step.highlightEdge[1] === v
    )
      return "stroke-blue-400";
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
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  className="fill-gray-400"
                />
              </marker>
              <marker
                id="arrowhead-blue"
                markerWidth="10"
                markerHeight="7"
                refX="25"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  className="fill-blue-400"
                />
              </marker>
            </defs>
            {graph.edges.map(([u, v], idx) => {
              const p1 = positions[u];
              const p2 = positions[v];
              const color = getEdgeColor(u, v);
              const isHighlight = color === "stroke-blue-400";
              return (
                <line
                  key={`edge-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  className={color}
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

        {/* In-degree display */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            入次数
          </div>
          <div className="flex gap-1 flex-wrap">
            {step.inDegree.map((d, idx) => (
              <div
                key={idx}
                className={`w-10 h-10 flex items-center justify-center border-2 text-sm font-mono ${
                  d === 0 && !resultSet.has(idx)
                    ? "bg-amber-50 border-amber-400"
                    : resultSet.has(idx)
                    ? "bg-emerald-100 border-emerald-500"
                    : "bg-white border-gray-200"
                }`}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap mt-1">
            {step.inDegree.map((_, idx) => (
              <div
                key={idx}
                className="w-10 text-center text-[10px] text-muted-foreground font-mono"
              >
                {idx}
              </div>
            ))}
          </div>
        </div>

        {/* Result */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            結果: [{step.result.join(", ")}]
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
          <span>
            キュー: [{step.queue.join(", ")}]
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
            <span>キュー内</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>確定済み</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200" />
            <span>未処理</span>
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
