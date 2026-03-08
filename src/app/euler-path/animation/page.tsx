"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface GraphInput {
  nodeCount: number;
  edges: [number, number][];
}

type StepType = "init" | "traverse" | "backtrack" | "done";

interface Step {
  type: StepType;
  currentNode: number;
  usedEdges: Set<number>;
  path: number[];
  circuit: number[];
  stack: number[];
  description: string;
}

// --- Step generation (Hierholzer's algorithm) ---

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

  // Find start vertex (odd degree vertex or 0)
  const degree = new Array(nodeCount).fill(0);
  for (const [u, v] of edges) {
    degree[u]++;
    degree[v]++;
  }
  let start = 0;
  for (let i = 0; i < nodeCount; i++) {
    if (degree[i] % 2 === 1) {
      start = i;
      break;
    }
  }

  const usedEdges = new Set<number>();
  const stack: number[] = [start];
  const circuit: number[] = [];
  const adjPtr = new Array(nodeCount).fill(0);

  steps.push({
    type: "init",
    currentNode: start,
    usedEdges: new Set(),
    path: [],
    circuit: [],
    stack: [start],
    description: `Hierholzer のアルゴリズム開始。頂点 ${start} からスタート。`,
  });

  while (stack.length > 0) {
    const u = stack[stack.length - 1];

    let found = false;
    while (adjPtr[u] < adj[u].length) {
      const { to: v, idx } = adj[u][adjPtr[u]];
      adjPtr[u]++;
      if (usedEdges.has(idx)) continue;

      usedEdges.add(idx);
      stack.push(v);

      steps.push({
        type: "traverse",
        currentNode: v,
        usedEdges: new Set(usedEdges),
        path: [...stack],
        circuit: [...circuit],
        stack: [...stack],
        description: `辺 (${u}, ${v}) を使用。頂点 ${v} に移動。`,
      });

      found = true;
      break;
    }

    if (!found) {
      stack.pop();
      circuit.push(u);

      steps.push({
        type: "backtrack",
        currentNode: stack.length > 0 ? stack[stack.length - 1] : -1,
        usedEdges: new Set(usedEdges),
        path: [...stack],
        circuit: [...circuit],
        stack: [...stack],
        description: `頂点 ${u} から未使用辺なし。回路に追加: ${u}。`,
      });
    }
  }

  circuit.reverse();

  steps.push({
    type: "done",
    currentNode: -1,
    usedEdges: new Set(usedEdges),
    path: [],
    circuit: [...circuit],
    stack: [],
    description: `完了。オイラー${circuit[0] === circuit[circuit.length - 1] ? "閉路" : "路"}: [${circuit.join(" → ")}]`,
  });

  return steps;
}

// --- Default graph (Eulerian circuit) ---

const DEFAULT_GRAPH: GraphInput = {
  nodeCount: 5,
  edges: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 0],
    [0, 2],
    [2, 4],
  ],
};

function getNodePositions(n: number): { x: number; y: number }[] {
  const cx = 300;
  const cy = 200;
  const r = 140;
  return Array.from({ length: n }, (_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
  }));
}

export default function EulerPathAnimationPage() {
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

  const getEdgeColor = (idx: number) => {
    if (step.usedEdges.has(idx)) return "stroke-emerald-500";
    return "stroke-gray-300";
  };

  const getNodeFill = (idx: number) => {
    if (idx === step.currentNode) return "fill-blue-100";
    if (step.stack.includes(idx)) return "fill-amber-50";
    return "fill-white";
  };

  const getNodeStroke = (idx: number) => {
    if (idx === step.currentNode) return "stroke-blue-400";
    if (step.stack.includes(idx)) return "stroke-amber-400";
    return "stroke-gray-300";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">オイラー路・オイラー閉路</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Hierholzer のアルゴリズムで全辺を1回ずつ通る経路を構築
        </p>

        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 600 400" className="w-full h-auto max-h-[400px]">
            {graph.edges.map(([u, v], idx) => {
              const p1 = positions[u];
              const p2 = positions[v];
              return (
                <line
                  key={`edge-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  className={getEdgeColor(idx)}
                  strokeWidth={step.usedEdges.has(idx) ? 3 : 1.5}
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

        <div className="mb-4">
          <span className="text-xs text-muted-foreground">
            スタック: [{step.stack.join(", ")}]
          </span>
        </div>
        <div className="mb-4">
          <span className="text-xs text-muted-foreground">
            回路: [{step.circuit.join(", ")}]
          </span>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
          <span>
            使用辺: {step.usedEdges.size} / {graph.edges.length}
          </span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>現在位置</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>スタック上</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>使用済み辺</span>
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
