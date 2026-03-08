"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface FibNode {
  id: number;
  key: number;
  degree: number;
  mark: boolean;
  children: number[]; // ids of children
  parent: number | null;
}

type StepType =
  | "init"
  | "insert"
  | "find_min"
  | "extract_min_start"
  | "move_children"
  | "consolidate_link"
  | "consolidate_done"
  | "decrease_key"
  | "cut"
  | "cascading_cut"
  | "done";

interface Step {
  type: StepType;
  nodes: FibNode[];
  rootIds: number[];
  minId: number | null;
  highlightIds: number[];
  description: string;
}

// --- Algorithm step generation ---

let nextId = 0;

function createNode(key: number): FibNode {
  return {
    id: nextId++,
    key,
    degree: 0,
    mark: false,
    children: [],
    parent: null,
  };
}

function cloneNodes(nodes: FibNode[]): FibNode[] {
  return nodes.map((n) => ({ ...n, children: [...n.children] }));
}

function generateSteps(operations: string): Step[] {
  nextId = 0;
  const steps: Step[] = [];
  let nodes: FibNode[] = [];
  let rootIds: number[] = [];
  let minId: number | null = null;

  steps.push({
    type: "init",
    nodes: [],
    rootIds: [],
    minId: null,
    highlightIds: [],
    description: "Fibonacci Heap を初期化",
  });

  const ops = operations
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const op of ops) {
    if (op.startsWith("i")) {
      // Insert
      const val = parseInt(op.substring(1));
      if (isNaN(val)) continue;
      const node = createNode(val);
      nodes.push(node);
      rootIds.push(node.id);
      if (minId === null || val < nodes.find((n) => n.id === minId)!.key) {
        minId = node.id;
      }
      steps.push({
        type: "insert",
        nodes: cloneNodes(nodes),
        rootIds: [...rootIds],
        minId,
        highlightIds: [node.id],
        description: `Insert(${val}): ノードを根リストに追加`,
      });
    } else if (op === "e") {
      // Extract-Min
      if (minId === null) continue;
      const minNode = nodes.find((n) => n.id === minId)!;

      steps.push({
        type: "extract_min_start",
        nodes: cloneNodes(nodes),
        rootIds: [...rootIds],
        minId,
        highlightIds: [minId],
        description: `Extract-Min: 最小ノード(key=${minNode.key})を削除開始`,
      });

      // Move children to root list
      for (const cid of minNode.children) {
        const child = nodes.find((n) => n.id === cid)!;
        child.parent = null;
        child.mark = false;
        rootIds.push(cid);
      }

      if (minNode.children.length > 0) {
        steps.push({
          type: "move_children",
          nodes: cloneNodes(nodes),
          rootIds: [...rootIds],
          minId,
          highlightIds: [...minNode.children],
          description: `最小ノードの子(${minNode.children.length}個)を根リストに移動`,
        });
      }

      // Remove min from root list
      rootIds = rootIds.filter((id) => id !== minId);
      nodes = nodes.filter((n) => n.id !== minId);

      if (rootIds.length === 0) {
        minId = null;
        steps.push({
          type: "consolidate_done",
          nodes: cloneNodes(nodes),
          rootIds: [...rootIds],
          minId,
          highlightIds: [],
          description: "ヒープが空になった",
        });
      } else {
        // Consolidate
        const maxDegree = Math.floor(Math.log2(nodes.length + 1)) + 2;
        const degreeTable: (number | null)[] = new Array(maxDegree + 1).fill(
          null
        );

        const currentRoots = [...rootIds];
        for (const rid of currentRoots) {
          let x = rid;
          let xNode = nodes.find((n) => n.id === x)!;
          let d = xNode.degree;

          while (d < degreeTable.length && degreeTable[d] !== null) {
            let y = degreeTable[d]!;
            let yNode = nodes.find((n) => n.id === y)!;
            xNode = nodes.find((n) => n.id === x)!;

            if (xNode.key > yNode.key) {
              [x, y] = [y, x];
              [xNode, yNode] = [yNode, xNode];
            }

            // Link y under x
            rootIds = rootIds.filter((id) => id !== y);
            yNode.parent = x;
            yNode.mark = false;
            xNode.children.push(y);
            xNode.degree++;

            steps.push({
              type: "consolidate_link",
              nodes: cloneNodes(nodes),
              rootIds: [...rootIds],
              minId: x,
              highlightIds: [x, y],
              description: `Consolidate: ノード(key=${yNode.key})をノード(key=${xNode.key})の子にリンク (degree=${d})`,
            });

            degreeTable[d] = null;
            d++;
          }
          if (d < degreeTable.length) {
            degreeTable[d] = x;
          }
        }

        // Find new min
        minId = rootIds[0];
        for (const rid of rootIds) {
          const rNode = nodes.find((n) => n.id === rid)!;
          const curMin = nodes.find((n) => n.id === minId)!;
          if (rNode.key < curMin.key) {
            minId = rid;
          }
        }

        steps.push({
          type: "consolidate_done",
          nodes: cloneNodes(nodes),
          rootIds: [...rootIds],
          minId,
          highlightIds: minId !== null ? [minId] : [],
          description: `Consolidate 完了: 新しい最小ノード(key=${nodes.find((n) => n.id === minId)?.key})`,
        });
      }
    }
  }

  steps.push({
    type: "done",
    nodes: cloneNodes(nodes),
    rootIds: [...rootIds],
    minId,
    highlightIds: [],
    description: "全操作完了",
  });

  return steps;
}

// --- Node rendering ---

function NodeBox({
  node,
  allNodes,
  step,
  depth,
}: {
  node: FibNode;
  allNodes: FibNode[];
  step: Step;
  depth: number;
}) {
  const isHighlighted = step.highlightIds.includes(node.id);
  const isMin = node.id === step.minId;

  let borderClass = "border-gray-200";
  let bgClass = "bg-white";

  if (isHighlighted) {
    bgClass = "bg-blue-100";
    borderClass = "border-blue-400";
  }
  if (isMin) {
    bgClass = "bg-emerald-100";
    borderClass = "border-emerald-500";
  }
  if (node.mark) {
    bgClass = isHighlighted ? "bg-amber-100" : "bg-amber-50";
    borderClass = "border-amber-400";
  }

  const children = node.children
    .map((cid) => allNodes.find((n) => n.id === cid))
    .filter(Boolean) as FibNode[];

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 flex items-center justify-center border-2 rounded text-sm font-mono ${bgClass} ${borderClass}`}
      >
        {node.key}
      </div>
      {node.mark && (
        <div className="text-[9px] text-amber-600 font-mono">mark</div>
      )}
      <div className="text-[9px] text-muted-foreground font-mono">
        d={node.degree}
      </div>
      {children.length > 0 && (
        <div className="flex gap-1 mt-1 pl-2 border-l border-gray-300">
          {children.map((child) => (
            <NodeBox
              key={child.id}
              node={child}
              allNodes={allNodes}
              step={step}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Component ---

export default function FibonacciHeapAnimationPage() {
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

  const rootNodes = step.rootIds
    .map((id) => step.nodes.find((n) => n.id === id))
    .filter(Boolean) as FibNode[];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Fibonacci Heap</h1>
        <p className="text-sm text-muted-foreground mb-6">
          償却計算量が優れたヒープ構造
        </p>

        {/* Input */}
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
          i[数値]=insert, e=extract-min (例: i5,i3,i8,e,i2)
        </p>

        {/* Heap visualization */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            根リスト
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 min-h-[80px] items-start border border-border rounded p-3">
            {rootNodes.length === 0 ? (
              <div className="text-sm text-muted-foreground">空</div>
            ) : (
              rootNodes.map((node) => (
                <NodeBox
                  key={node.id}
                  node={node}
                  allNodes={step.nodes}
                  step={step}
                  depth={0}
                />
              ))
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            ノード数:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.nodes.length}
            </span>
          </span>
          <span>
            根の数:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.rootIds.length}
            </span>
          </span>
          {step.minId !== null && (
            <span>
              最小:{" "}
              <span className="font-mono font-semibold text-foreground">
                {step.nodes.find((n) => n.id === step.minId)?.key}
              </span>
            </span>
          )}
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Description */}
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded" />
            <span>処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded" />
            <span>最小ノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded" />
            <span>マーク付き</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200 rounded" />
            <span>デフォルト</span>
          </div>
        </div>

        {/* Controls */}
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
