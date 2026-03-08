"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface WaveletNode {
  id: number;
  lo: number;
  hi: number;
  seq: number[];
  bits: number[];  // 0 = left child, 1 = right child
  leftCount: number[];  // prefix count of 0-bits
  left: number | null;
  right: number | null;
}

type StepType =
  | "init"
  | "build_node"
  | "build_partition"
  | "kth_visit"
  | "kth_go_left"
  | "kth_go_right"
  | "kth_result"
  | "done";

interface Step {
  type: StepType;
  nodes: WaveletNode[];
  highlightNodes: number[];
  description: string;
}

// --- Algorithm ---

let nodeIdCounter = 0;

function buildWaveletTree(arr: number[]): { steps: Step[]; nodes: WaveletNode[] } {
  const steps: Step[] = [];
  const nodes: WaveletNode[] = [];
  nodeIdCounter = 0;

  const vals = [...new Set(arr)].sort((a, b) => a - b);
  const lo = vals[0] || 0;
  const hi = vals[vals.length - 1] || 0;

  steps.push({
    type: "init",
    nodes: [],
    highlightNodes: [],
    description: `配列 [${arr.join(", ")}] から Wavelet Tree を構築 (値域 [${lo}, ${hi}])`,
  });

  function build(seq: number[], lo: number, hi: number): number | null {
    if (seq.length === 0 || lo > hi) return null;

    const id = nodeIdCounter++;
    const mid = Math.floor((lo + hi) / 2);
    const bits = seq.map((v) => (v <= mid ? 0 : 1));
    const leftCount = [0];
    for (let i = 0; i < bits.length; i++) {
      leftCount.push(leftCount[i] + (bits[i] === 0 ? 1 : 0));
    }

    const node: WaveletNode = {
      id,
      lo,
      hi,
      seq: [...seq],
      bits: [...bits],
      leftCount: [...leftCount],
      left: null,
      right: null,
    };
    nodes.push(node);

    steps.push({
      type: "build_node",
      nodes: nodes.map((n) => ({ ...n })),
      highlightNodes: [id],
      description: `ノード ${id} (値域 [${lo}, ${hi}]): 列 = [${seq.join(",")}], mid = ${mid}`,
    });

    steps.push({
      type: "build_partition",
      nodes: nodes.map((n) => ({ ...n })),
      highlightNodes: [id],
      description: `ビット列 = [${bits.join(",")}] (0: 値≤${mid} → 左, 1: 値>${mid} → 右)`,
    });

    if (lo === hi) return id;

    const leftSeq = seq.filter((v) => v <= mid);
    const rightSeq = seq.filter((v) => v > mid);

    node.left = build(leftSeq, lo, mid);
    node.right = build(rightSeq, mid + 1, hi);

    // Update the node in the array
    nodes[id] = { ...node };

    return id;
  }

  build(arr, lo, hi);

  return { steps, nodes };
}

function kthSmallestSteps(
  nodes: WaveletNode[],
  rootId: number,
  l: number,
  r: number,
  k: number
): Step[] {
  const steps: Step[] = [];

  steps.push({
    type: "kth_visit",
    nodes: nodes.map((n) => ({ ...n })),
    highlightNodes: [],
    description: `区間 [${l}, ${r}] の ${k} 番目に小さい要素を求める`,
  });

  function kth(nodeId: number, l: number, r: number, k: number): number {
    const node = nodes[nodeId];
    if (node.lo === node.hi) {
      steps.push({
        type: "kth_result",
        nodes: nodes.map((n) => ({ ...n })),
        highlightNodes: [nodeId],
        description: `葉ノード ${nodeId}: 値 = ${node.lo}`,
      });
      return node.lo;
    }

    const leftInRange = node.leftCount[r + 1] - node.leftCount[l];
    const newL_left = node.leftCount[l];
    const newR_left = node.leftCount[r + 1] - 1;
    const rightBeforeL = l - node.leftCount[l];
    const rightInRange = (r - l + 1) - leftInRange;

    if (k <= leftInRange && node.left !== null) {
      steps.push({
        type: "kth_go_left",
        nodes: nodes.map((n) => ({ ...n })),
        highlightNodes: [nodeId],
        description: `ノード ${nodeId}: 左に ${leftInRange} 個, 右に ${rightInRange} 個。k=${k} ≤ ${leftInRange} → 左の子へ`,
      });
      return kth(node.left, newL_left, newR_left, k);
    } else if (node.right !== null) {
      const newK = k - leftInRange;
      steps.push({
        type: "kth_go_right",
        nodes: nodes.map((n) => ({ ...n })),
        highlightNodes: [nodeId],
        description: `ノード ${nodeId}: 左に ${leftInRange} 個, 右に ${rightInRange} 個。k=${k} > ${leftInRange} → 右の子へ (k'=${newK})`,
      });
      return kth(node.right, rightBeforeL, rightBeforeL + rightInRange - 1, newK);
    }
    return node.lo;
  }

  const result = kth(rootId, l, r, k);

  steps.push({
    type: "done",
    nodes: nodes.map((n) => ({ ...n })),
    highlightNodes: [],
    description: `結果: 区間 [${l}, ${r}] の ${k} 番目に小さい要素 = ${result}`,
  });

  return steps;
}

// --- Visualization ---

function TreeVisualization({ step }: { step: Step }) {
  const { nodes } = step;
  if (nodes.length === 0) return null;

  const levels: WaveletNode[][] = [];
  function traverse(nodeId: number, level: number) {
    if (level >= levels.length) levels.push([]);
    levels[level].push(nodes[nodeId]);
    if (nodes[nodeId].left !== null) traverse(nodes[nodeId].left!, level + 1);
    if (nodes[nodeId].right !== null) traverse(nodes[nodeId].right!, level + 1);
  }
  traverse(0, 0);

  return (
    <div className="overflow-x-auto pb-2">
      {levels.map((level, li) => (
        <div key={li} className="flex justify-center gap-2 mb-2">
          {level.map((node) => {
            const isHighlighted = step.highlightNodes.includes(node.id);
            let color = "bg-white border-gray-200";
            if (isHighlighted) {
              if (step.type === "kth_go_left") color = "bg-blue-100 border-blue-400";
              else if (step.type === "kth_go_right") color = "bg-amber-50 border-amber-400";
              else if (step.type === "kth_result") color = "bg-emerald-100 border-emerald-500";
              else color = "bg-blue-100 border-blue-400";
            }
            return (
              <div key={node.id} className="flex flex-col items-center">
                <div className={`px-2 py-1 border-2 text-xs font-mono transition-colors rounded ${color}`}>
                  <div className="font-semibold">[{node.lo},{node.hi}]</div>
                  <div>{node.seq.join(",")}</div>
                  {node.lo !== node.hi && (
                    <div className="text-[10px] text-muted-foreground">
                      bits: {node.bits.join("")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// --- Component ---

export default function WaveletTreeAnimationPage() {
  const [input, setInput] = useState("3 1 4 1 5 2 6 3");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queryL, setQueryL] = useState("1");
  const [queryR, setQueryR] = useState("5");
  const [queryK, setQueryK] = useState("2");
  const [mode, setMode] = useState<"build" | "kth">("build");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesRef = useRef<WaveletNode[]>([]);

  const runBuild = useCallback((s: string) => {
    const arr = s.trim().split(/\s+/).map(Number).filter((x) => !isNaN(x));
    if (arr.length === 0) return;
    const { steps: st, nodes } = buildWaveletTree(arr);
    nodesRef.current = nodes;
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
    setMode("build");
  }, []);

  const runKth = useCallback(() => {
    const l = parseInt(queryL);
    const r = parseInt(queryR);
    const k = parseInt(queryK);
    if (isNaN(l) || isNaN(r) || isNaN(k) || l < 0 || l > r || k < 1) return;
    if (nodesRef.current.length === 0) return;
    const st = kthSmallestSteps(nodesRef.current, 0, l, r, k);
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
    setMode("kth");
  }, [queryL, queryR, queryK]);

  useEffect(() => {
    runBuild(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 700);
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

  return (
    <>
<div className="flex gap-2 mb-4">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runBuild(input); }} placeholder="配列を空白区切りで入力" className="font-mono max-w-xs" />
          <Button onClick={() => runBuild(input)} variant="outline">構築</Button>
        </div>
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input value={queryL} onChange={(e) => setQueryL(e.target.value)} placeholder="L" className="font-mono w-16" />
          <Input value={queryR} onChange={(e) => setQueryR(e.target.value)} placeholder="R" className="font-mono w-16" />
          <Input value={queryK} onChange={(e) => setQueryK(e.target.value)} placeholder="K" className="font-mono w-16" />
          <Button onClick={runKth} variant="outline">K番目に小さい要素</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">Wavelet Tree</div>
          <TreeVisualization step={step} />
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>モード: <span className="font-mono font-semibold text-foreground">{mode === "build" ? "構築" : "K番目"}</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>処理中 / 左の子へ</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>右の子へ</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>結果</span></div>
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
