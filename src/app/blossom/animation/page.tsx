"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

type StepType =
  | "init"
  | "search"
  | "find_blossom"
  | "contract"
  | "find_augmenting"
  | "augment"
  | "done";

interface Step {
  type: StepType;
  matching: [number, number][];
  matchingSize: number;
  description: string;
  highlightNodes: number[];
  highlightEdges: [number, number][];
  blossomNodes: number[];
}

// --- Graph (7 nodes, including an odd cycle) ---

const NUM_NODES = 7;
const NODE_LABELS = ["0", "1", "2", "3", "4", "5", "6"];

const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 1],
  [2, 5],
  [5, 6],
];

const NODE_POSITIONS: Record<number, { x: number; y: number }> = {
  0: { x: 60, y: 200 },
  1: { x: 180, y: 200 },
  2: { x: 310, y: 200 },
  3: { x: 250, y: 90 },
  4: { x: 250, y: 310 },
  5: { x: 430, y: 200 },
  6: { x: 540, y: 200 },
};

// --- Step generation ---

function generateSteps(): Step[] {
  const steps: Step[] = [];
  const matching: [number, number][] = [];

  steps.push({
    type: "init",
    matching: [],
    matchingSize: 0,
    description: "Edmonds' Blossom アルゴリズムを開始。一般グラフの最大マッチングを求めます。",
    highlightNodes: [],
    highlightEdges: [],
    blossomNodes: [],
  });

  // Phase 1: Start with edge (0,1)
  steps.push({
    type: "search",
    matching: [],
    matchingSize: 0,
    description: "頂点 0 から増加パスを探索。",
    highlightNodes: [0],
    highlightEdges: [],
    blossomNodes: [],
  });

  matching.push([0, 1]);
  steps.push({
    type: "augment",
    matching: [...matching],
    matchingSize: 1,
    description: "増加パス 0-1 を発見。マッチングに追加。サイズ = 1",
    highlightNodes: [0, 1],
    highlightEdges: [[0, 1]],
    blossomNodes: [],
  });

  // Phase 2: Start with edge (2,5) - simple augmenting path
  steps.push({
    type: "search",
    matching: [...matching],
    matchingSize: 1,
    description: "頂点 2 から増加パスを探索。",
    highlightNodes: [2],
    highlightEdges: [],
    blossomNodes: [],
  });

  matching.push([2, 5]);
  steps.push({
    type: "augment",
    matching: [...matching],
    matchingSize: 2,
    description: "増加パス 2-5 を発見。マッチングに追加。サイズ = 2",
    highlightNodes: [2, 5],
    highlightEdges: [[2, 5]],
    blossomNodes: [],
  });

  // Phase 3: Search from vertex 3 - encounters blossom
  steps.push({
    type: "search",
    matching: [...matching],
    matchingSize: 2,
    description: "頂点 6 から増加パスを探索。交互木を構築中...",
    highlightNodes: [6, 5, 2],
    highlightEdges: [[6, 5], [5, 2]],
    blossomNodes: [],
  });

  // Find blossom: 1-2-3-4-1
  steps.push({
    type: "find_blossom",
    matching: [...matching],
    matchingSize: 2,
    description: "花 (Blossom) を検出! 奇数長サイクル: 1-2-3-4-1 (長さ 4 の辺, 5頂点を含む奇数サイクル)。",
    highlightNodes: [1, 2, 3, 4],
    highlightEdges: [[1, 2], [2, 3], [3, 4], [4, 1]],
    blossomNodes: [1, 2, 3, 4],
  });

  steps.push({
    type: "contract",
    matching: [...matching],
    matchingSize: 2,
    description: "花を1つの超頂点に縮約。縮約後のグラフで増加パスを探索。",
    highlightNodes: [],
    highlightEdges: [],
    blossomNodes: [1, 2, 3, 4],
  });

  // Augment: find path 6-5-2-1-0, rearranging matching
  steps.push({
    type: "find_augmenting",
    matching: [...matching],
    matchingSize: 2,
    description: "縮約グラフ上で増加パスを発見。花を展開してパスを復元: 6-5-2-3-4-1-0",
    highlightNodes: [6, 5, 2, 3, 4, 1, 0],
    highlightEdges: [[6, 5], [5, 2], [2, 3], [3, 4], [4, 1], [1, 0]],
    blossomNodes: [],
  });

  // Update matching
  matching.length = 0;
  matching.push([6, 5], [2, 3], [4, 1]);

  steps.push({
    type: "augment",
    matching: [...matching],
    matchingSize: 3,
    description: "マッチング更新: {6-5, 2-3, 4-1}。サイズ = 3",
    highlightNodes: [6, 5, 2, 3, 4, 1],
    highlightEdges: [[6, 5], [2, 3], [4, 1]],
    blossomNodes: [],
  });

  steps.push({
    type: "done",
    matching: [...matching],
    matchingSize: 3,
    description: "最大マッチングサイズ = 3。これ以上の増加パスはありません。",
    highlightNodes: [],
    highlightEdges: [],
    blossomNodes: [],
  });

  return steps;
}

// --- Component ---

export default function BlossomAnimationPage() {
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
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 1200);
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

  const isMatched = (a: number, b: number) =>
    step.matching.some(([u, v]) => (u === a && v === b) || (u === b && v === a));
  const isHighlightEdge = (a: number, b: number) =>
    step.highlightEdges.some(([u, v]) => (u === a && v === b) || (u === b && v === a));
  const isBlossom = (n: number) => step.blossomNodes.includes(n);

  return (
    <>
<div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 600 400" className="w-full h-auto">
            {/* Edges */}
            {EDGES.map(([a, b], idx) => {
              const pa = NODE_POSITIONS[a];
              const pb = NODE_POSITIONS[b];
              const matched = isMatched(a, b);
              const highlighted = isHighlightEdge(a, b);

              let strokeClass = "stroke-gray-200";
              let sw = 1.5;
              if (highlighted) {
                if (step.type === "find_blossom") {
                  strokeClass = "stroke-red-500";
                  sw = 3;
                } else if (step.type === "find_augmenting" || step.type === "search") {
                  strokeClass = "stroke-amber-400";
                  sw = 3;
                } else {
                  strokeClass = "stroke-emerald-500";
                  sw = 3;
                }
              } else if (matched) {
                strokeClass = "stroke-emerald-500";
                sw = 3;
              }

              return (
                <line key={idx} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  className={`${strokeClass} transition-colors`} strokeWidth={sw} />
              );
            })}

            {/* Nodes */}
            {Array.from({ length: NUM_NODES }, (_, i) => {
              const pos = NODE_POSITIONS[i];
              const hl = step.highlightNodes.includes(i);
              const bl = isBlossom(i);
              let fill = "fill-white";
              let stroke = "stroke-gray-300";

              if (bl) {
                fill = "fill-red-100";
                stroke = "stroke-red-500";
              } else if (hl) {
                if (step.type === "search" || step.type === "find_augmenting") {
                  fill = "fill-amber-50";
                  stroke = "stroke-amber-400";
                } else if (step.type === "augment") {
                  fill = "fill-emerald-100";
                  stroke = "stroke-emerald-500";
                } else {
                  fill = "fill-blue-100";
                  stroke = "stroke-blue-400";
                }
              } else if (step.matching.some(([a, b]) => a === i || b === i)) {
                fill = "fill-emerald-100";
                stroke = "stroke-emerald-500";
              }

              return (
                <g key={i}>
                  <circle cx={pos.x} cy={pos.y} r={22} className={`${fill} ${stroke} transition-colors`} strokeWidth={2} />
                  <text x={pos.x} y={pos.y + 5} textAnchor="middle" className="text-sm font-semibold fill-foreground">{NODE_LABELS[i]}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>マッチングサイズ = <span className="font-mono font-semibold text-foreground">{step.matchingSize}</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" /><span>探索中 / 増加パス</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" /><span>マッチング済み</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500 rounded-full" /><span>花 (Blossom)</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((p) => !p)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
    </>
  );
}
