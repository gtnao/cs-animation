"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface Interval {
  low: number;
  high: number;
}

interface ITNode {
  id: number;
  interval: Interval;
  max: number;
  left: number | null;
  right: number | null;
}

type StepType =
  | "init"
  | "insert"
  | "insert_compare"
  | "insert_update_max"
  | "query_start"
  | "query_check"
  | "query_found"
  | "query_go_left"
  | "query_go_right"
  | "query_done"
  | "done";

interface Step {
  type: StepType;
  nodes: ITNode[];
  rootId: number | null;
  highlightIds: number[];
  foundIds: number[];
  queryInterval?: Interval;
  description: string;
}

// --- Algorithm ---

let nextId = 0;

function cloneNodes(nodes: ITNode[]): ITNode[] {
  return nodes.map((n) => ({ ...n, interval: { ...n.interval } }));
}

function findNode(nodes: ITNode[], id: number | null): ITNode | null {
  if (id === null) return null;
  return nodes.find((n) => n.id === id) || null;
}

function updateMax(nodes: ITNode[], id: number | null): number {
  if (id === null) return -Infinity;
  const node = findNode(nodes, id)!;
  const leftMax = node.left !== null ? findNode(nodes, node.left)!.max : -Infinity;
  const rightMax = node.right !== null ? findNode(nodes, node.right)!.max : -Infinity;
  node.max = Math.max(node.interval.high, leftMax, rightMax);
  return node.max;
}

function generateSteps(input: string): Step[] {
  nextId = 0;
  const steps: Step[] = [];
  let nodes: ITNode[] = [];
  let rootId: number | null = null;

  steps.push({
    type: "init",
    nodes: [],
    rootId: null,
    highlightIds: [],
    foundIds: [],
    description: "Interval Tree を初期化",
  });

  function insertNode(
    nodeId: number | null,
    interval: Interval,
    newId: number
  ): number {
    if (nodeId === null) {
      const node: ITNode = {
        id: newId,
        interval,
        max: interval.high,
        left: null,
        right: null,
      };
      nodes.push(node);
      return newId;
    }

    const cur = findNode(nodes, nodeId)!;

    steps.push({
      type: "insert_compare",
      nodes: cloneNodes(nodes),
      rootId,
      highlightIds: [nodeId],
      foundIds: [],
      description: `挿入比較: [${interval.low},${interval.high}] の低端 ${interval.low} vs ノード [${cur.interval.low},${cur.interval.high}] の低端 ${cur.interval.low}`,
    });

    if (interval.low < cur.interval.low) {
      cur.left = insertNode(cur.left, interval, newId);
    } else {
      cur.right = insertNode(cur.right, interval, newId);
    }

    updateMax(nodes, nodeId);

    steps.push({
      type: "insert_update_max",
      nodes: cloneNodes(nodes),
      rootId,
      highlightIds: [nodeId],
      foundIds: [],
      description: `max更新: ノード [${cur.interval.low},${cur.interval.high}] の max = ${cur.max}`,
    });

    return nodeId;
  }

  function queryOverlap(
    nodeId: number | null,
    q: Interval,
    found: number[]
  ): void {
    if (nodeId === null) return;
    const node = findNode(nodes, nodeId)!;

    steps.push({
      type: "query_check",
      nodes: cloneNodes(nodes),
      rootId,
      highlightIds: [nodeId],
      foundIds: [...found],
      queryInterval: q,
      description: `検査: ノード [${node.interval.low},${node.interval.high}] と [${q.low},${q.high}] の重なりを確認`,
    });

    // Check overlap
    if (node.interval.low <= q.high && q.low <= node.interval.high) {
      found.push(nodeId);
      steps.push({
        type: "query_found",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [nodeId],
        foundIds: [...found],
        queryInterval: q,
        description: `発見: [${node.interval.low},${node.interval.high}] は [${q.low},${q.high}] と重なる`,
      });
    }

    // Check left subtree
    if (node.left !== null) {
      const leftNode = findNode(nodes, node.left)!;
      if (leftNode.max >= q.low) {
        steps.push({
          type: "query_go_left",
          nodes: cloneNodes(nodes),
          rootId,
          highlightIds: [node.left],
          foundIds: [...found],
          queryInterval: q,
          description: `左部分木へ: max=${leftNode.max} >= ${q.low}`,
        });
        queryOverlap(node.left, q, found);
      }
    }

    // Check right subtree
    if (node.right !== null) {
      const rightNode = findNode(nodes, node.right)!;
      if (rightNode.max >= q.low) {
        steps.push({
          type: "query_go_right",
          nodes: cloneNodes(nodes),
          rootId,
          highlightIds: [node.right],
          foundIds: [...found],
          queryInterval: q,
          description: `右部分木へ: max=${rightNode.max} >= ${q.low}`,
        });
        queryOverlap(node.right, q, found);
      }
    }
  }

  const ops = input
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const op of ops) {
    if (op.startsWith("i")) {
      // Insert: i[low,high]
      const match = op.match(/i\[?(\d+),(\d+)\]?/);
      if (!match) continue;
      const low = parseInt(match[1]);
      const high = parseInt(match[2]);
      const newNodeId = nextId++;

      steps.push({
        type: "insert",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [],
        foundIds: [],
        description: `Insert([${low},${high}]): 区間を挿入`,
      });

      rootId = insertNode(rootId, { low, high }, newNodeId);

      steps.push({
        type: "insert",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [newNodeId],
        foundIds: [],
        description: `Insert([${low},${high}]) 完了`,
      });
    } else if (op.startsWith("q")) {
      // Query: q[low,high]
      const match = op.match(/q\[?(\d+),(\d+)\]?/);
      if (!match) continue;
      const low = parseInt(match[1]);
      const high = parseInt(match[2]);
      const q: Interval = { low, high };

      steps.push({
        type: "query_start",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [],
        foundIds: [],
        queryInterval: q,
        description: `Query([${low},${high}]): 重なり検索開始`,
      });

      const found: number[] = [];
      queryOverlap(rootId, q, found);

      const foundIntervals = found
        .map((id) => {
          const n = findNode(nodes, id);
          return n ? `[${n.interval.low},${n.interval.high}]` : "";
        })
        .join(", ");

      steps.push({
        type: "query_done",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [],
        foundIds: [...found],
        queryInterval: q,
        description: `Query 完了: ${found.length}件の重なり${foundIntervals ? " (" + foundIntervals + ")" : ""}`,
      });
    }
  }

  steps.push({
    type: "done",
    nodes: cloneNodes(nodes),
    rootId,
    highlightIds: [],
    foundIds: [],
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
  allNodes: ITNode[];
  step: Step;
}) {
  if (nodeId === null) return null;
  const node = allNodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const isHighlighted = step.highlightIds.includes(node.id);
  const isFound = step.foundIds.includes(node.id);

  let bgClass = "bg-white";
  let borderClass = "border-gray-200";

  if (isFound) {
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
          [{node.interval.low},{node.interval.high}]
        </span>
        <span className="text-[9px] text-muted-foreground">
          max={node.max}
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

export default function IntervalTreeAnimationPage() {
  const [input, setInput] = useState(
    "i[15,20];i[10,30];i[17,19];i[5,20];i[12,15];i[30,40];q[14,16]"
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
        <h1 className="text-2xl font-bold mb-1">Interval Tree</h1>
        <p className="text-sm text-muted-foreground mb-6">
          区間の重なり検索を効率的に行う木構造
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="i[15,20];i[10,30];q[14,16]"
            className="font-mono max-w-lg"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          i[low,high]=区間挿入, q[low,high]=重なり検索 (セミコロン区切り)
        </p>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Interval Tree
            {step.queryInterval && (
              <span className="ml-2 text-blue-600">
                クエリ: [{step.queryInterval.low},{step.queryInterval.high}]
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
            <span>重なり発見</span>
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
