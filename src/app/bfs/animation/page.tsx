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
  type: "init" | "dequeue" | "visit" | "skip" | "done";
  current: number;
  queue: number[];
  visited: boolean[];
  dist: number[];
  highlightEdge?: [number, number];
  description: string;
}

// --- Default graph ---

const defaultNodes: GraphNode[] = [
  { id: 0, x: 200, y: 50 },
  { id: 1, x: 80, y: 150 },
  { id: 2, x: 320, y: 150 },
  { id: 3, x: 40, y: 280 },
  { id: 4, x: 160, y: 280 },
  { id: 5, x: 280, y: 280 },
  { id: 6, x: 400, y: 280 },
];

const defaultEdges: GraphEdge[] = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
  { from: 2, to: 5 },
  { from: 2, to: 6 },
  { from: 4, to: 5 },
];

function buildAdjacency(
  nodes: GraphNode[],
  edges: GraphEdge[]
): number[][] {
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
  start: number
): Step[] {
  const n = nodes.length;
  const adj = buildAdjacency(nodes, edges);
  const steps: Step[] = [];
  const visited = new Array(n).fill(false);
  const dist = new Array(n).fill(-1);
  const queue: number[] = [];

  dist[start] = 0;
  visited[start] = true;
  queue.push(start);

  steps.push({
    type: "init",
    current: start,
    queue: [...queue],
    visited: [...visited],
    dist: [...dist],
    description: `始点 ${start} をキューに入れ、dist[${start}] = 0 に設定`,
  });

  while (queue.length > 0) {
    const u = queue.shift()!;

    steps.push({
      type: "dequeue",
      current: u,
      queue: [...queue],
      visited: [...visited],
      dist: [...dist],
      description: `キューから頂点 ${u} を取り出す (dist = ${dist[u]})`,
    });

    for (const v of adj[u]) {
      if (!visited[v]) {
        visited[v] = true;
        dist[v] = dist[u] + 1;
        queue.push(v);

        steps.push({
          type: "visit",
          current: u,
          queue: [...queue],
          visited: [...visited],
          dist: [...dist],
          highlightEdge: [u, v],
          description: `頂点 ${v} を発見: dist[${v}] = dist[${u}] + 1 = ${dist[v]}`,
        });
      } else {
        steps.push({
          type: "skip",
          current: u,
          queue: [...queue],
          visited: [...visited],
          dist: [...dist],
          highlightEdge: [u, v],
          description: `頂点 ${v} は訪問済み（スキップ）`,
        });
      }
    }
  }

  steps.push({
    type: "done",
    current: -1,
    queue: [],
    visited: [...visited],
    dist: [...dist],
    description: "BFS 完了。全ての到達可能な頂点を訪問しました。",
  });

  return steps;
}

// --- Node color ---

function getNodeColor(
  nodeId: number,
  step: Step
): { fill: string; stroke: string } {
  if (nodeId === step.current && step.type !== "done") {
    return { fill: "#dbeafe", stroke: "#60a5fa" }; // blue - current
  }
  if (step.queue.includes(nodeId)) {
    return { fill: "#fffbeb", stroke: "#fbbf24" }; // amber - in queue
  }
  if (step.visited[nodeId]) {
    return { fill: "#d1fae5", stroke: "#10b981" }; // green - visited
  }
  return { fill: "#ffffff", stroke: "#e5e7eb" }; // white - unvisited
}

// --- Edge color ---

function getEdgeColor(
  from: number,
  to: number,
  step: Step
): string {
  if (
    step.highlightEdge &&
    ((step.highlightEdge[0] === from && step.highlightEdge[1] === to) ||
      (step.highlightEdge[0] === to && step.highlightEdge[1] === from))
  ) {
    if (step.type === "visit") return "#10b981"; // green
    if (step.type === "skip") return "#ef4444"; // red
  }
  return "#d1d5db"; // gray
}

// --- Component ---

export default function BfsAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nodes] = useState<GraphNode[]>(defaultNodes);
  const [edges] = useState<GraphEdge[]>(defaultEdges);
  const [startNode, setStartNode] = useState(0);

  const run = useCallback(
    (s: number) => {
      setSteps(generateSteps(nodes, edges, s));
      setCurrentStep(0);
      setIsPlaying(false);
    },
    [nodes, edges]
  );

  useEffect(() => {
    run(startNode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-advance
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

  // Keyboard shortcuts
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
{/* Start node selector */}
        <div className="flex gap-2 mb-8 items-center">
          <span className="text-sm text-muted-foreground">始点:</span>
          <select
            value={startNode}
            onChange={(e) => {
              const s = Number(e.target.value);
              setStartNode(s);
              run(s);
            }}
            className="border border-border rounded px-2 py-1 text-sm"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.id}
              </option>
            ))}
          </select>
        </div>

        {/* Graph visualization */}
        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 440 340" className="w-full max-w-lg mx-auto">
            {/* Edges */}
            {edges.map((e, i) => {
              const from = nodes[e.from];
              const to = nodes[e.to];
              const color = getEdgeColor(e.from, e.to, step);
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={color}
                  strokeWidth={2}
                />
              );
            })}
            {/* Nodes */}
            {nodes.map((n) => {
              const { fill, stroke } = getNodeColor(n.id, step);
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

        {/* Distance table */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            距離テーブル
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.dist.map((d, idx) => {
              const isCurrent = idx === step.current && step.type !== "done";
              let cls =
                "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              if (isCurrent) {
                cls += " bg-blue-100 border-blue-400 font-bold";
              } else if (d >= 0) {
                cls += " bg-white border-gray-300";
              } else {
                cls += " bg-gray-50 border-gray-200 text-muted-foreground";
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {idx}
                  </div>
                  <div className={cls}>{d >= 0 ? d : "∞"}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Queue */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            キュー
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.queue.length > 0 ? (
              step.queue.map((v, idx) => (
                <div
                  key={idx}
                  className="w-10 h-10 flex items-center justify-center border-2 bg-amber-50 border-amber-400 text-sm font-mono"
                >
                  {v}
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">空</span>
            )}
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
            <span>現在の頂点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>キュー内</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>訪問済み</span>
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
