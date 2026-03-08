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
  type: "init" | "push" | "visit" | "backtrack" | "skip" | "done";
  current: number;
  stack: number[];
  visited: boolean[];
  order: number[];
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
  start: number
): Step[] {
  const n = nodes.length;
  const adj = buildAdjacency(nodes, edges);
  const steps: Step[] = [];
  const visited = new Array(n).fill(false);
  const order: number[] = [];
  const stack: number[] = [];

  stack.push(start);

  steps.push({
    type: "init",
    current: -1,
    stack: [...stack],
    visited: [...visited],
    order: [...order],
    description: `始点 ${start} をスタックに入れる`,
  });

  while (stack.length > 0) {
    const u = stack.pop()!;

    if (visited[u]) {
      steps.push({
        type: "skip",
        current: u,
        stack: [...stack],
        visited: [...visited],
        order: [...order],
        description: `頂点 ${u} をスタックから取り出すが、訪問済みのためスキップ`,
      });
      continue;
    }

    visited[u] = true;
    order.push(u);

    steps.push({
      type: "visit",
      current: u,
      stack: [...stack],
      visited: [...visited],
      order: [...order],
      description: `頂点 ${u} を訪問（訪問順: ${order.join(" → ")}）`,
    });

    const neighbors = [...adj[u]].reverse();
    for (const v of neighbors) {
      if (!visited[v]) {
        stack.push(v);
        steps.push({
          type: "push",
          current: u,
          stack: [...stack],
          visited: [...visited],
          order: [...order],
          highlightEdge: [u, v],
          description: `頂点 ${v} をスタックに追加`,
        });
      } else {
        steps.push({
          type: "backtrack",
          current: u,
          stack: [...stack],
          visited: [...visited],
          order: [...order],
          highlightEdge: [u, v],
          description: `頂点 ${v} は訪問済み（スキップ）`,
        });
      }
    }
  }

  steps.push({
    type: "done",
    current: -1,
    stack: [],
    visited: [...visited],
    order: [...order],
    description: `DFS 完了。訪問順: ${order.join(" → ")}`,
  });

  return steps;
}

// --- Node color ---

function getNodeColor(
  nodeId: number,
  step: Step
): { fill: string; stroke: string } {
  if (nodeId === step.current && step.type !== "done" && step.type !== "skip") {
    return { fill: "#dbeafe", stroke: "#60a5fa" }; // blue - current
  }
  if (step.stack.includes(nodeId) && !step.visited[nodeId]) {
    return { fill: "#fffbeb", stroke: "#fbbf24" }; // amber - in stack
  }
  if (step.visited[nodeId]) {
    return { fill: "#d1fae5", stroke: "#10b981" }; // green - visited
  }
  return { fill: "#ffffff", stroke: "#e5e7eb" }; // white - unvisited
}

// --- Edge color ---

function getEdgeColor(from: number, to: number, step: Step): string {
  if (
    step.highlightEdge &&
    ((step.highlightEdge[0] === from && step.highlightEdge[1] === to) ||
      (step.highlightEdge[0] === to && step.highlightEdge[1] === from))
  ) {
    if (step.type === "push") return "#10b981"; // green
    if (step.type === "backtrack") return "#ef4444"; // red
  }
  return "#d1d5db"; // gray
}

// --- Component ---

export default function DfsAnimationPage() {
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

        {/* Stack */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            スタック（右が先頭）
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.stack.length > 0 ? (
              step.stack.map((v, idx) => (
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

        {/* Visit order */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            訪問順序
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.order.length > 0 ? (
              step.order.map((v, idx) => (
                <div
                  key={idx}
                  className="w-10 h-10 flex items-center justify-center border-2 bg-emerald-100 border-emerald-500 text-sm font-mono"
                >
                  {v}
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">−</span>
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
            <span>スタック内</span>
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
