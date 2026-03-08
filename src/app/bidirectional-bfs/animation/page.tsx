"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface GraphNode {
  id: number;
  x: number;
  y: number;
}

interface GraphEdge {
  from: number;
  to: number;
}

interface Step {
  type: "init" | "expand_s" | "expand_t" | "meet" | "done";
  side: "start" | "goal" | "none";
  current: number;
  distS: number[];
  distT: number[];
  queueS: number[];
  queueT: number[];
  meetNode?: number;
  highlightEdge?: [number, number];
  description: string;
}

// --- Default graph ---

const defaultNodes: GraphNode[] = [
  { id: 0, x: 60, y: 160 },
  { id: 1, x: 160, y: 80 },
  { id: 2, x: 160, y: 240 },
  { id: 3, x: 280, y: 80 },
  { id: 4, x: 280, y: 240 },
  { id: 5, x: 400, y: 80 },
  { id: 6, x: 400, y: 240 },
  { id: 7, x: 500, y: 160 },
];

const defaultEdges: GraphEdge[] = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 4 },
  { from: 3, to: 4 },
  { from: 3, to: 5 },
  { from: 4, to: 6 },
  { from: 5, to: 7 },
  { from: 6, to: 7 },
  { from: 1, to: 2 },
];

function buildAdjacency(nodes: GraphNode[], edges: GraphEdge[]): number[][] {
  const adj: number[][] = nodes.map(() => []);
  for (const e of edges) {
    adj[e.from].push(e.to);
    adj[e.to].push(e.from);
  }
  return adj;
}

// --- Step generation ---

function generateSteps(
  nodes: GraphNode[],
  edges: GraphEdge[],
  start: number,
  goal: number
): Step[] {
  const n = nodes.length;
  const adj = buildAdjacency(nodes, edges);
  const steps: Step[] = [];
  const distS = new Array(n).fill(-1);
  const distT = new Array(n).fill(-1);
  const queueS: number[] = [];
  const queueT: number[] = [];

  distS[start] = 0;
  distT[goal] = 0;
  queueS.push(start);
  queueT.push(goal);

  steps.push({
    type: "init",
    side: "none",
    current: -1,
    distS: [...distS],
    distT: [...distT],
    queueS: [...queueS],
    queueT: [...queueT],
    description: `始点 ${start} とゴール ${goal} をそれぞれのキューに追加`,
  });

  while (queueS.length > 0 || queueT.length > 0) {
    // Expand from start side
    if (queueS.length > 0) {
      const u = queueS.shift()!;

      steps.push({
        type: "expand_s",
        side: "start",
        current: u,
        distS: [...distS],
        distT: [...distT],
        queueS: [...queueS],
        queueT: [...queueT],
        description: `始点側: 頂点 ${u} を展開 (dist = ${distS[u]})`,
      });

      for (const v of adj[u]) {
        if (distS[v] === -1) {
          distS[v] = distS[u] + 1;
          queueS.push(v);
        }
        if (distT[v] >= 0) {
          steps.push({
            type: "meet",
            side: "start",
            current: u,
            distS: [...distS],
            distT: [...distT],
            queueS: [...queueS],
            queueT: [...queueT],
            meetNode: v,
            highlightEdge: [u, v],
            description: `出会い！頂点 ${v} で合流。最短距離 = ${distS[v]} + ${distT[v]} = ${distS[v] + distT[v]}`,
          });
          return steps;
        }
      }
    }

    // Expand from goal side
    if (queueT.length > 0) {
      const u = queueT.shift()!;

      steps.push({
        type: "expand_t",
        side: "goal",
        current: u,
        distS: [...distS],
        distT: [...distT],
        queueS: [...queueS],
        queueT: [...queueT],
        description: `ゴール側: 頂点 ${u} を展開 (dist = ${distT[u]})`,
      });

      for (const v of adj[u]) {
        if (distT[v] === -1) {
          distT[v] = distT[u] + 1;
          queueT.push(v);
        }
        if (distS[v] >= 0) {
          steps.push({
            type: "meet",
            side: "goal",
            current: u,
            distS: [...distS],
            distT: [...distT],
            queueS: [...queueS],
            queueT: [...queueT],
            meetNode: v,
            highlightEdge: [u, v],
            description: `出会い！頂点 ${v} で合流。最短距離 = ${distS[v]} + ${distT[v]} = ${distS[v] + distT[v]}`,
          });
          return steps;
        }
      }
    }
  }

  steps.push({
    type: "done",
    side: "none",
    current: -1,
    distS: [...distS],
    distT: [...distT],
    queueS: [],
    queueT: [],
    description: "到達不可能。",
  });

  return steps;
}

// --- Node color ---

function getNodeColor(
  nodeId: number,
  step: Step,
  start: number,
  goal: number
): { fill: string; stroke: string } {
  if (step.meetNode === nodeId) {
    return { fill: "#d1fae5", stroke: "#10b981" }; // green - meeting point
  }
  if (nodeId === step.current) {
    return { fill: "#dbeafe", stroke: "#60a5fa" }; // blue - current
  }
  if (nodeId === start) {
    return { fill: "#dbeafe", stroke: "#60a5fa" }; // blue - start
  }
  if (nodeId === goal) {
    return { fill: "#fee2e2", stroke: "#ef4444" }; // red - goal
  }
  const inS = step.distS[nodeId] >= 0;
  const inT = step.distT[nodeId] >= 0;
  if (inS && inT) {
    return { fill: "#d1fae5", stroke: "#10b981" }; // green - both visited
  }
  if (inS) {
    return { fill: "#dbeafe", stroke: "#93c5fd" }; // light blue - start side
  }
  if (inT) {
    return { fill: "#fee2e2", stroke: "#fca5a5" }; // light red - goal side
  }
  return { fill: "#ffffff", stroke: "#e5e7eb" };
}

// --- Component ---

export default function BidirectionalBfsAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nodes] = useState<GraphNode[]>(defaultNodes);
  const [edges] = useState<GraphEdge[]>(defaultEdges);
  const startNode = 0;
  const goalNode = 7;

  const run = useCallback(() => {
    setSteps(generateSteps(nodes, edges, startNode, goalNode));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [nodes, edges]);

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

  return (
    <>
<div className="text-sm text-muted-foreground mb-4">
          始点: {startNode}　ゴール: {goalNode}
        </div>

        {/* Graph */}
        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 560 320" className="w-full max-w-2xl mx-auto">
            {edges.map((e, i) => {
              const from = nodes[e.from];
              const to = nodes[e.to];
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#d1d5db"
                  strokeWidth={2}
                />
              );
            })}
            {nodes.map((n) => {
              const { fill, stroke } = getNodeColor(
                n.id,
                step,
                startNode,
                goalNode
              );
              return (
                <g key={n.id}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={22}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={2}
                  />
                  <text
                    x={n.x}
                    y={n.y + 5}
                    textAnchor="middle"
                    className="text-sm font-mono font-bold"
                    fill="#374151"
                  >
                    {n.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Queues */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              始点側キュー
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {step.queueS.length > 0 ? (
                step.queueS.map((v, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-10 flex items-center justify-center border-2 bg-blue-50 border-blue-300 text-sm font-mono"
                  >
                    {v}
                  </div>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">空</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              ゴール側キュー
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {step.queueT.length > 0 ? (
                step.queueT.map((v, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-10 flex items-center justify-center border-2 bg-red-50 border-red-300 text-sm font-mono"
                  >
                    {v}
                  </div>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">空</span>
              )}
            </div>
          </div>
        </div>

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
            <span>始点側</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-400 rounded-full" />
            <span>ゴール側</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>出会い地点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200 rounded-full" />
            <span>未訪問</span>
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
