"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

interface GraphInput {
  nodeCount: number;
  edges: [number, number][];
}

type StepType = "init" | "process_state" | "transition" | "found" | "done";

interface Step {
  type: StepType;
  mask: number;
  endNode: number;
  dp: boolean[][];
  transitionFrom: { mask: number; node: number } | null;
  transitionTo: { mask: number; node: number } | null;
  path: number[];
  description: string;
}

// --- Step generation ---

function generateSteps(graph: GraphInput): Step[] {
  const { nodeCount: n, edges } = graph;
  const steps: Step[] = [];

  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const full = (1 << n) - 1;
  // dp[mask][v] = can we visit exactly the vertices in mask, ending at v?
  const dp: boolean[][] = Array.from({ length: 1 << n }, () =>
    new Array(n).fill(false)
  );
  // parent tracking for path reconstruction
  const parent: { mask: number; node: number }[][] = Array.from(
    { length: 1 << n },
    () => new Array(n).fill(null)
  );

  // Initialize: start from each single vertex
  for (let v = 0; v < n; v++) {
    dp[1 << v][v] = true;
  }

  steps.push({
    type: "init",
    mask: 0,
    endNode: -1,
    dp: dp.map((row) => [...row]),
    transitionFrom: null,
    transitionTo: null,
    path: [],
    description: `DP 初期化。各頂点 v について dp[{v}][v] = true。`,
  });

  let foundMask = -1;
  let foundNode = -1;

  for (let mask = 1; mask <= full; mask++) {
    for (let u = 0; u < n; u++) {
      if (!(mask & (1 << u))) continue;
      if (!dp[mask][u]) continue;

      for (const v of adj[u]) {
        if (mask & (1 << v)) continue;

        const newMask = mask | (1 << v);
        if (!dp[newMask][v]) {
          dp[newMask][v] = true;
          parent[newMask][v] = { mask, node: u };

          const visitedNodes = [];
          for (let i = 0; i < n; i++) {
            if (newMask & (1 << i)) visitedNodes.push(i);
          }

          steps.push({
            type: "transition",
            mask: newMask,
            endNode: v,
            dp: dp.map((row) => [...row]),
            transitionFrom: { mask, node: u },
            transitionTo: { mask: newMask, node: v },
            path: [],
            description: `dp[${toBinStr(mask, n)}][${u}] → dp[${toBinStr(newMask, n)}][${v}]: 頂点集合 {${visitedNodes.join(",")}} で頂点 ${v} に到達可能。`,
          });

          if (newMask === full) {
            foundMask = newMask;
            foundNode = v;
          }
        }
      }
    }
  }

  // Reconstruct path
  const path: number[] = [];
  if (foundNode >= 0) {
    let curMask = foundMask;
    let curNode = foundNode;
    while (curNode >= 0) {
      path.push(curNode);
      const p = parent[curMask][curNode];
      if (!p) break;
      curMask = p.mask;
      curNode = p.node;
    }
    path.reverse();

    steps.push({
      type: "found",
      mask: full,
      endNode: foundNode,
      dp: dp.map((row) => [...row]),
      transitionFrom: null,
      transitionTo: null,
      path: [...path],
      description: `ハミルトン路を発見! 経路: [${path.join(" → ")}]`,
    });
  }

  steps.push({
    type: "done",
    mask: foundNode >= 0 ? full : 0,
    endNode: foundNode,
    dp: dp.map((row) => [...row]),
    transitionFrom: null,
    transitionTo: null,
    path: [...path],
    description: foundNode >= 0
      ? `完了。ハミルトン路: [${path.join(" → ")}]`
      : "完了。ハミルトン路は存在しない。",
  });

  return steps;
}

function toBinStr(mask: number, n: number): string {
  return mask.toString(2).padStart(n, "0");
}

// --- Default graph ---

const DEFAULT_GRAPH: GraphInput = {
  nodeCount: 5,
  edges: [
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 3],
    [2, 4],
    [3, 4],
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

export default function HamiltonianPathAnimationPage() {
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
    }, 500);
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

  const pathSet = new Set(step.path);
  const pathEdgeSet = new Set<string>();
  for (let i = 0; i < step.path.length - 1; i++) {
    const a = step.path[i];
    const b = step.path[i + 1];
    pathEdgeSet.add(`${a}-${b}`);
    pathEdgeSet.add(`${b}-${a}`);
  }

  const inMask = (idx: number) => !!(step.mask & (1 << idx));

  const getNodeFill = (idx: number) => {
    if (idx === step.endNode && step.type !== "done" && step.type !== "init")
      return "fill-blue-100";
    if (step.path.length > 0 && pathSet.has(idx)) return "fill-emerald-100";
    if (step.transitionTo && idx === step.transitionTo.node) return "fill-blue-100";
    if (step.transitionFrom && idx === step.transitionFrom.node) return "fill-amber-50";
    if (inMask(idx)) return "fill-gray-100";
    return "fill-white";
  };

  const getNodeStroke = (idx: number) => {
    if (idx === step.endNode && step.type !== "done" && step.type !== "init")
      return "stroke-blue-400";
    if (step.path.length > 0 && pathSet.has(idx)) return "stroke-emerald-500";
    return "stroke-gray-300";
  };

  const getEdgeColor = (u: number, v: number) => {
    if (pathEdgeSet.has(`${u}-${v}`)) return "stroke-emerald-500";
    if (
      step.transitionFrom &&
      step.transitionTo &&
      ((step.transitionFrom.node === u && step.transitionTo.node === v) ||
        (step.transitionFrom.node === v && step.transitionTo.node === u))
    )
      return "stroke-blue-400";
    return "stroke-gray-300";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">ハミルトン路 DP</h1>
        <p className="text-sm text-muted-foreground mb-6">
          ビットマスク DP で全頂点を1回ずつ通る経路を探索
        </p>

        <div className="mb-6 border border-border rounded p-4">
          <svg viewBox="0 0 600 400" className="w-full h-auto max-h-[400px]">
            {graph.edges.map(([u, v], idx) => {
              const p1 = positions[u];
              const p2 = positions[v];
              const color = getEdgeColor(u, v);
              return (
                <line
                  key={`edge-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  className={color}
                  strokeWidth={color !== "stroke-gray-300" ? 3 : 1.5}
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

        {/* Current state */}
        <div className="mb-4">
          <span className="text-xs text-muted-foreground font-mono">
            マスク: {toBinStr(step.mask, graph.nodeCount)} (訪問済み:{" "}
            {Array.from({ length: graph.nodeCount }, (_, i) =>
              step.mask & (1 << i) ? i : null
            )
              .filter((x) => x !== null)
              .join(",")})
          </span>
        </div>

        {step.path.length > 0 && (
          <div className="mb-4">
            <span className="text-xs text-muted-foreground">
              経路: [{step.path.join(" → ")}]
            </span>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>遷移先</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>遷移元</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>ハミルトン路</span>
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
