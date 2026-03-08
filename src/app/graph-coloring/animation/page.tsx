"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface Graph {
  nodes: number[];
  edges: [number, number][];
}

type StepType =
  | "init"
  | "select_node"
  | "check_neighbor"
  | "assign_color"
  | "done";

interface Step {
  type: StepType;
  currentNode: number;
  neighbor: number;
  colors: number[]; // -1 = uncolored
  usedColors: Set<number>;
  description: string;
}

const COLOR_NAMES = ["赤", "青", "緑", "黄", "紫", "橙"];
const COLOR_FILLS = [
  "fill-red-100 stroke-red-400",
  "fill-blue-100 stroke-blue-400",
  "fill-emerald-100 stroke-emerald-500",
  "fill-amber-100 stroke-amber-400",
  "fill-purple-100 stroke-purple-400",
  "fill-orange-100 stroke-orange-400",
];
const COLOR_BGS = [
  "bg-red-100 border-red-400",
  "bg-blue-100 border-blue-400",
  "bg-emerald-100 border-emerald-500",
  "bg-amber-100 border-amber-400",
  "bg-purple-100 border-purple-400",
  "bg-orange-100 border-orange-400",
];

// --- Default graph ---

function defaultGraph(): Graph {
  return {
    nodes: [0, 1, 2, 3, 4, 5],
    edges: [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 4],
      [3, 5],
      [4, 5],
    ],
  };
}

// --- Step generation (greedy coloring) ---

function generateSteps(graph: Graph): Step[] {
  const { nodes, edges } = graph;
  const n = nodes.length;
  const steps: Step[] = [];
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const colors = new Array(n).fill(-1);

  steps.push({
    type: "init",
    currentNode: -1,
    neighbor: -1,
    colors: [...colors],
    usedColors: new Set(),
    description: "貪欲彩色を開始。全ノードを未着色で初期化",
  });

  for (const u of nodes) {
    steps.push({
      type: "select_node",
      currentNode: u,
      neighbor: -1,
      colors: [...colors],
      usedColors: new Set(),
      description: `ノード ${u} を選択`,
    });

    // Find used colors among neighbors
    const used = new Set<number>();
    for (const v of adj[u]) {
      if (colors[v] !== -1) {
        used.add(colors[v]);
        steps.push({
          type: "check_neighbor",
          currentNode: u,
          neighbor: v,
          colors: [...colors],
          usedColors: new Set(used),
          description: `隣接ノード ${v} の色 ${COLOR_NAMES[colors[v]]} (${colors[v]}) を確認`,
        });
      }
    }

    // Assign smallest available color
    let c = 0;
    while (used.has(c)) c++;
    colors[u] = c;

    steps.push({
      type: "assign_color",
      currentNode: u,
      neighbor: -1,
      colors: [...colors],
      usedColors: used,
      description: `ノード ${u} に色 ${COLOR_NAMES[c]} (${c}) を割り当て`,
    });
  }

  steps.push({
    type: "done",
    currentNode: -1,
    neighbor: -1,
    colors: [...colors],
    usedColors: new Set(),
    description: `彩色完了。使用した色数: ${new Set(colors).size}`,
  });

  return steps;
}

// --- Node positions ---

function getNodePositions(n: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const cx = 250;
  const cy = 200;
  const r = 140;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    positions.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  return positions;
}

// --- Component ---

export default function GraphColoringAnimationPage() {
  const [graph] = useState<Graph>(defaultGraph);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((g: Graph) => {
    setSteps(generateSteps(g));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(graph);
  }, [graph, run]);

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

  const positions = getNodePositions(graph.nodes.length);

  function getNodeColor(idx: number): string {
    if (idx === step.currentNode && step.type !== "done") {
      if (step.colors[idx] !== -1) {
        return COLOR_FILLS[step.colors[idx] % COLOR_FILLS.length];
      }
      return "fill-blue-100 stroke-blue-400";
    }
    if (idx === step.neighbor) {
      return "fill-amber-50 stroke-amber-400";
    }
    if (step.colors[idx] !== -1) {
      return COLOR_FILLS[step.colors[idx] % COLOR_FILLS.length];
    }
    return "fill-white stroke-gray-300";
  }

  function getEdgeColor(u: number, v: number): string {
    if (
      (u === step.currentNode && v === step.neighbor) ||
      (v === step.currentNode && u === step.neighbor)
    ) {
      return "stroke-amber-400";
    }
    return "stroke-gray-300";
  }

  return (
    <>
{/* Graph SVG */}
        <div className="mb-6 flex justify-center">
          <svg
            width={500}
            height={400}
            className="border border-border rounded"
          >
            {graph.edges.map(([u, v], i) => (
              <line
                key={`e-${i}`}
                x1={positions[u].x}
                y1={positions[u].y}
                x2={positions[v].x}
                y2={positions[v].y}
                className={getEdgeColor(u, v)}
                strokeWidth={2}
              />
            ))}
            {graph.nodes.map((node) => (
              <g key={`n-${node}`}>
                <circle
                  cx={positions[node].x}
                  cy={positions[node].y}
                  r={24}
                  className={getNodeColor(node)}
                  strokeWidth={2}
                />
                <text
                  x={positions[node].x}
                  y={positions[node].y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-sm font-mono fill-foreground"
                >
                  {node}
                </text>
              </g>
            ))}
          </svg>
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
          {COLOR_NAMES.slice(0, 4).map((name, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className={`w-3.5 h-3.5 border-2 ${COLOR_BGS[i]}`}
              />
              <span>色{i} ({name})</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>確認中の隣接ノード</span>
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
