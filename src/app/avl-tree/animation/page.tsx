"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface AVLNode {
  key: number;
  left: AVLNode | null;
  right: AVLNode | null;
  height: number;
}

interface PositionedNode {
  key: number;
  x: number;
  y: number;
  bf: number;
  color: "default" | "current" | "rotateTarget" | "inserted" | "highlight";
  left: PositionedNode | null;
  right: PositionedNode | null;
}

type StepType =
  | "init"
  | "visit"
  | "go_left"
  | "go_right"
  | "insert"
  | "check_balance"
  | "rotate_ll"
  | "rotate_rr"
  | "rotate_lr"
  | "rotate_rl"
  | "balanced"
  | "done";

interface Step {
  type: StepType;
  tree: AVLNode | null;
  highlightPath: number[];
  currentNode: number | null;
  rotateNode: number | null;
  description: string;
}

// --- AVL utilities ---

function height(node: AVLNode | null): number {
  return node ? node.height : -1;
}

function bf(node: AVLNode): number {
  return height(node.left) - height(node.right);
}

function updateHeight(node: AVLNode): void {
  node.height = 1 + Math.max(height(node.left), height(node.right));
}

function cloneTree(node: AVLNode | null): AVLNode | null {
  if (!node) return null;
  return {
    key: node.key,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
    height: node.height,
  };
}

function rightRotate(y: AVLNode): AVLNode {
  const x = y.left!;
  const B = x.right;
  x.right = y;
  y.left = B;
  updateHeight(y);
  updateHeight(x);
  return x;
}

function leftRotate(x: AVLNode): AVLNode {
  const y = x.right!;
  const B = y.left;
  y.left = x;
  x.right = B;
  updateHeight(x);
  updateHeight(y);
  return y;
}

// --- Step generation ---

function generateInsertSteps(root: AVLNode | null, key: number): { steps: Step[]; newTree: AVLNode | null } {
  const steps: Step[] = [];
  const path: number[] = [];

  steps.push({
    type: "init",
    tree: cloneTree(root),
    highlightPath: [],
    currentNode: null,
    rotateNode: null,
    description: `値 ${key} を挿入します`,
  });

  function insertRec(node: AVLNode | null): AVLNode {
    if (!node) {
      const newNode: AVLNode = { key, left: null, right: null, height: 0 };
      return newNode;
    }

    path.push(node.key);
    steps.push({
      type: "visit",
      tree: cloneTree(root),
      highlightPath: [...path],
      currentNode: node.key,
      rotateNode: null,
      description: `ノード ${node.key} を訪問。${key} と比較`,
    });

    if (key < node.key) {
      steps.push({
        type: "go_left",
        tree: cloneTree(root),
        highlightPath: [...path],
        currentNode: node.key,
        rotateNode: null,
        description: `${key} < ${node.key} なので左の子へ`,
      });
      node.left = insertRec(node.left);
    } else if (key > node.key) {
      steps.push({
        type: "go_right",
        tree: cloneTree(root),
        highlightPath: [...path],
        currentNode: node.key,
        rotateNode: null,
        description: `${key} > ${node.key} なので右の子へ`,
      });
      node.right = insertRec(node.right);
    } else {
      return node;
    }

    updateHeight(node);
    const balance = bf(node);

    steps.push({
      type: "check_balance",
      tree: cloneTree(root),
      highlightPath: [...path],
      currentNode: node.key,
      rotateNode: null,
      description: `ノード ${node.key} の平衡係数 = ${balance}`,
    });

    // LL
    if (balance > 1 && node.left && key < node.left.key) {
      steps.push({
        type: "rotate_ll",
        tree: cloneTree(root),
        highlightPath: [...path],
        currentNode: node.key,
        rotateNode: node.key,
        description: `LL回転: ノード ${node.key} で右回転`,
      });
      return rightRotate(node);
    }
    // RR
    if (balance < -1 && node.right && key > node.right.key) {
      steps.push({
        type: "rotate_rr",
        tree: cloneTree(root),
        highlightPath: [...path],
        currentNode: node.key,
        rotateNode: node.key,
        description: `RR回転: ノード ${node.key} で左回転`,
      });
      return leftRotate(node);
    }
    // LR
    if (balance > 1 && node.left && key > node.left.key) {
      steps.push({
        type: "rotate_lr",
        tree: cloneTree(root),
        highlightPath: [...path],
        currentNode: node.key,
        rotateNode: node.key,
        description: `LR回転: ノード ${node.left.key} で左回転 → ノード ${node.key} で右回転`,
      });
      node.left = leftRotate(node.left);
      return rightRotate(node);
    }
    // RL
    if (balance < -1 && node.right && key < node.right.key) {
      steps.push({
        type: "rotate_rl",
        tree: cloneTree(root),
        highlightPath: [...path],
        currentNode: node.key,
        rotateNode: node.key,
        description: `RL回転: ノード ${node.right.key} で右回転 → ノード ${node.key} で左回転`,
      });
      node.right = rightRotate(node.right);
      return leftRotate(node);
    }

    if (Math.abs(balance) <= 1) {
      steps.push({
        type: "balanced",
        tree: cloneTree(root),
        highlightPath: [...path],
        currentNode: node.key,
        rotateNode: null,
        description: `ノード ${node.key} は平衡 (bf=${balance})`,
      });
    }

    return node;
  }

  const newTree = insertRec(cloneTree(root));

  steps.push({
    type: "insert",
    tree: cloneTree(newTree),
    highlightPath: [],
    currentNode: key,
    rotateNode: null,
    description: `値 ${key} の挿入と平衡化が完了`,
  });

  return { steps, newTree };
}

// --- Layout ---

function layoutTree(
  node: AVLNode | null,
  x: number,
  y: number,
  spread: number,
  highlightPath: number[],
  currentNode: number | null,
  rotateNode: number | null
): PositionedNode | null {
  if (!node) return null;

  let color: PositionedNode["color"] = "default";
  if (node.key === rotateNode) {
    color = "rotateTarget";
  } else if (node.key === currentNode) {
    color = "current";
  } else if (highlightPath.includes(node.key)) {
    color = "highlight";
  }

  return {
    key: node.key,
    x,
    y,
    bf: bf(node),
    color,
    left: layoutTree(node.left, x - spread, y + 60, spread * 0.6, highlightPath, currentNode, rotateNode),
    right: layoutTree(node.right, x + spread, y + 60, spread * 0.6, highlightPath, currentNode, rotateNode),
  };
}

// --- SVG rendering ---

function getNodeFill(color: PositionedNode["color"]): string {
  switch (color) {
    case "current": return "#dbeafe";
    case "rotateTarget": return "#fef3c7";
    case "inserted": return "#d1fae5";
    case "highlight": return "#fef3c7";
    default: return "#ffffff";
  }
}

function getNodeStroke(color: PositionedNode["color"]): string {
  switch (color) {
    case "current": return "#60a5fa";
    case "rotateTarget": return "#f59e0b";
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
      <line key={`e-${node.key}-${node.left.key}`} x1={node.x} y1={node.y} x2={node.left.x} y2={node.left.y} stroke="#9ca3af" strokeWidth={2} />
    );
    edges.push(...renderEdges(node.left));
  }
  if (node.right) {
    edges.push(
      <line key={`e-${node.key}-${node.right.key}`} x1={node.x} y1={node.y} x2={node.right.x} y2={node.right.y} stroke="#9ca3af" strokeWidth={2} />
    );
    edges.push(...renderEdges(node.right));
  }
  return edges;
}

function renderNodes(node: PositionedNode | null): React.ReactNode[] {
  if (!node) return [];
  const nodes: React.ReactNode[] = [];
  nodes.push(
    <g key={`n-${node.key}`}>
      <circle cx={node.x} cy={node.y} r={20} fill={getNodeFill(node.color)} stroke={getNodeStroke(node.color)} strokeWidth={2} />
      <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize={14} fontFamily="monospace" fill="#1f2937">{node.key}</text>
      <text x={node.x + 22} y={node.y - 10} textAnchor="start" fontSize={10} fontFamily="monospace" fill="#6b7280">{node.bf >= 0 ? `+${node.bf}` : `${node.bf}`}</text>
    </g>
  );
  nodes.push(...renderNodes(node.left));
  nodes.push(...renderNodes(node.right));
  return nodes;
}

// --- Component ---

export default function AVLTreeAnimationPage() {
  const [input, setInput] = useState("5,3,7,2,4,6,8,1");
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
    let tree: AVLNode | null = null;

    allSteps.push({
      type: "init",
      tree: null,
      highlightPath: [],
      currentNode: null,
      rotateNode: null,
      description: "空のAVL木からスタート",
    });

    for (const val of values) {
      const { steps: insertSteps, newTree } = generateInsertSteps(tree, val);
      allSteps.push(...insertSteps);
      tree = newTree;
    }

    allSteps.push({
      type: "done",
      tree: cloneTree(tree),
      highlightPath: [],
      currentNode: null,
      rotateNode: null,
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
        if (currentStep < steps.length - 1) setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  const positioned = step.tree
    ? layoutTree(step.tree, 300, 40, 120, step.highlightPath, step.currentNode, step.rotateNode)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">AVL木</h1>
        <p className="text-sm text-muted-foreground mb-6">
          挿入操作と回転をステップごとに可視化
        </p>

        <div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") run(input); }}
            placeholder="カンマ区切りで値を入力"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-4 bg-white">
          <svg width="600" height={positioned ? 350 : 50} viewBox="0 0 600 350" className="w-full h-auto">
            {positioned && renderEdges(positioned)}
            {positioned && renderNodes(positioned)}
            {!positioned && (
              <text x="300" y="30" textAnchor="middle" fontSize={14} fill="#9ca3af">空の木</text>
            )}
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" />
            <span>現在のノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>回転対象</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>挿入完了</span>
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
