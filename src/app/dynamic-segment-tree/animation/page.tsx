"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface DynNode {
  id: number;
  val: number;
  left: number | null;
  right: number | null;
  rangeL: number;
  rangeR: number;
}

type StepType =
  | "init"
  | "update_visit"
  | "update_create"
  | "update_leaf"
  | "update_merge"
  | "query_visit"
  | "query_null"
  | "query_covered"
  | "query_partial"
  | "query_result"
  | "done";

interface Step {
  type: StepType;
  nodes: DynNode[];
  rootId: number | null;
  highlightNodes: number[];
  rangeMax: number;
  description: string;
}

// --- Algorithm ---

let nodeCounter = 0;

function createAnimation(rangeMax: number) {
  const nodes: DynNode[] = [];
  nodeCounter = 0;

  function newNode(rangeL: number, rangeR: number): number {
    const id = nodeCounter++;
    nodes.push({ id, val: 0, left: null, right: null, rangeL, rangeR });
    return id;
  }

  function updateSteps(
    rootId: number | null,
    pos: number,
    val: number
  ): { steps: Step[]; newRootId: number } {
    const steps: Step[] = [];

    steps.push({
      type: "init",
      nodes: nodes.map((n) => ({ ...n })),
      rootId,
      highlightNodes: [],
      rangeMax,
      description: `位置 ${pos} に ${val} を加算する (値域 [0, ${rangeMax}])`,
    });

    function update(nodeId: number | null, l: number, r: number, pos: number, val: number): number {
      if (nodeId === null) {
        nodeId = newNode(l, r);
        steps.push({
          type: "update_create",
          nodes: nodes.map((n) => ({ ...n })),
          rootId,
          highlightNodes: [nodeId],
          rangeMax,
          description: `新しいノード ${nodeId} を作成 (区間 [${l}, ${r}])`,
        });
      } else {
        steps.push({
          type: "update_visit",
          nodes: nodes.map((n) => ({ ...n })),
          rootId,
          highlightNodes: [nodeId],
          rangeMax,
          description: `ノード ${nodeId} を訪問 (区間 [${l}, ${r}])`,
        });
      }

      if (l === r) {
        nodes[nodeId].val += val;
        steps.push({
          type: "update_leaf",
          nodes: nodes.map((n) => ({ ...n })),
          rootId,
          highlightNodes: [nodeId],
          rangeMax,
          description: `葉ノード ${nodeId}: 値 = ${nodes[nodeId].val}`,
        });
        return nodeId;
      }

      const mid = Math.floor((l + r) / 2);
      if (pos <= mid) {
        nodes[nodeId].left = update(nodes[nodeId].left, l, mid, pos, val);
      } else {
        nodes[nodeId].right = update(nodes[nodeId].right, mid + 1, r, pos, val);
      }

      const leftChild = nodes[nodeId].left;
      const rightChild = nodes[nodeId].right;
      const leftVal = leftChild !== null ? nodes[leftChild].val : 0;
      const rightVal = rightChild !== null ? nodes[rightChild].val : 0;
      nodes[nodeId].val = leftVal + rightVal;

      steps.push({
        type: "update_merge",
        nodes: nodes.map((n) => ({ ...n })),
        rootId,
        highlightNodes: [nodeId],
        rangeMax,
        description: `ノード ${nodeId} を更新: ${leftVal} + ${rightVal} = ${nodes[nodeId].val}`,
      });

      return nodeId;
    }

    const newRootId = update(rootId, 0, rangeMax, pos, val);

    steps.push({
      type: "done",
      nodes: nodes.map((n) => ({ ...n })),
      rootId: newRootId,
      highlightNodes: [],
      rangeMax,
      description: `更新完了。現在のノード数: ${nodes.length}`,
    });

    return { steps, newRootId };
  }

  function queryStepsGen(
    rootId: number | null,
    ql: number,
    qr: number
  ): Step[] {
    const steps: Step[] = [];

    steps.push({
      type: "init",
      nodes: nodes.map((n) => ({ ...n })),
      rootId,
      highlightNodes: [],
      rangeMax,
      description: `区間 [${ql}, ${qr}] の合計を求める`,
    });

    function query(nodeId: number | null, l: number, r: number, ql: number, qr: number): number {
      if (nodeId === null) {
        steps.push({
          type: "query_null",
          nodes: nodes.map((n) => ({ ...n })),
          rootId,
          highlightNodes: [],
          rangeMax,
          description: `null ノード (区間 [${l}, ${r}]): → 0`,
        });
        return 0;
      }
      if (qr < l || r < ql) {
        steps.push({
          type: "query_visit",
          nodes: nodes.map((n) => ({ ...n })),
          rootId,
          highlightNodes: [nodeId],
          rangeMax,
          description: `ノード ${nodeId} (区間 [${l}, ${r}]): 区間外 → 0`,
        });
        return 0;
      }
      if (ql <= l && r <= qr) {
        steps.push({
          type: "query_covered",
          nodes: nodes.map((n) => ({ ...n })),
          rootId,
          highlightNodes: [nodeId],
          rangeMax,
          description: `ノード ${nodeId} (区間 [${l}, ${r}]): 完全に含まれる → ${nodes[nodeId].val}`,
        });
        return nodes[nodeId].val;
      }
      steps.push({
        type: "query_partial",
        nodes: nodes.map((n) => ({ ...n })),
        rootId,
        highlightNodes: [nodeId],
        rangeMax,
        description: `ノード ${nodeId} (区間 [${l}, ${r}]): 部分的 → 子を探索`,
      });
      const mid = Math.floor((l + r) / 2);
      const leftVal = query(nodes[nodeId].left, l, mid, ql, qr);
      const rightVal = query(nodes[nodeId].right, mid + 1, r, ql, qr);
      return leftVal + rightVal;
    }

    const result = query(rootId, 0, rangeMax, ql, qr);
    steps.push({
      type: "query_result",
      nodes: nodes.map((n) => ({ ...n })),
      rootId,
      highlightNodes: [],
      rangeMax,
      description: `クエリ結果: sum([${ql}, ${qr}]) = ${result}`,
    });

    return steps;
  }

  return { updateSteps, queryStepsGen, nodes };
}

// --- Visualization ---

function TreeVisualization({ step }: { step: Step }) {
  const { nodes, rootId } = step;
  if (rootId === null || nodes.length === 0) {
    return <div className="text-sm text-muted-foreground">まだノードがありません</div>;
  }

  const levels: DynNode[][] = [];
  function traverse(nodeId: number, level: number) {
    if (level >= levels.length) levels.push([]);
    levels[level].push(nodes[nodeId]);
    if (nodes[nodeId].left !== null) traverse(nodes[nodeId].left, level + 1);
    if (nodes[nodeId].right !== null) traverse(nodes[nodeId].right, level + 1);
  }
  traverse(rootId, 0);

  return (
    <div className="overflow-x-auto pb-2">
      {levels.map((level, li) => (
        <div key={li} className="flex justify-center gap-1 mb-1">
          {level.map((nd) => {
            const isHighlighted = step.highlightNodes.includes(nd.id);
            let color = "bg-white border-gray-200";
            if (isHighlighted) {
              if (step.type === "query_covered") color = "bg-emerald-100 border-emerald-500";
              else if (step.type === "query_partial") color = "bg-amber-50 border-amber-400";
              else color = "bg-blue-100 border-blue-400";
            }
            return (
              <div key={nd.id} className="flex flex-col items-center">
                <div className={`min-w-[3rem] h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors rounded ${color}`}>
                  {nd.val}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  [{nd.rangeL},{nd.rangeR}]
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

export default function DynamicSegmentTreeAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [updatePos, setUpdatePos] = useState("3");
  const [updateVal, setUpdateVal] = useState("5");
  const [queryL, setQueryL] = useState("0");
  const [queryR, setQueryR] = useState("7");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rangeMax = 15;
  const animRef = useRef(createAnimation(rangeMax));
  const rootRef = useRef<number | null>(null);

  const runUpdate = useCallback(() => {
    const pos = parseInt(updatePos);
    const val = parseInt(updateVal);
    if (isNaN(pos) || isNaN(val) || pos < 0 || pos > rangeMax) return;
    const result = animRef.current.updateSteps(rootRef.current, pos, val);
    rootRef.current = result.newRootId;
    setSteps(result.steps);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [updatePos, updateVal]);

  const runQuery = useCallback(() => {
    const l = parseInt(queryL);
    const r = parseInt(queryR);
    if (isNaN(l) || isNaN(r) || l < 0 || r > rangeMax || l > r) return;
    const st = animRef.current.queryStepsGen(rootRef.current, l, r);
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [queryL, queryR]);

  useEffect(() => {
    // Initial: add a few values
    const anim = animRef.current;
    let result = anim.updateSteps(null, 3, 5);
    rootRef.current = result.newRootId;
    result = anim.updateSteps(rootRef.current, 7, 2);
    rootRef.current = result.newRootId;
    result = anim.updateSteps(rootRef.current, 1, 8);
    rootRef.current = result.newRootId;
    setSteps(result.steps);
    setCurrentStep(0);
  }, []);

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

  return (
    <>
<div className="flex gap-2 mb-4 flex-wrap">
          <Input value={updatePos} onChange={(e) => setUpdatePos(e.target.value)} placeholder="位置" className="font-mono w-16" />
          <Input value={updateVal} onChange={(e) => setUpdateVal(e.target.value)} placeholder="加算値" className="font-mono w-20" />
          <Button onClick={runUpdate} variant="outline">加算</Button>
        </div>
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input value={queryL} onChange={(e) => setQueryL(e.target.value)} placeholder="L" className="font-mono w-16" />
          <Input value={queryR} onChange={(e) => setQueryR(e.target.value)} placeholder="R" className="font-mono w-16" />
          <Button onClick={runQuery} variant="outline">クエリ [L, R]</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">動的セグメント木</div>
          <TreeVisualization step={step} />
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>ノード数: <span className="font-mono font-semibold text-foreground">{step.nodes.length}</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>処理中 / 新規ノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>部分的に重なる</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>完全に含まれる</span>
          </div>
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
