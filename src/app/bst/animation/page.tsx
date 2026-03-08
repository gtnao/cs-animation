"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface TreeNode {
  key: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

interface PositionedNode {
  key: number;
  x: number;
  y: number;
  color: "default" | "current" | "found" | "inserted" | "highlight";
  left: PositionedNode | null;
  right: PositionedNode | null;
}

type StepType =
  | "init"
  | "visit"
  | "go_left"
  | "go_right"
  | "insert"
  | "not_found"
  | "found"
  | "done";

interface Step {
  type: StepType;
  tree: TreeNode | null;
  highlightPath: number[];
  currentNode: number | null;
  description: string;
}

// --- Tree utilities ---

function cloneTree(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  return { key: node.key, left: cloneTree(node.left), right: cloneTree(node.right) };
}

function insertNode(node: TreeNode | null, key: number): TreeNode {
  if (!node) return { key, left: null, right: null };
  if (key < node.key) {
    return { key: node.key, left: insertNode(node.left, key), right: node.right };
  } else if (key > node.key) {
    return { key: node.key, left: node.left, right: insertNode(node.right, key) };
  }
  return node;
}

// --- Step generation ---

function generateInsertSteps(tree: TreeNode | null, key: number): Step[] {
  const steps: Step[] = [];
  const path: number[] = [];

  steps.push({
    type: "init",
    tree: cloneTree(tree),
    highlightPath: [],
    currentNode: null,
    description: `値 ${key} を挿入します`,
  });

  let current = tree;
  while (current !== null) {
    path.push(current.key);
    steps.push({
      type: "visit",
      tree: cloneTree(tree),
      highlightPath: [...path],
      currentNode: current.key,
      description: `ノード ${current.key} を訪問。${key} と比較`,
    });

    if (key < current.key) {
      steps.push({
        type: "go_left",
        tree: cloneTree(tree),
        highlightPath: [...path],
        currentNode: current.key,
        description: `${key} < ${current.key} なので左の子へ進む`,
      });
      current = current.left;
    } else if (key > current.key) {
      steps.push({
        type: "go_right",
        tree: cloneTree(tree),
        highlightPath: [...path],
        currentNode: current.key,
        description: `${key} > ${current.key} なので右の子へ進む`,
      });
      current = current.right;
    } else {
      steps.push({
        type: "found",
        tree: cloneTree(tree),
        highlightPath: [...path],
        currentNode: current.key,
        description: `値 ${key} は既に存在しています`,
      });
      return steps;
    }
  }

  const newTree = insertNode(tree, key);
  path.push(key);
  steps.push({
    type: "insert",
    tree: cloneTree(newTree),
    highlightPath: [...path],
    currentNode: key,
    description: `空の位置に到達。ノード ${key} を挿入`,
  });

  steps.push({
    type: "done",
    tree: cloneTree(newTree),
    highlightPath: [],
    currentNode: null,
    description: `値 ${key} の挿入が完了`,
  });

  return steps;
}

// --- Layout ---

function layoutTree(
  node: TreeNode | null,
  x: number,
  y: number,
  spread: number,
  highlightPath: number[],
  currentNode: number | null,
  insertedNode: number | null
): PositionedNode | null {
  if (!node) return null;

  let color: PositionedNode["color"] = "default";
  if (node.key === currentNode) {
    color = "current";
  } else if (node.key === insertedNode) {
    color = "inserted";
  } else if (highlightPath.includes(node.key)) {
    color = "highlight";
  }

  return {
    key: node.key,
    x,
    y,
    color,
    left: layoutTree(node.left, x - spread, y + 60, spread * 0.6, highlightPath, currentNode, insertedNode),
    right: layoutTree(node.right, x + spread, y + 60, spread * 0.6, highlightPath, currentNode, insertedNode),
  };
}

// --- SVG rendering ---

function getNodeFill(color: PositionedNode["color"]): string {
  switch (color) {
    case "current": return "#dbeafe";
    case "found": return "#d1fae5";
    case "inserted": return "#d1fae5";
    case "highlight": return "#fef3c7";
    default: return "#ffffff";
  }
}

function getNodeStroke(color: PositionedNode["color"]): string {
  switch (color) {
    case "current": return "#60a5fa";
    case "found": return "#10b981";
    case "inserted": return "#10b981";
    case "highlight": return "#f59e0b";
    default: return "#d1d5db";
  }
}

function renderEdges(node: PositionedNode | null): React.ReactNode[] {
  if (!node) return [];
  const edges: React.ReactNode[] = [];
  if (node.left) {
    edges.push(
      <line
        key={`edge-${node.key}-${node.left.key}`}
        x1={node.x}
        y1={node.y}
        x2={node.left.x}
        y2={node.left.y}
        stroke="#9ca3af"
        strokeWidth={2}
      />
    );
    edges.push(...renderEdges(node.left));
  }
  if (node.right) {
    edges.push(
      <line
        key={`edge-${node.key}-${node.right.key}`}
        x1={node.x}
        y1={node.y}
        x2={node.right.x}
        y2={node.right.y}
        stroke="#9ca3af"
        strokeWidth={2}
      />
    );
    edges.push(...renderEdges(node.right));
  }
  return edges;
}

function renderNodes(node: PositionedNode | null): React.ReactNode[] {
  if (!node) return [];
  const nodes: React.ReactNode[] = [];
  nodes.push(
    <g key={`node-${node.key}`}>
      <circle
        cx={node.x}
        cy={node.y}
        r={20}
        fill={getNodeFill(node.color)}
        stroke={getNodeStroke(node.color)}
        strokeWidth={2}
      />
      <text
        x={node.x}
        y={node.y + 5}
        textAnchor="middle"
        fontSize={14}
        fontFamily="monospace"
        fill="#1f2937"
      >
        {node.key}
      </text>
    </g>
  );
  nodes.push(...renderNodes(node.left));
  nodes.push(...renderNodes(node.right));
  return nodes;
}

// --- Component ---

export default function BSTAnimationPage() {
  const [input, setInput] = useState("5,3,7,1,4,6,8");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const values = s
      .split(",")
      .map((v) => parseInt(v.trim(), 10))
      .filter((v) => !isNaN(v));
    if (values.length === 0) return;

    const allSteps: Step[] = [];
    let tree: TreeNode | null = null;

    allSteps.push({
      type: "init",
      tree: null,
      highlightPath: [],
      currentNode: null,
      description: "空の木からスタート",
    });

    for (const val of values) {
      const insertSteps = generateInsertSteps(tree, val);
      allSteps.push(...insertSteps);
      tree = insertNode(tree, val);
    }

    allSteps.push({
      type: "done",
      tree: cloneTree(tree),
      highlightPath: [],
      currentNode: null,
      description: "全ての値の挿入が完了",
    });

    setSteps(allSteps);
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, steps.length]);

  // Keyboard shortcuts
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

  const positioned = step.tree
    ? layoutTree(
        step.tree,
        300,
        40,
        120,
        step.highlightPath,
        step.currentNode,
        step.type === "insert" ? step.currentNode : null
      )
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">二分探索木 (BST)</h1>
        <p className="text-sm text-muted-foreground mb-6">
          挿入操作をステップごとに可視化
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="カンマ区切りで値を入力"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* Tree visualization */}
        <div className="mb-6 border border-border rounded p-4 bg-white">
          <svg width="600" height={positioned ? 350 : 50} viewBox="0 0 600 350" className="w-full h-auto">
            {positioned && renderEdges(positioned)}
            {positioned && renderNodes(positioned)}
            {!positioned && (
              <text x="300" y="30" textAnchor="middle" fontSize={14} fill="#9ca3af">
                空の木
              </text>
            )}
          </svg>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" />
            <span>現在のノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>探索パス</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>挿入完了</span>
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
