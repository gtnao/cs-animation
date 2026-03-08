"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface SNode {
  id: number;
  key: number;
  left: number | null;
  right: number | null;
}

type StepType =
  | "init"
  | "insert"
  | "merge_compare"
  | "merge_recurse"
  | "merge_swap"
  | "delete_min"
  | "done";

interface Step {
  type: StepType;
  nodes: SNode[];
  rootId: number | null;
  highlightIds: number[];
  description: string;
}

// --- Algorithm ---

let nextId = 0;

function createNode(key: number): SNode {
  return { id: nextId++, key, left: null, right: null };
}

function cloneNodes(nodes: SNode[]): SNode[] {
  return nodes.map((n) => ({ ...n }));
}

function findNode(nodes: SNode[], id: number | null): SNode | null {
  if (id === null) return null;
  return nodes.find((n) => n.id === id) || null;
}

function generateSteps(operations: string): Step[] {
  nextId = 0;
  const steps: Step[] = [];
  let nodes: SNode[] = [];
  let rootId: number | null = null;

  steps.push({
    type: "init",
    nodes: [],
    rootId: null,
    highlightIds: [],
    description: "Skew Heap を初期化",
  });

  function merge(h1: number | null, h2: number | null): number | null {
    if (h1 === null) return h2;
    if (h2 === null) return h1;

    let n1 = findNode(nodes, h1)!;
    let n2 = findNode(nodes, h2)!;

    steps.push({
      type: "merge_compare",
      nodes: cloneNodes(nodes),
      rootId,
      highlightIds: [h1, h2],
      description: `マージ比較: key=${n1.key} vs key=${n2.key}`,
    });

    if (n1.key > n2.key) {
      [h1, h2] = [h2, h1];
      [n1, n2] = [n2, n1];
    }

    steps.push({
      type: "merge_recurse",
      nodes: cloneNodes(nodes),
      rootId,
      highlightIds: [h1],
      description: `key=${n1.key} の右子と key=${n2.key} を再帰マージ`,
    });

    n1.right = merge(n1.right, h2);

    // Unconditional swap
    [n1.left, n1.right] = [n1.right, n1.left];
    steps.push({
      type: "merge_swap",
      nodes: cloneNodes(nodes),
      rootId,
      highlightIds: [h1],
      description: `key=${n1.key}: 左右の子を無条件交換`,
    });

    return h1;
  }

  const ops = operations
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const op of ops) {
    if (op.startsWith("i")) {
      const val = parseInt(op.substring(1));
      if (isNaN(val)) continue;
      const node = createNode(val);
      nodes.push(node);

      steps.push({
        type: "insert",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [node.id],
        description: `Insert(${val}): 新しいノードを作成`,
      });

      rootId = merge(rootId, node.id);

      steps.push({
        type: "insert",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: rootId !== null ? [rootId] : [],
        description: `Insert(${val}) 完了`,
      });
    } else if (op === "e") {
      if (rootId === null) continue;
      const root = findNode(nodes, rootId)!;

      steps.push({
        type: "delete_min",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [rootId],
        description: `Delete-Min: 最小ノード(key=${root.key})を削除`,
      });

      const leftId = root.left;
      const rightId = root.right;
      nodes = nodes.filter((n) => n.id !== rootId);
      rootId = merge(leftId, rightId);

      steps.push({
        type: "delete_min",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: rootId !== null ? [rootId] : [],
        description: "Delete-Min 完了: 左右の子をマージ",
      });
    }
  }

  steps.push({
    type: "done",
    nodes: cloneNodes(nodes),
    rootId,
    highlightIds: [],
    description: "全操作完了",
  });

  return steps;
}

// --- Tree rendering ---

function TreeNode({
  nodeId,
  allNodes,
  step,
}: {
  nodeId: number | null;
  allNodes: SNode[];
  step: Step;
}) {
  if (nodeId === null) return null;
  const node = allNodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const isHighlighted = step.highlightIds.includes(node.id);
  const isRoot = node.id === step.rootId;

  let bgClass = "bg-white";
  let borderClass = "border-gray-200";

  if (isHighlighted) {
    bgClass = "bg-blue-100";
    borderClass = "border-blue-400";
  }
  if (isRoot) {
    bgClass = "bg-emerald-100";
    borderClass = "border-emerald-500";
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 flex items-center justify-center border-2 rounded text-sm font-mono ${bgClass} ${borderClass}`}
      >
        {node.key}
      </div>
      {(node.left !== null || node.right !== null) && (
        <div className="flex gap-2 mt-1">
          <div className="flex flex-col items-center">
            {node.left !== null ? (
              <TreeNode nodeId={node.left} allNodes={allNodes} step={step} />
            ) : (
              <div className="w-6 h-6 flex items-center justify-center text-[10px] text-muted-foreground">
                -
              </div>
            )}
          </div>
          <div className="flex flex-col items-center">
            {node.right !== null ? (
              <TreeNode nodeId={node.right} allNodes={allNodes} step={step} />
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

export default function SkewHeapAnimationPage() {
  const [input, setInput] = useState("i5,i3,i8,i1,i7,e,i2,e");
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
        <h1 className="text-2xl font-bold mb-1">Skew Heap</h1>
        <p className="text-sm text-muted-foreground mb-6">
          無条件左右交換のマージ可能ヒープ
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="i5,i3,e (i=insert, e=extract-min)"
            className="font-mono max-w-md"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          i[数値]=insert, e=extract-min (例: i5,i3,i8,e)
        </p>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            ヒープ
          </div>
          <div className="flex justify-center overflow-x-auto pb-2 min-h-[80px] border border-border rounded p-3">
            {step.rootId !== null ? (
              <TreeNode
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
          {step.rootId !== null && (
            <span>
              最小:{" "}
              <span className="font-mono font-semibold text-foreground">
                {step.nodes.find((n) => n.id === step.rootId)?.key}
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
            <span>根 (最小)</span>
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
