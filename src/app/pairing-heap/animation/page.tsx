"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface PNode {
  id: number;
  key: number;
  children: number[];
}

type StepType =
  | "init"
  | "insert"
  | "merge"
  | "delete_min_start"
  | "pairing_pass"
  | "accumulate_pass"
  | "delete_min_done"
  | "done";

interface Step {
  type: StepType;
  nodes: PNode[];
  rootId: number | null;
  highlightIds: number[];
  description: string;
}

// --- Algorithm ---

let nextId = 0;

function createNode(key: number): PNode {
  return { id: nextId++, key, children: [] };
}

function cloneNodes(nodes: PNode[]): PNode[] {
  return nodes.map((n) => ({ ...n, children: [...n.children] }));
}

function findNode(nodes: PNode[], id: number | null): PNode | null {
  if (id === null) return null;
  return nodes.find((n) => n.id === id) || null;
}

function generateSteps(operations: string): Step[] {
  nextId = 0;
  const steps: Step[] = [];
  let nodes: PNode[] = [];
  let rootId: number | null = null;

  steps.push({
    type: "init",
    nodes: [],
    rootId: null,
    highlightIds: [],
    description: "Pairing Heap を初期化",
  });

  function mergeNodes(
    h1: number | null,
    h2: number | null
  ): number | null {
    if (h1 === null) return h2;
    if (h2 === null) return h1;
    const n1 = findNode(nodes, h1)!;
    const n2 = findNode(nodes, h2)!;
    if (n1.key > n2.key) {
      // h2 becomes root, h1 becomes child
      n2.children.unshift(h1);
      return h2;
    } else {
      // h1 becomes root, h2 becomes child
      n1.children.unshift(h2);
      return h1;
    }
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

      rootId = mergeNodes(rootId, node.id);

      steps.push({
        type: "merge",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: rootId !== null ? [rootId] : [],
        description: `Insert(${val}) 完了: ヒープにマージ`,
      });
    } else if (op === "e") {
      if (rootId === null) continue;
      const root = findNode(nodes, rootId)!;

      steps.push({
        type: "delete_min_start",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [rootId],
        description: `Delete-Min: 最小ノード(key=${root.key})を削除`,
      });

      const childIds = [...root.children];
      nodes = nodes.filter((n) => n.id !== rootId);

      if (childIds.length === 0) {
        rootId = null;
        steps.push({
          type: "delete_min_done",
          nodes: cloneNodes(nodes),
          rootId,
          highlightIds: [],
          description: "Delete-Min 完了: ヒープが空に",
        });
      } else {
        // Pairing pass: merge pairs left to right
        const paired: number[] = [];
        for (let i = 0; i < childIds.length; i += 2) {
          if (i + 1 < childIds.length) {
            // Clear parent-child relationships for merging
            const n1 = findNode(nodes, childIds[i])!;
            const n2 = findNode(nodes, childIds[i + 1])!;
            // Remove these from each other's children if needed
            n1.children = n1.children.filter(
              (c) => c !== childIds[i + 1]
            );
            n2.children = n2.children.filter((c) => c !== childIds[i]);

            const merged = mergeNodes(childIds[i], childIds[i + 1]);
            paired.push(merged!);

            steps.push({
              type: "pairing_pass",
              nodes: cloneNodes(nodes),
              rootId: merged,
              highlightIds: [childIds[i], childIds[i + 1]],
              description: `ペアリング: key=${n1.key} と key=${n2.key} をマージ`,
            });
          } else {
            paired.push(childIds[i]);
          }
        }

        // Accumulate pass: merge right to left
        let result = paired[paired.length - 1];
        for (let j = paired.length - 2; j >= 0; j--) {
          const rNode = findNode(nodes, result)!;
          const pNode = findNode(nodes, paired[j])!;
          result = mergeNodes(paired[j], result)!;

          steps.push({
            type: "accumulate_pass",
            nodes: cloneNodes(nodes),
            rootId: result,
            highlightIds: [rNode.id, pNode.id],
            description: `右から左へマージ: key=${pNode.key} と key=${rNode.key}`,
          });
        }

        rootId = result;
        steps.push({
          type: "delete_min_done",
          nodes: cloneNodes(nodes),
          rootId,
          highlightIds: rootId !== null ? [rootId] : [],
          description: `Delete-Min 完了: 新しい根 key=${findNode(nodes, rootId)?.key}`,
        });
      }
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
  allNodes: PNode[];
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

  const children = node.children
    .map((cid) => allNodes.find((n) => n.id === cid))
    .filter(Boolean) as PNode[];

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 flex items-center justify-center border-2 rounded text-sm font-mono ${bgClass} ${borderClass}`}
      >
        {node.key}
      </div>
      {children.length > 0 && (
        <div className="flex gap-1 mt-1">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              nodeId={child.id}
              allNodes={allNodes}
              step={step}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Component ---

export default function PairingHeapAnimationPage() {
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
    <>
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
    </>
  );
}
