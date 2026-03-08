"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface BipartiteEdge {
  left: number;
  right: number;
}

type StepType =
  | "init"
  | "bfs_phase"
  | "find_augmenting"
  | "augment"
  | "phase_done"
  | "done";

interface Step {
  type: StepType;
  matchLeft: number[]; // matchLeft[i] = right node matched to left i, or -1
  matchRight: number[]; // matchRight[j] = left node matched to right j, or -1
  augPath: number[]; // alternating path [left, right, left, right, ...]
  phase: number;
  matchingSize: number;
  description: string;
  highlightLeft: number[];
  highlightRight: number[];
  highlightEdges: [number, number][];
}

// --- Graph layout ---

const LEFT_NODES = 4;
const RIGHT_NODES = 4;

const EDGES: BipartiteEdge[] = [
  { left: 0, right: 0 },
  { left: 0, right: 1 },
  { left: 1, right: 0 },
  { left: 1, right: 2 },
  { left: 2, right: 1 },
  { left: 2, right: 3 },
  { left: 3, right: 2 },
  { left: 3, right: 3 },
];

const LEFT_LABELS = ["L0", "L1", "L2", "L3"];
const RIGHT_LABELS = ["R0", "R1", "R2", "R3"];

function leftPos(i: number) {
  return { x: 120, y: 60 + i * 90 };
}
function rightPos(i: number) {
  return { x: 420, y: 60 + i * 90 };
}

// --- BFS ---

function bfs(
  matchLeft: number[],
  matchRight: number[],
  adj: number[][]
): { dist: number[]; found: boolean } {
  const INF = 1e9;
  const dist = new Array(LEFT_NODES).fill(INF);
  const queue: number[] = [];

  for (let u = 0; u < LEFT_NODES; u++) {
    if (matchLeft[u] === -1) {
      dist[u] = 0;
      queue.push(u);
    }
  }

  let found = false;
  while (queue.length > 0) {
    const u = queue.shift()!;
    for (const v of adj[u]) {
      const w = matchRight[v];
      if (w === -1) {
        found = true;
      } else if (dist[w] === INF) {
        dist[w] = dist[u] + 1;
        queue.push(w);
      }
    }
  }
  return { dist, found };
}

// --- DFS ---

function dfs(
  u: number,
  matchLeft: number[],
  matchRight: number[],
  dist: number[],
  adj: number[][],
  path: number[]
): number[] | null {
  const INF = 1e9;
  for (const v of adj[u]) {
    const w = matchRight[v];
    if (w === -1 || (dist[w] === dist[u] + 1 && w !== -1)) {
      if (w === -1) {
        return [...path, u, v];
      }
      const result = dfs(w, matchLeft, matchRight, dist, adj, [...path, u, v]);
      if (result) {
        dist[w] = INF;
        return result;
      }
    }
  }
  dist[u] = INF;
  return null;
}

// --- Step generation ---

function generateSteps(): Step[] {
  const steps: Step[] = [];
  const matchLeft = new Array(LEFT_NODES).fill(-1);
  const matchRight = new Array(RIGHT_NODES).fill(-1);
  let matchingSize = 0;
  let phase = 0;

  // Build adjacency list
  const adj: number[][] = Array.from({ length: LEFT_NODES }, () => []);
  for (const e of EDGES) {
    adj[e.left].push(e.right);
  }

  steps.push({
    type: "init",
    matchLeft: [...matchLeft],
    matchRight: [...matchRight],
    augPath: [],
    phase: 0,
    matchingSize: 0,
    description:
      "Hopcroft-Karp法を開始。左右の頂点間の最大マッチングを求めます。",
    highlightLeft: [],
    highlightRight: [],
    highlightEdges: [],
  });

  while (true) {
    phase++;
    const { dist, found } = bfs(matchLeft, matchRight, adj);

    if (!found) {
      steps.push({
        type: "phase_done",
        matchLeft: [...matchLeft],
        matchRight: [...matchRight],
        augPath: [],
        phase,
        matchingSize,
        description: `フェーズ ${phase}: BFS で増加パスが見つかりません。アルゴリズム終了。`,
        highlightLeft: [],
        highlightRight: [],
        highlightEdges: [],
      });
      break;
    }

    const freeLeft = matchLeft
      .map((m, i) => (m === -1 ? i : -1))
      .filter((i) => i >= 0);
    steps.push({
      type: "bfs_phase",
      matchLeft: [...matchLeft],
      matchRight: [...matchRight],
      augPath: [],
      phase,
      matchingSize,
      description: `フェーズ ${phase}: BFS でレベルグラフを構築。未マッチの左頂点: ${freeLeft.map((i) => LEFT_LABELS[i]).join(", ")}`,
      highlightLeft: freeLeft,
      highlightRight: [],
      highlightEdges: [],
    });

    // Find all augmenting paths via DFS
    for (let u = 0; u < LEFT_NODES; u++) {
      if (matchLeft[u] !== -1) continue;
      const result = dfs(u, matchLeft, matchRight, dist, adj, []);
      if (result) {
        // result is [left, right, left, right, ..., left, right]
        const pathEdges: [number, number][] = [];
        const hLeft: number[] = [];
        const hRight: number[] = [];
        for (let i = 0; i < result.length; i += 2) {
          const l = result[i];
          const r = result[i + 1];
          pathEdges.push([l, r]);
          hLeft.push(l);
          hRight.push(r);
        }

        steps.push({
          type: "find_augmenting",
          matchLeft: [...matchLeft],
          matchRight: [...matchRight],
          augPath: result,
          phase,
          matchingSize,
          description: `増加パス発見: ${result.map((v, i) => (i % 2 === 0 ? LEFT_LABELS[v] : RIGHT_LABELS[v])).join(" → ")}`,
          highlightLeft: hLeft,
          highlightRight: hRight,
          highlightEdges: pathEdges,
        });

        // Augment
        for (let i = 0; i < result.length; i += 2) {
          const l = result[i];
          const r = result[i + 1];
          matchLeft[l] = r;
          matchRight[r] = l;
        }
        matchingSize++;

        steps.push({
          type: "augment",
          matchLeft: [...matchLeft],
          matchRight: [...matchRight],
          augPath: result,
          phase,
          matchingSize,
          description: `マッチング更新。サイズ = ${matchingSize}`,
          highlightLeft: hLeft,
          highlightRight: hRight,
          highlightEdges: pathEdges,
        });
      }
    }
  }

  steps.push({
    type: "done",
    matchLeft: [...matchLeft],
    matchRight: [...matchRight],
    augPath: [],
    phase,
    matchingSize,
    description: `最大マッチングサイズ = ${matchingSize}`,
    highlightLeft: [],
    highlightRight: [],
    highlightEdges: [],
  });

  return steps;
}

// --- Component ---

export default function HopcroftKarpAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    setSteps(generateSteps());
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(); }, [run]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  // Check if edge is in matching
  const isMatched = (l: number, r: number) => step.matchLeft[l] === r;
  const isHighlighted = (l: number, r: number) =>
    step.highlightEdges.some(([a, b]) => a === l && b === r);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Hopcroft-Karp</h1>
        <p className="text-sm text-muted-foreground mb-6">二部グラフの最大マッチングを効率的に求めるアルゴリズム</p>

        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 540 420" className="w-full h-auto">
            {/* Edges */}
            {EDGES.map((edge, idx) => {
              const lp = leftPos(edge.left);
              const rp = rightPos(edge.right);
              const matched = isMatched(edge.left, edge.right);
              const highlighted = isHighlighted(edge.left, edge.right);

              let strokeClass = "stroke-gray-200";
              let sw = 1.5;
              if (highlighted) {
                strokeClass = step.type === "find_augmenting" ? "stroke-amber-400" : "stroke-emerald-500";
                sw = 3;
              } else if (matched) {
                strokeClass = "stroke-emerald-500";
                sw = 2.5;
              }

              return (
                <line
                  key={idx}
                  x1={lp.x + 22}
                  y1={lp.y}
                  x2={rp.x - 22}
                  y2={rp.y}
                  className={`${strokeClass} transition-colors`}
                  strokeWidth={sw}
                />
              );
            })}

            {/* Left nodes */}
            {Array.from({ length: LEFT_NODES }, (_, i) => {
              const pos = leftPos(i);
              const hl = step.highlightLeft.includes(i);
              const matched = step.matchLeft[i] !== -1;
              let fill = "fill-white";
              let stroke = "stroke-gray-300";
              if (hl) {
                fill = step.type === "find_augmenting" || step.type === "bfs_phase" ? "fill-amber-50" : "fill-emerald-100";
                stroke = step.type === "find_augmenting" || step.type === "bfs_phase" ? "stroke-amber-400" : "stroke-emerald-500";
              } else if (matched) {
                fill = "fill-emerald-100";
                stroke = "stroke-emerald-500";
              }
              return (
                <g key={`l${i}`}>
                  <circle cx={pos.x} cy={pos.y} r={22} className={`${fill} ${stroke} transition-colors`} strokeWidth={2} />
                  <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="text-sm font-semibold fill-foreground">{LEFT_LABELS[i]}</text>
                </g>
              );
            })}

            {/* Right nodes */}
            {Array.from({ length: RIGHT_NODES }, (_, i) => {
              const pos = rightPos(i);
              const hl = step.highlightRight.includes(i);
              const matched = step.matchRight[i] !== -1;
              let fill = "fill-white";
              let stroke = "stroke-gray-300";
              if (hl) {
                fill = step.type === "find_augmenting" ? "fill-amber-50" : "fill-emerald-100";
                stroke = step.type === "find_augmenting" ? "stroke-amber-400" : "stroke-emerald-500";
              } else if (matched) {
                fill = "fill-emerald-100";
                stroke = "stroke-emerald-500";
              }
              return (
                <g key={`r${i}`}>
                  <circle cx={pos.x} cy={pos.y} r={22} className={`${fill} ${stroke} transition-colors`} strokeWidth={2} />
                  <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="text-sm font-semibold fill-foreground">{RIGHT_LABELS[i]}</text>
                </g>
              );
            })}

            {/* Labels */}
            <text x={120} y={25} textAnchor="middle" className="text-xs fill-muted-foreground">左集合</text>
            <text x={420} y={25} textAnchor="middle" className="text-xs fill-muted-foreground">右集合</text>
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>マッチングサイズ = <span className="font-mono font-semibold text-foreground">{step.matchingSize}</span></span>
          <span>フェーズ {step.phase}</span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" /><span>増加パス / 候補</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" /><span>マッチング済み</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((p) => !p)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
      </div>
    </div>
  );
}
