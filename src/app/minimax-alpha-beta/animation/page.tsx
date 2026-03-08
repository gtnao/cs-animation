"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface TreeNode {
  id: number;
  value: number | null;
  children: number[];
  isMax: boolean;
  alpha: number;
  beta: number;
  pruned: boolean;
}

type StepType = "init" | "visit" | "evaluate_leaf" | "update_alpha" | "update_beta" | "prune" | "backtrack" | "done";

interface Step {
  type: StepType;
  nodes: TreeNode[];
  currentNode: number;
  description: string;
}

// --- Build a sample game tree and run alpha-beta ---

function generateSteps(leafValues: number[]): Step[] {
  const steps: Step[] = [];

  // Build a balanced binary tree with given leaf values
  const depth = Math.ceil(Math.log2(leafValues.length));
  const totalLeaves = Math.pow(2, depth);
  const paddedLeaves = [...leafValues];
  while (paddedLeaves.length < totalLeaves) paddedLeaves.push(0);

  const nodes: TreeNode[] = [];
  let id = 0;

  // Build tree top-down
  function buildTree(currentDepth: number, isMax: boolean, leafStart: number): number {
    const nodeId = id++;
    if (currentDepth === depth) {
      nodes.push({
        id: nodeId,
        value: paddedLeaves[leafStart],
        children: [],
        isMax,
        alpha: -Infinity,
        beta: Infinity,
        pruned: false,
      });
      return nodeId;
    }
    const halfSize = Math.pow(2, depth - currentDepth - 1);
    const left = buildTree(currentDepth + 1, !isMax, leafStart);
    const right = buildTree(currentDepth + 1, !isMax, leafStart + halfSize);
    nodes.push({
      id: nodeId,
      value: null,
      children: [left, right],
      isMax,
      alpha: -Infinity,
      beta: Infinity,
      pruned: false,
    });
    // Re-sort: we need to place this node at nodeId position
    return nodeId;
  }

  // Simpler approach: build nodes array in order
  nodes.length = 0;
  id = 0;

  // Pre-allocate all nodes
  const totalNodes = Math.pow(2, depth + 1) - 1;
  for (let i = 0; i < totalNodes; i++) {
    const nodeDepth = Math.floor(Math.log2(i + 1));
    const isLeaf = nodeDepth === depth;
    const isMax = nodeDepth % 2 === 0;
    const leafIdx = isLeaf ? i - (Math.pow(2, depth) - 1) : -1;
    nodes.push({
      id: i,
      value: isLeaf ? paddedLeaves[leafIdx] : null,
      children: isLeaf ? [] : [2 * i + 1, 2 * i + 2],
      isMax,
      alpha: -Infinity,
      beta: Infinity,
      pruned: false,
    });
  }

  steps.push({
    type: "init",
    nodes: nodes.map((n) => ({ ...n })),
    currentNode: 0,
    description: `ゲーム木を構築: 深さ ${depth}, 葉のリーフ値 [${leafValues.join(",")}]`,
  });

  // Alpha-beta pruning
  function alphaBeta(nodeIdx: number, alpha: number, beta: number): number {
    const node = nodes[nodeIdx];

    steps.push({
      type: "visit",
      nodes: nodes.map((n) => ({ ...n })),
      currentNode: nodeIdx,
      description: `ノード ${nodeIdx} を訪問 (${node.isMax ? "MAX" : "MIN"}ノード, alpha=${alpha === -Infinity ? "-∞" : alpha}, beta=${beta === Infinity ? "∞" : beta})`,
    });

    if (node.children.length === 0) {
      node.alpha = alpha;
      node.beta = beta;
      steps.push({
        type: "evaluate_leaf",
        nodes: nodes.map((n) => ({ ...n })),
        currentNode: nodeIdx,
        description: `葉ノード ${nodeIdx}: 評価値 = ${node.value}`,
      });
      return node.value!;
    }

    if (node.isMax) {
      let val = -Infinity;
      for (const childIdx of node.children) {
        if (nodes[childIdx].pruned) continue;
        const childVal = alphaBeta(childIdx, alpha, beta);
        if (childVal > val) val = childVal;
        if (val > alpha) {
          alpha = val;
          node.alpha = alpha;
          steps.push({
            type: "update_alpha",
            nodes: nodes.map((n) => ({ ...n })),
            currentNode: nodeIdx,
            description: `ノード ${nodeIdx}: alpha を ${alpha} に更新`,
          });
        }
        if (alpha >= beta) {
          // Prune remaining children
          const remaining = node.children.slice(node.children.indexOf(childIdx) + 1);
          for (const r of remaining) {
            nodes[r].pruned = true;
            // Mark subtree as pruned
            const stack = [r];
            while (stack.length > 0) {
              const s = stack.pop()!;
              nodes[s].pruned = true;
              for (const c of nodes[s].children) stack.push(c);
            }
          }
          steps.push({
            type: "prune",
            nodes: nodes.map((n) => ({ ...n })),
            currentNode: nodeIdx,
            description: `ノード ${nodeIdx}: alpha(${alpha}) >= beta(${beta}), 枝刈り!`,
          });
          break;
        }
      }
      node.value = val;
      node.alpha = alpha;
      node.beta = beta;
      steps.push({
        type: "backtrack",
        nodes: nodes.map((n) => ({ ...n })),
        currentNode: nodeIdx,
        description: `ノード ${nodeIdx} の値 = ${val}`,
      });
      return val;
    } else {
      let val = Infinity;
      for (const childIdx of node.children) {
        if (nodes[childIdx].pruned) continue;
        const childVal = alphaBeta(childIdx, alpha, beta);
        if (childVal < val) val = childVal;
        if (val < beta) {
          beta = val;
          node.beta = beta;
          steps.push({
            type: "update_beta",
            nodes: nodes.map((n) => ({ ...n })),
            currentNode: nodeIdx,
            description: `ノード ${nodeIdx}: beta を ${beta} に更新`,
          });
        }
        if (alpha >= beta) {
          const remaining = node.children.slice(node.children.indexOf(childIdx) + 1);
          for (const r of remaining) {
            nodes[r].pruned = true;
            const stack = [r];
            while (stack.length > 0) {
              const s = stack.pop()!;
              nodes[s].pruned = true;
              for (const c of nodes[s].children) stack.push(c);
            }
          }
          steps.push({
            type: "prune",
            nodes: nodes.map((n) => ({ ...n })),
            currentNode: nodeIdx,
            description: `ノード ${nodeIdx}: alpha(${alpha}) >= beta(${beta}), 枝刈り!`,
          });
          break;
        }
      }
      node.value = val;
      node.alpha = alpha;
      node.beta = beta;
      steps.push({
        type: "backtrack",
        nodes: nodes.map((n) => ({ ...n })),
        currentNode: nodeIdx,
        description: `ノード ${nodeIdx} の値 = ${val}`,
      });
      return val;
    }
  }

  alphaBeta(0, -Infinity, Infinity);

  steps.push({
    type: "done",
    nodes: nodes.map((n) => ({ ...n })),
    currentNode: 0,
    description: `Alpha-Beta剪定完了: ルートの値 = ${nodes[0].value}`,
  });

  return steps;
}

function parseLeaves(s: string): number[] {
  return s.split(",").map(Number).filter((n) => !isNaN(n));
}

const SVG_W = 500;
const SVG_H = 300;

export default function MinimaxAlphaBetaAnimationPage() {
  const [input, setInput] = useState("3,5,6,9,1,2,0,7");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const leaves = parseLeaves(s);
    if (leaves.length < 2) return;
    // Pad to power of 2
    let n = 1;
    while (n < leaves.length) n *= 2;
    while (leaves.length < n) leaves.push(0);
    setSteps(generateSteps(leaves));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(input); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  // Layout: position nodes in tree form
  const totalNodes = step.nodes.length;
  const depth = Math.floor(Math.log2(totalNodes));

  const getPos = (idx: number) => {
    const d = Math.floor(Math.log2(idx + 1));
    const posInLevel = idx - (Math.pow(2, d) - 1);
    const levelWidth = Math.pow(2, d);
    const x = ((posInLevel + 0.5) / levelWidth) * (SVG_W - 40) + 20;
    const y = (d / (depth + 0.5)) * (SVG_H - 60) + 30;
    return { x, y };
  };

  return (
    <>
<div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="葉の値(カンマ区切り, 2のべき乗個)" className="font-mono max-w-md" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-2 bg-white overflow-x-auto">
          <svg width={SVG_W} height={SVG_H} className="w-full h-auto" viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            {/* Edges */}
            {step.nodes.map((node) =>
              node.children.map((childIdx) => {
                const p = getPos(node.id);
                const c = getPos(childIdx);
                const child = step.nodes[childIdx];
                return (
                  <line key={`${node.id}-${childIdx}`} x1={p.x} y1={p.y} x2={c.x} y2={c.y}
                    stroke={child.pruned ? "#fca5a5" : "#d1d5db"} strokeWidth={child.pruned ? 1 : 1.5}
                    strokeDasharray={child.pruned ? "4,4" : undefined} />
                );
              })
            )}
            {/* Nodes */}
            {step.nodes.map((node) => {
              const pos = getPos(node.id);
              const isCurrent = node.id === step.currentNode;
              let fill = "#f9fafb";
              let stroke = "#9ca3af";
              if (node.pruned) { fill = "#fee2e2"; stroke = "#f87171"; }
              else if (isCurrent) { fill = "#dbeafe"; stroke = "#3b82f6"; }
              else if (node.value !== null && node.children.length > 0) {
                fill = node.isMax ? "#d1fae5" : "#fef3c7";
                stroke = node.isMax ? "#10b981" : "#f59e0b";
              }
              const r = node.children.length === 0 ? 14 : 16;
              return (
                <g key={node.id}>
                  {node.isMax && node.children.length > 0 ? (
                    <polygon
                      points={`${pos.x},${pos.y - r} ${pos.x + r},${pos.y + r * 0.6} ${pos.x - r},${pos.y + r * 0.6}`}
                      fill={fill} stroke={stroke} strokeWidth={2}
                    />
                  ) : node.children.length > 0 ? (
                    <polygon
                      points={`${pos.x},${pos.y + r} ${pos.x + r},${pos.y - r * 0.6} ${pos.x - r},${pos.y - r * 0.6}`}
                      fill={fill} stroke={stroke} strokeWidth={2}
                    />
                  ) : (
                    <circle cx={pos.x} cy={pos.y} r={r} fill={fill} stroke={stroke} strokeWidth={2} />
                  )}
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize={11} fill="#374151" fontWeight={isCurrent ? "bold" : "normal"}>
                    {node.value !== null ? node.value : ""}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>現在のノード</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>MAXノード</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>MINノード</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>枝刈り</span></div>
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
