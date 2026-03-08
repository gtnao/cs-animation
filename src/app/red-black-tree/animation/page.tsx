"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type Color = "RED" | "BLACK";

interface RBNode {
  key: number;
  color: Color;
  left: RBNode | null;
  right: RBNode | null;
  parent: RBNode | null;
}

interface PositionedNode {
  key: number;
  x: number;
  y: number;
  nodeColor: Color;
  highlight: "default" | "current" | "uncle" | "rotateTarget" | "recolor";
  left: PositionedNode | null;
  right: PositionedNode | null;
}

type StepType =
  | "init"
  | "bst_insert"
  | "color_red"
  | "case1_recolor"
  | "case2_rotate"
  | "case3_rotate"
  | "root_black"
  | "done";

interface Step {
  type: StepType;
  treeSnapshot: RBNode | null;
  currentNode: number | null;
  description: string;
}

// --- RB tree utilities ---

function cloneTree(node: RBNode | null, parent: RBNode | null = null): RBNode | null {
  if (!node) return null;
  const newNode: RBNode = {
    key: node.key,
    color: node.color,
    left: null,
    right: null,
    parent,
  };
  newNode.left = cloneTree(node.left, newNode);
  newNode.right = cloneTree(node.right, newNode);
  return newNode;
}

function snapshotTree(node: RBNode | null): RBNode | null {
  return cloneTree(node);
}

function findNode(root: RBNode | null, key: number): RBNode | null {
  if (!root) return null;
  if (key === root.key) return root;
  if (key < root.key) return findNode(root.left, key);
  return findNode(root.right, key);
}

function leftRotate(root: RBNode, x: RBNode): RBNode {
  const y = x.right!;
  x.right = y.left;
  if (y.left) y.left.parent = x;
  y.parent = x.parent;
  if (!x.parent) {
    root = y;
  } else if (x === x.parent.left) {
    x.parent.left = y;
  } else {
    x.parent.right = y;
  }
  y.left = x;
  x.parent = y;
  return root;
}

function rightRotate(root: RBNode, y: RBNode): RBNode {
  const x = y.left!;
  y.left = x.right;
  if (x.right) x.right.parent = y;
  x.parent = y.parent;
  if (!y.parent) {
    root = x;
  } else if (y === y.parent.left) {
    y.parent.left = x;
  } else {
    y.parent.right = x;
  }
  x.right = y;
  y.parent = x;
  return root;
}

function bstInsert(root: RBNode | null, key: number): { root: RBNode; inserted: RBNode } {
  const newNode: RBNode = { key, color: "RED", left: null, right: null, parent: null };
  if (!root) {
    return { root: newNode, inserted: newNode };
  }
  let current: RBNode | null = root;
  let parent: RBNode = root;
  while (current) {
    parent = current;
    if (key < current.key) {
      current = current.left;
    } else if (key > current.key) {
      current = current.right;
    } else {
      return { root, inserted: current };
    }
  }
  newNode.parent = parent;
  if (key < parent.key) {
    parent.left = newNode;
  } else {
    parent.right = newNode;
  }
  return { root, inserted: newNode };
}

function insertFixup(root: RBNode, z: RBNode, steps: Step[]): RBNode {
  while (z.parent && z.parent.color === "RED") {
    if (z.parent.parent && z.parent === z.parent.parent.left) {
      const uncle = z.parent.parent.right;
      if (uncle && uncle.color === "RED") {
        // Case 1
        z.parent.color = "BLACK";
        uncle.color = "BLACK";
        z.parent.parent.color = "RED";
        steps.push({
          type: "case1_recolor",
          treeSnapshot: snapshotTree(root),
          currentNode: z.parent.parent.key,
          description: `Case 1: 叔父 ${uncle.key} が赤。親と叔父を黒に、祖父 ${z.parent.parent.key} を赤に変更`,
        });
        z = z.parent.parent;
      } else {
        if (z === z.parent.right) {
          // Case 2
          z = z.parent;
          steps.push({
            type: "case2_rotate",
            treeSnapshot: snapshotTree(root),
            currentNode: z.key,
            description: `Case 2: ノード ${z.key} で左回転`,
          });
          root = leftRotate(root, z);
        }
        // Case 3
        z.parent!.color = "BLACK";
        z.parent!.parent!.color = "RED";
        steps.push({
          type: "case3_rotate",
          treeSnapshot: snapshotTree(root),
          currentNode: z.parent!.parent!.key,
          description: `Case 3: 色変更し、ノード ${z.parent!.parent!.key} で右回転`,
        });
        root = rightRotate(root, z.parent!.parent!);
      }
    } else if (z.parent.parent) {
      const uncle = z.parent.parent.left;
      if (uncle && uncle.color === "RED") {
        z.parent.color = "BLACK";
        uncle.color = "BLACK";
        z.parent.parent.color = "RED";
        steps.push({
          type: "case1_recolor",
          treeSnapshot: snapshotTree(root),
          currentNode: z.parent.parent.key,
          description: `Case 1: 叔父 ${uncle.key} が赤。親と叔父を黒に、祖父 ${z.parent.parent.key} を赤に変更`,
        });
        z = z.parent.parent;
      } else {
        if (z === z.parent.left) {
          z = z.parent;
          steps.push({
            type: "case2_rotate",
            treeSnapshot: snapshotTree(root),
            currentNode: z.key,
            description: `Case 2: ノード ${z.key} で右回転`,
          });
          root = rightRotate(root, z);
        }
        z.parent!.color = "BLACK";
        z.parent!.parent!.color = "RED";
        steps.push({
          type: "case3_rotate",
          treeSnapshot: snapshotTree(root),
          currentNode: z.parent!.parent!.key,
          description: `Case 3: 色変更し、ノード ${z.parent!.parent!.key} で左回転`,
        });
        root = leftRotate(root, z.parent!.parent!);
      }
    }
  }
  root.color = "BLACK";
  steps.push({
    type: "root_black",
    treeSnapshot: snapshotTree(root),
    currentNode: root.key,
    description: "根を黒に設定",
  });
  return root;
}

// --- Layout ---

function layoutTree(
  node: RBNode | null,
  x: number,
  y: number,
  spread: number,
  currentNode: number | null
): PositionedNode | null {
  if (!node) return null;

  let highlight: PositionedNode["highlight"] = "default";
  if (node.key === currentNode) highlight = "current";

  return {
    key: node.key,
    x,
    y,
    nodeColor: node.color,
    highlight,
    left: layoutTree(node.left, x - spread, y + 60, spread * 0.6, currentNode),
    right: layoutTree(node.right, x + spread, y + 60, spread * 0.6, currentNode),
  };
}

// --- SVG ---

function getNodeFill(node: PositionedNode): string {
  if (node.highlight === "current") return "#dbeafe";
  return node.nodeColor === "RED" ? "#fee2e2" : "#374151";
}

function getNodeStroke(node: PositionedNode): string {
  if (node.highlight === "current") return "#60a5fa";
  return node.nodeColor === "RED" ? "#ef4444" : "#1f2937";
}

function getTextColor(node: PositionedNode): string {
  if (node.highlight === "current") return "#1f2937";
  return node.nodeColor === "RED" ? "#dc2626" : "#ffffff";
}

function renderEdges(node: PositionedNode | null): React.ReactNode[] {
  if (!node) return [];
  const edges: React.ReactNode[] = [];
  if (node.left) {
    edges.push(<line key={`e-${node.key}-l`} x1={node.x} y1={node.y} x2={node.left.x} y2={node.left.y} stroke="#9ca3af" strokeWidth={2} />);
    edges.push(...renderEdges(node.left));
  }
  if (node.right) {
    edges.push(<line key={`e-${node.key}-r`} x1={node.x} y1={node.y} x2={node.right.x} y2={node.right.y} stroke="#9ca3af" strokeWidth={2} />);
    edges.push(...renderEdges(node.right));
  }
  return edges;
}

function renderNodes(node: PositionedNode | null): React.ReactNode[] {
  if (!node) return [];
  const nodes: React.ReactNode[] = [];
  nodes.push(
    <g key={`n-${node.key}`}>
      <circle cx={node.x} cy={node.y} r={20} fill={getNodeFill(node)} stroke={getNodeStroke(node)} strokeWidth={2} />
      <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize={13} fontFamily="monospace" fill={getTextColor(node)} fontWeight="bold">{node.key}</text>
    </g>
  );
  nodes.push(...renderNodes(node.left));
  nodes.push(...renderNodes(node.right));
  return nodes;
}

// --- Component ---

export default function RedBlackTreeAnimationPage() {
  const [input, setInput] = useState("7,3,18,10,22,8,11,26");
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
    let root: RBNode | null = null;

    allSteps.push({
      type: "init",
      treeSnapshot: null,
      currentNode: null,
      description: "空の赤黒木からスタート",
    });

    for (const val of values) {
      allSteps.push({
        type: "bst_insert",
        treeSnapshot: snapshotTree(root),
        currentNode: null,
        description: `値 ${val} をBST挿入で追加`,
      });

      const { root: newRoot, inserted } = bstInsert(root, val);
      root = newRoot;

      allSteps.push({
        type: "color_red",
        treeSnapshot: snapshotTree(root),
        currentNode: val,
        description: `ノード ${val} を赤で挿入`,
      });

      root = insertFixup(root, findNode(root, val)!, allSteps);
    }

    allSteps.push({
      type: "done",
      treeSnapshot: snapshotTree(root),
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

  const positioned = step.treeSnapshot
    ? layoutTree(step.treeSnapshot, 300, 40, 120, step.currentNode)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">赤黒木</h1>
        <p className="text-sm text-muted-foreground mb-6">挿入操作と色変更・回転をステップごとに可視化</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="カンマ区切りで値を入力" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-4 bg-white">
          <svg width="600" height={positioned ? 350 : 50} viewBox="0 0 600 350" className="w-full h-auto">
            {positioned && renderEdges(positioned)}
            {positioned && renderNodes(positioned)}
            {!positioned && <text x="300" y="30" textAnchor="middle" fontSize={14} fill="#9ca3af">空の木</text>}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500 rounded-full" />
            <span>赤ノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-gray-700 border-2 border-gray-900 rounded-full" />
            <span>黒ノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" />
            <span>処理中</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((p) => !p)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
      </div>
    </div>
  );
}
