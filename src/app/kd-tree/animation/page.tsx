"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface Point {
  x: number;
  y: number;
}

interface KdNode {
  id: number;
  point: Point;
  axis: number; // 0 = x, 1 = y
  left: number | null;
  right: number | null;
}

type StepType =
  | "init"
  | "insert"
  | "insert_compare"
  | "insert_done"
  | "search_start"
  | "search_visit"
  | "search_update_best"
  | "search_check_other"
  | "search_prune"
  | "search_done"
  | "done";

interface Step {
  type: StepType;
  nodes: KdNode[];
  rootId: number | null;
  highlightIds: number[];
  bestId: number | null;
  queryPoint?: Point;
  bestDist?: number;
  description: string;
}

// --- Algorithm ---

let nextId = 0;

function cloneNodes(nodes: KdNode[]): KdNode[] {
  return nodes.map((n) => ({ ...n, point: { ...n.point } }));
}

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function generateSteps(input: string): Step[] {
  nextId = 0;
  const steps: Step[] = [];
  let nodes: KdNode[] = [];
  let rootId: number | null = null;

  steps.push({
    type: "init",
    nodes: [],
    rootId: null,
    highlightIds: [],
    bestId: null,
    description: "k-d Tree (2次元) を初期化",
  });

  function insertNode(
    nodeId: number | null,
    point: Point,
    newId: number,
    depth: number
  ): number {
    if (nodeId === null) {
      const node: KdNode = {
        id: newId,
        point,
        axis: depth % 2,
        left: null,
        right: null,
      };
      nodes.push(node);
      return newId;
    }

    const cur = nodes.find((n) => n.id === nodeId)!;
    const axis = cur.axis;
    const axisName = axis === 0 ? "x" : "y";
    const curVal = axis === 0 ? cur.point.x : cur.point.y;
    const newVal = axis === 0 ? point.x : point.y;

    steps.push({
      type: "insert_compare",
      nodes: cloneNodes(nodes),
      rootId,
      highlightIds: [nodeId],
      bestId: null,
      description: `挿入比較: (${point.x},${point.y}) の ${axisName}=${newVal} vs ノード (${cur.point.x},${cur.point.y}) の ${axisName}=${curVal}`,
    });

    if (newVal < curVal) {
      cur.left = insertNode(cur.left, point, newId, depth + 1);
    } else {
      cur.right = insertNode(cur.right, point, newId, depth + 1);
    }

    return nodeId;
  }

  function nearestSearch(
    nodeId: number | null,
    query: Point,
    bestRef: { id: number | null; dist: number }
  ): void {
    if (nodeId === null) return;
    const node = nodes.find((n) => n.id === nodeId)!;
    const d = dist(node.point, query);

    steps.push({
      type: "search_visit",
      nodes: cloneNodes(nodes),
      rootId,
      highlightIds: [nodeId],
      bestId: bestRef.id,
      queryPoint: query,
      bestDist: bestRef.dist,
      description: `訪問: (${node.point.x},${node.point.y}), 距離=${d.toFixed(2)}`,
    });

    if (d < bestRef.dist) {
      bestRef.id = nodeId;
      bestRef.dist = d;

      steps.push({
        type: "search_update_best",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [nodeId],
        bestId: bestRef.id,
        queryPoint: query,
        bestDist: bestRef.dist,
        description: `最良更新: (${node.point.x},${node.point.y}), 距離=${d.toFixed(2)}`,
      });
    }

    const axis = node.axis;
    const diff =
      axis === 0 ? query.x - node.point.x : query.y - node.point.y;
    const first = diff <= 0 ? node.left : node.right;
    const second = diff <= 0 ? node.right : node.left;

    nearestSearch(first, query, bestRef);

    if (Math.abs(diff) < bestRef.dist) {
      steps.push({
        type: "search_check_other",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: second !== null ? [second] : [],
        bestId: bestRef.id,
        queryPoint: query,
        bestDist: bestRef.dist,
        description: `反対側探索: 分割面距離 ${Math.abs(diff).toFixed(2)} < 最良距離 ${bestRef.dist.toFixed(2)}`,
      });
      nearestSearch(second, query, bestRef);
    } else if (second !== null) {
      steps.push({
        type: "search_prune",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [second],
        bestId: bestRef.id,
        queryPoint: query,
        bestDist: bestRef.dist,
        description: `枝刈り: 分割面距離 ${Math.abs(diff).toFixed(2)} >= 最良距離 ${bestRef.dist.toFixed(2)}`,
      });
    }
  }

  const ops = input
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const op of ops) {
    if (op.startsWith("i")) {
      const match = op.match(/i\(?(\d+),\s*(\d+)\)?/);
      if (!match) continue;
      const p: Point = { x: parseInt(match[1]), y: parseInt(match[2]) };
      const newNodeId = nextId++;

      steps.push({
        type: "insert",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [],
        bestId: null,
        description: `Insert(${p.x},${p.y})`,
      });

      rootId = insertNode(rootId, p, newNodeId, 0);

      steps.push({
        type: "insert_done",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [newNodeId],
        bestId: null,
        description: `Insert(${p.x},${p.y}) 完了`,
      });
    } else if (op.startsWith("q")) {
      const match = op.match(/q\(?(\d+),\s*(\d+)\)?/);
      if (!match) continue;
      const q: Point = { x: parseInt(match[1]), y: parseInt(match[2]) };

      steps.push({
        type: "search_start",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [],
        bestId: null,
        queryPoint: q,
        description: `最近傍探索: クエリ (${q.x},${q.y})`,
      });

      const bestRef = { id: null as number | null, dist: Infinity };
      nearestSearch(rootId, q, bestRef);

      const bestNode = bestRef.id !== null ? nodes.find((n) => n.id === bestRef.id) : null;
      steps.push({
        type: "search_done",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: bestRef.id !== null ? [bestRef.id] : [],
        bestId: bestRef.id,
        queryPoint: q,
        bestDist: bestRef.dist,
        description: `探索完了: 最近傍 = ${bestNode ? `(${bestNode.point.x},${bestNode.point.y})` : "なし"}, 距離=${bestRef.dist.toFixed(2)}`,
      });
    }
  }

  steps.push({
    type: "done",
    nodes: cloneNodes(nodes),
    rootId,
    highlightIds: [],
    bestId: null,
    description: "全操作完了",
  });

  return steps;
}

// --- Tree rendering ---

function TreeNodeView({
  nodeId,
  allNodes,
  step,
}: {
  nodeId: number | null;
  allNodes: KdNode[];
  step: Step;
}) {
  if (nodeId === null) return null;
  const node = allNodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const isHighlighted = step.highlightIds.includes(node.id);
  const isBest = node.id === step.bestId;

  let bgClass = "bg-white";
  let borderClass = "border-gray-200";

  if (isBest) {
    bgClass = "bg-emerald-100";
    borderClass = "border-emerald-500";
  }
  if (isHighlighted) {
    bgClass = "bg-blue-100";
    borderClass = "border-blue-400";
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={`px-2 py-1 flex flex-col items-center border-2 rounded text-xs font-mono ${bgClass} ${borderClass}`}
      >
        <span>
          ({node.point.x},{node.point.y})
        </span>
        <span className="text-[9px] text-muted-foreground">
          {node.axis === 0 ? "x軸" : "y軸"}
        </span>
      </div>
      {(node.left !== null || node.right !== null) && (
        <div className="flex gap-2 mt-1">
          <div className="flex flex-col items-center">
            {node.left !== null ? (
              <TreeNodeView
                nodeId={node.left}
                allNodes={allNodes}
                step={step}
              />
            ) : (
              <div className="w-6 h-6 flex items-center justify-center text-[10px] text-muted-foreground">
                -
              </div>
            )}
          </div>
          <div className="flex flex-col items-center">
            {node.right !== null ? (
              <TreeNodeView
                nodeId={node.right}
                allNodes={allNodes}
                step={step}
              />
            ) : (
              <div className="w-6 h-6 flex items-center justify-center text-[10px] text-muted-foreground">
                -
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Component ---

export default function KdTreeAnimationPage() {
  const [input, setInput] = useState(
    "i(7,2);i(5,4);i(9,6);i(2,3);i(4,7);i(8,1);q(6,3)"
  );
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const trimmed = s.trim();
    if (trimmed.length === 0) return;
    setSteps(generateSteps(trimmed));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(input);
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
    }, 700);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">k-d Tree</h1>
        <p className="text-sm text-muted-foreground mb-6">
          2次元空間の点を管理する空間分割木
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="i(7,2);i(5,4);q(6,3)"
            className="font-mono max-w-lg"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          i(x,y)=点の挿入, q(x,y)=最近傍探索 (セミコロン区切り)
        </p>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            k-d Tree
            {step.queryPoint && (
              <span className="ml-2 text-blue-600">
                クエリ: ({step.queryPoint.x},{step.queryPoint.y})
              </span>
            )}
          </div>
          <div className="flex justify-center overflow-x-auto pb-2 min-h-[80px] border border-border rounded p-3">
            {step.rootId !== null ? (
              <TreeNodeView
                nodeId={step.rootId}
                allNodes={step.nodes}
                step={step}
              />
            ) : (
              <div className="text-sm text-muted-foreground">空</div>
            )}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            ノード数:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.nodes.length}
            </span>
          </span>
          {step.bestDist !== undefined && step.bestDist < Infinity && (
            <span>
              最良距離:{" "}
              <span className="font-mono font-semibold text-foreground">
                {step.bestDist.toFixed(2)}
              </span>
            </span>
          )}
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded" />
            <span>処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded" />
            <span>最近傍候補</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200 rounded" />
            <span>デフォルト</span>
          </div>
        </div>

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
