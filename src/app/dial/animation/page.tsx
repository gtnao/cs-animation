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
  type: "init" | "scan_bucket" | "extract" | "relax" | "no_relax" | "done";
  currentBucket: number;
  current: number;
  dist: number[];
  confirmed: boolean[];
  buckets: number[][];
  highlightEdge?: [number, number];
  description: string;
}

const INF = 999999;

// --- Default graph ---

const defaultNodes: GraphNode[] = [
  { id: 0, x: 80, y: 160 },
  { id: 1, x: 220, y: 60 },
  { id: 2, x: 220, y: 260 },
  { id: 3, x: 380, y: 60 },
  { id: 4, x: 380, y: 260 },
  { id: 5, x: 500, y: 160 },
];

const defaultEdges: GraphEdge[] = [
  { from: 0, to: 1, weight: 2 },
  { from: 0, to: 2, weight: 1 },
  { from: 1, to: 3, weight: 3 },
  { from: 1, to: 2, weight: 1 },
  { from: 2, to: 4, weight: 4 },
  { from: 2, to: 3, weight: 2 },
  { from: 3, to: 5, weight: 2 },
  { from: 4, to: 5, weight: 1 },
  { from: 3, to: 4, weight: 1 },
];

function buildAdjacency(
  nodes: GraphNode[],
  edges: GraphEdge[]
): [number, number][][] {
  const adj: [number, number][][] = nodes.map(() => []);
  for (const e of edges) {
    adj[e.from].push([e.to, e.weight]);
    adj[e.to].push([e.from, e.weight]);
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
  const maxW = Math.max(...edges.map((e) => e.weight));
  const maxDist = maxW * n;
  const steps: Step[] = [];
  const dist = new Array(n).fill(INF);
  const confirmed = new Array(n).fill(false);
  const buckets: number[][] = Array.from({ length: maxDist + 1 }, () => []);

  dist[start] = 0;
  buckets[0].push(start);

  steps.push({
    type: "init",
    currentBucket: 0,
    current: -1,
    dist: [...dist],
    confirmed: [...confirmed],
    buckets: buckets.map((b) => [...b]),
    description: `バケット配列を初期化。始点 ${start} をバケット 0 に追加。`,
  });

  let idx = 0;
  while (idx <= maxDist) {
    if (buckets[idx].length === 0) {
      idx++;
      continue;
    }

    steps.push({
      type: "scan_bucket",
      currentBucket: idx,
      current: -1,
      dist: [...dist],
      confirmed: [...confirmed],
      buckets: buckets.map((b) => [...b]),
      description: `バケット ${idx} に頂点あり`,
    });

    while (buckets[idx].length > 0) {
      const u = buckets[idx].pop()!;
      if (dist[u] < idx) continue; // outdated
      confirmed[u] = true;

      steps.push({
        type: "extract",
        currentBucket: idx,
        current: u,
        dist: [...dist],
        confirmed: [...confirmed],
        buckets: buckets.map((b) => [...b]),
        description: `バケット ${idx} から頂点 ${u} を取り出す (dist = ${dist[u]})`,
      });

      for (const [v, w] of adj[u]) {
        if (confirmed[v]) continue;
        const nd = dist[u] + w;
        if (nd < dist[v]) {
          dist[v] = nd;
          buckets[nd].push(v);
          steps.push({
            type: "relax",
            currentBucket: idx,
            current: u,
            dist: [...dist],
            confirmed: [...confirmed],
            buckets: buckets.map((b) => [...b]),
            highlightEdge: [u, v],
            description: `辺 (${u}, ${v}, w=${w}): dist[${v}] = ${nd}。バケット ${nd} に追加`,
          });
        } else {
          steps.push({
            type: "no_relax",
            currentBucket: idx,
            current: u,
            dist: [...dist],
            confirmed: [...confirmed],
            buckets: buckets.map((b) => [...b]),
            highlightEdge: [u, v],
            description: `辺 (${u}, ${v}, w=${w}): 更新なし`,
          });
        }
      }
    }
    idx++;
  }

  steps.push({
    type: "done",
    currentBucket: -1,
    current: -1,
    dist: [...dist],
    confirmed: [...confirmed],
    buckets: buckets.map((b) => [...b]),
    description: "Dial's Algorithm 完了。",
  });

  return steps;
}

// --- Node color ---

function getNodeColor(
  nodeId: number,
  step: Step
): { fill: string; stroke: string } {
  if (nodeId === step.current && step.type !== "done") {
    return { fill: "#dbeafe", stroke: "#60a5fa" };
  }
  if (step.confirmed[nodeId]) {
    return { fill: "#d1fae5", stroke: "#10b981" };
  }
  if (step.dist[nodeId] < INF) {
    return { fill: "#fffbeb", stroke: "#fbbf24" };
  }
  return { fill: "#ffffff", stroke: "#e5e7eb" };
}

// --- Edge color ---

function getEdgeColor(from: number, to: number, step: Step): string {
  if (
    step.highlightEdge &&
    ((step.highlightEdge[0] === from && step.highlightEdge[1] === to) ||
      (step.highlightEdge[0] === to && step.highlightEdge[1] === from))
  ) {
    if (step.type === "relax") return "#10b981";
    if (step.type === "no_relax") return "#ef4444";
  }
  return "#d1d5db";
}

// --- Component ---

export default function DialAnimationPage() {
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
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
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

  // Show only non-empty buckets and a few around the current bucket
  const maxBucketToShow = Math.min(
    step.buckets.length,
    Math.max(10, (step.currentBucket >= 0 ? step.currentBucket : 0) + 6)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Dial&apos;s Algorithm</h1>
        <p className="text-sm text-muted-foreground mb-6">
          バケットキューを用いた整数重みグラフの最短経路アルゴリズム
        </p>

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

        {/* Graph */}
        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 580 320" className="w-full max-w-2xl mx-auto">
            {edges.map((e, i) => {
              const from = nodes[e.from];
              const to = nodes[e.to];
              const color = getEdgeColor(e.from, e.to, step);
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              const dx = to.y - from.y;
              const dy = from.x - to.x;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const ox = (dx / len) * 12;
              const oy = (dy / len) * 12;
              return (
                <g key={i}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={color}
                    strokeWidth={2}
                  />
                  <text
                    x={mx + ox}
                    y={my + oy}
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
              const isConfirmed = step.confirmed[idx];
              let cls =
                "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              if (isCurrent) {
                cls += " bg-blue-100 border-blue-400 font-bold";
              } else if (isConfirmed) {
                cls += " bg-emerald-100 border-emerald-500";
              } else if (d < INF) {
                cls += " bg-amber-50 border-amber-400";
              } else {
                cls += " bg-gray-50 border-gray-200 text-muted-foreground";
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {idx}
                  </div>
                  <div className={cls}>{d < INF ? d : "∞"}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buckets */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            バケット
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {Array.from({ length: maxBucketToShow }, (_, i) => {
              const bucket = step.buckets[i] || [];
              const isCurrent =
                i === step.currentBucket && step.type !== "done";
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`text-[10px] font-mono ${isCurrent ? "text-blue-600 font-bold" : "text-muted-foreground"}`}
                  >
                    {i}
                  </div>
                  <div
                    className={`w-12 min-h-[2.5rem] flex flex-col items-center justify-center border-2 text-xs font-mono ${
                      isCurrent
                        ? "bg-blue-50 border-blue-400"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {bucket.length > 0
                      ? bucket.map((v, j) => (
                          <span key={j}>{v}</span>
                        ))
                      : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.currentBucket >= 0 && step.type !== "done" && (
            <span>
              バケット:{" "}
              <span className="font-mono font-semibold text-foreground">
                {step.currentBucket}
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
            <span>処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>発見済み</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>確定</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200 rounded-full" />
            <span>未発見</span>
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
      </div>
    </div>
  );
}
