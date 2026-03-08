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
  weight: number;
}

interface Step {
  type: "init" | "start_k" | "check" | "update" | "no_update" | "done";
  k: number;
  i: number;
  j: number;
  dist: number[][];
  description: string;
}

const INF = 999999;

// --- Default graph (small, directed) ---

const defaultNodes: GraphNode[] = [
  { id: 0, x: 100, y: 80 },
  { id: 1, x: 300, y: 80 },
  { id: 2, x: 400, y: 220 },
  { id: 3, x: 100, y: 220 },
];

const defaultEdges: GraphEdge[] = [
  { from: 0, to: 1, weight: 3 },
  { from: 0, to: 3, weight: 7 },
  { from: 1, to: 0, weight: 8 },
  { from: 1, to: 2, weight: 2 },
  { from: 2, to: 3, weight: 1 },
  { from: 3, to: 0, weight: 2 },
];

// --- Step generation ---

function generateSteps(nodes: GraphNode[], edges: GraphEdge[]): Step[] {
  const n = nodes.length;
  const steps: Step[] = [];
  const dist: number[][] = Array.from({ length: n }, () =>
    new Array(n).fill(INF)
  );

  for (let i = 0; i < n; i++) dist[i][i] = 0;
  for (const e of edges) {
    dist[e.from][e.to] = Math.min(dist[e.from][e.to], e.weight);
  }

  steps.push({
    type: "init",
    k: -1,
    i: -1,
    j: -1,
    dist: dist.map((row) => [...row]),
    description: "距離行列を初期化。直接辺がある場合はその重み、なければ ∞。",
  });

  for (let k = 0; k < n; k++) {
    steps.push({
      type: "start_k",
      k,
      i: -1,
      j: -1,
      dist: dist.map((row) => [...row]),
      description: `中継頂点 k = ${k} の処理開始`,
    });

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === k || j === k || i === j) continue;
        const via = dist[i][k] + dist[k][j];
        if (via < dist[i][j]) {
          const old = dist[i][j];
          dist[i][j] = via;
          steps.push({
            type: "update",
            k,
            i,
            j,
            dist: dist.map((row) => [...row]),
            description: `D[${i}][${j}]: ${old >= INF ? "∞" : old} → ${via} (= D[${i}][${k}] + D[${k}][${j}] = ${dist[i][k]} + ${dist[k][j]})`,
          });
        } else {
          steps.push({
            type: "no_update",
            k,
            i,
            j,
            dist: dist.map((row) => [...row]),
            description: `D[${i}][${j}] = ${dist[i][j] >= INF ? "∞" : dist[i][j]}、D[${i}][${k}] + D[${k}][${j}] = ${dist[i][k] >= INF || dist[k][j] >= INF ? "∞" : dist[i][k] + dist[k][j]}（更新なし）`,
          });
        }
      }
    }
  }

  steps.push({
    type: "done",
    k: n,
    i: -1,
    j: -1,
    dist: dist.map((row) => [...row]),
    description: "Warshall-Floyd法 完了。全頂点対間の最短距離が求まりました。",
  });

  return steps;
}

// --- Node color ---

function getNodeColor(
  nodeId: number,
  step: Step
): { fill: string; stroke: string } {
  if (step.k >= 0 && nodeId === step.k && step.type !== "done") {
    return { fill: "#dbeafe", stroke: "#60a5fa" }; // blue - relay vertex k
  }
  if (nodeId === step.i && step.type !== "done" && step.type !== "start_k") {
    return { fill: "#fffbeb", stroke: "#fbbf24" }; // amber - i
  }
  if (nodeId === step.j && step.type !== "done" && step.type !== "start_k") {
    return { fill: "#d1fae5", stroke: "#10b981" }; // green - j
  }
  return { fill: "#ffffff", stroke: "#e5e7eb" };
}

// --- Component ---

export default function WarshallFloydAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nodes] = useState<GraphNode[]>(defaultNodes);
  const [edges] = useState<GraphEdge[]>(defaultEdges);

  const run = useCallback(() => {
    setSteps(generateSteps(nodes, edges));
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
    }, 600);
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

  const n = nodes.length;

  return (
    <>
{/* Graph */}
        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 500 300" className="w-full max-w-lg mx-auto">
            <defs>
              <marker
                id="wf-arrow"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
              </marker>
            </defs>
            {edges.map((e, i) => {
              const from = nodes[e.from];
              const to = nodes[e.to];
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const ux = dx / len;
              const uy = dy / len;
              const x1 = from.x + ux * 24;
              const y1 = from.y + uy * 24;
              const x2 = to.x - ux * 24;
              const y2 = to.y - uy * 24;
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              const nx = -uy * 14;
              const ny = ux * 14;
              return (
                <g key={i}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#d1d5db"
                    strokeWidth={2}
                    markerEnd="url(#wf-arrow)"
                  />
                  <text
                    x={mx + nx}
                    y={my + ny}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-xs font-mono"
                    fill="#6b7280"
                  >
                    {e.weight}
                  </text>
                </g>
              );
            })}
            {nodes.map((nd) => {
              const { fill, stroke } = getNodeColor(nd.id, step);
              return (
                <g key={nd.id}>
                  <circle
                    cx={nd.x}
                    cy={nd.y}
                    r={22}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={2}
                  />
                  <text
                    x={nd.x}
                    y={nd.y + 5}
                    textAnchor="middle"
                    className="text-sm font-mono font-bold"
                    fill="#374151"
                  >
                    {nd.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Distance matrix */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            距離行列 D
          </div>
          <div className="overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="w-10 h-8 text-xs font-mono text-muted-foreground"></th>
                  {Array.from({ length: n }, (_, j) => (
                    <th
                      key={j}
                      className={`w-14 h-8 text-xs font-mono text-center ${
                        j === step.j && step.type !== "done" && step.type !== "init" && step.type !== "start_k"
                          ? "text-emerald-600 font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {j}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {step.dist.map((row, i) => (
                  <tr key={i}>
                    <td
                      className={`w-10 h-10 text-xs font-mono text-center ${
                        i === step.i && step.type !== "done" && step.type !== "init" && step.type !== "start_k"
                          ? "text-amber-600 font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {i}
                    </td>
                    {row.map((val, j) => {
                      const isActive =
                        i === step.i &&
                        j === step.j &&
                        (step.type === "update" || step.type === "no_update");
                      const isViaI =
                        i === step.i &&
                        j === step.k &&
                        (step.type === "update" ||
                          step.type === "no_update" ||
                          step.type === "check");
                      const isViaJ =
                        i === step.k &&
                        j === step.j &&
                        (step.type === "update" ||
                          step.type === "no_update" ||
                          step.type === "check");

                      let cls =
                        "w-14 h-10 text-center border-2 text-sm font-mono transition-colors";
                      if (isActive && step.type === "update") {
                        cls += " bg-emerald-100 border-emerald-500 font-bold";
                      } else if (isActive) {
                        cls += " bg-red-100 border-red-500";
                      } else if (isViaI || isViaJ) {
                        cls += " bg-blue-100 border-blue-400";
                      } else if (i === j) {
                        cls += " bg-gray-100 border-gray-300";
                      } else {
                        cls += " bg-white border-gray-200";
                      }

                      return (
                        <td key={j} className={cls}>
                          {val >= INF ? "∞" : val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.k >= 0 && step.type !== "done" && (
            <span>
              k ={" "}
              <span className="font-mono font-semibold text-foreground">
                {step.k}
              </span>
            </span>
          )}
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
            <span>中継頂点 k</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>始点 i</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>終点 j / 更新成功</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>更新なし</span>
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
