"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface TreapNode {
  key: number;
  priority: number;
  left: TreapNode | null;
  right: TreapNode | null;
}

interface PositionedNode {
  key: number;
  priority: number;
  x: number;
  y: number;
  color: "default" | "current" | "rotateTarget" | "inserted";
  left: PositionedNode | null;
  right: PositionedNode | null;
}

type StepType = "init" | "bst_insert" | "rotate_up" | "insert_done" | "done";

interface Step {
  type: StepType;
  tree: TreapNode | null;
  currentNode: number | null;
  rotateNode: number | null;
  description: string;
}

// --- Treap utilities ---

function cloneTree(node: TreapNode | null): TreapNode | null {
  if (!node) return null;
  return { key: node.key, priority: node.priority, left: cloneTree(node.left), right: cloneTree(node.right) };
}

function rightRotate(y: TreapNode): TreapNode {
  const x = y.left!;
  y.left = x.right;
  x.right = y;
  return x;
}

function leftRotate(x: TreapNode): TreapNode {
  const y = x.right!;
  x.right = y.left;
  y.left = x;
  return y;
}

// Seeded random for reproducibility
let seed = 42;
function seededRandom(): number {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed & 0xffff) / 0xffff;
}

function generateInsertSteps(root: TreapNode | null, key: number): { steps: Step[]; newTree: TreapNode | null } {
  const steps: Step[] = [];
  const priority = Math.floor(seededRandom() * 100);

  steps.push({
    type: "bst_insert",
    tree: cloneTree(root),
    currentNode: key,
    rotateNode: null,
    description: `値 ${key} (優先度 ${priority}) をBST挿入`,
  });

  function insertRec(node: TreapNode | null): TreapNode {
    if (!node) {
      return { key, priority, left: null, right: null };
    }
    if (key < node.key) {
      node.left = insertRec(node.left);
      if (node.left.priority < node.priority) {
        steps.push({
          type: "rotate_up",
          tree: cloneTree(root),
          currentNode: node.left.key,
          rotateNode: node.key,
          description: `ヒープ性質違反: ${node.left.key} (pri=${node.left.priority}) < ${node.key} (pri=${node.priority})。右回転`,
        });
        node = rightRotate(node);
      }
    } else if (key > node.key) {
      node.right = insertRec(node.right);
      if (node.right.priority < node.priority) {
        steps.push({
          type: "rotate_up",
          tree: cloneTree(root),
          currentNode: node.right.key,
          rotateNode: node.key,
          description: `ヒープ性質違反: ${node.right.key} (pri=${node.right.priority}) < ${node.key} (pri=${node.priority})。左回転`,
        });
        node = leftRotate(node);
      }
    }
    return node;
  }

  const newTree = insertRec(cloneTree(root));

  steps.push({
    type: "insert_done",
    tree: cloneTree(newTree),
    currentNode: key,
    rotateNode: null,
    description: `値 ${key} (優先度 ${priority}) の挿入完了`,
  });

  return { steps, newTree };
}

// --- Layout ---

function layoutTree(node: TreapNode | null, x: number, y: number, spread: number, currentNode: number | null, rotateNode: number | null): PositionedNode | null {
  if (!node) return null;
  let color: PositionedNode["color"] = "default";
  if (node.key === currentNode) color = "current";
  else if (node.key === rotateNode) color = "rotateTarget";
  return {
    key: node.key, priority: node.priority, x, y, color,
    left: layoutTree(node.left, x - spread, y + 60, spread * 0.6, currentNode, rotateNode),
    right: layoutTree(node.right, x + spread, y + 60, spread * 0.6, currentNode, rotateNode),
  };
}

function getNodeFill(c: PositionedNode["color"]): string {
  switch (c) { case "current": return "#dbeafe"; case "rotateTarget": return "#fef3c7"; case "inserted": return "#d1fae5"; default: return "#ffffff"; }
}
function getNodeStroke(c: PositionedNode["color"]): string {
  switch (c) { case "current": return "#60a5fa"; case "rotateTarget": return "#f59e0b"; case "inserted": return "#10b981"; default: return "#d1d5db"; }
}

function renderEdges(node: PositionedNode | null): React.ReactNode[] {
  if (!node) return [];
  const e: React.ReactNode[] = [];
  if (node.left) { e.push(<line key={`e-${node.key}-l`} x1={node.x} y1={node.y} x2={node.left.x} y2={node.left.y} stroke="#9ca3af" strokeWidth={2} />); e.push(...renderEdges(node.left)); }
  if (node.right) { e.push(<line key={`e-${node.key}-r`} x1={node.x} y1={node.y} x2={node.right.x} y2={node.right.y} stroke="#9ca3af" strokeWidth={2} />); e.push(...renderEdges(node.right)); }
  return e;
}

function renderNodes(node: PositionedNode | null): React.ReactNode[] {
  if (!node) return [];
  const n: React.ReactNode[] = [];
  n.push(
    <g key={`n-${node.key}`}>
      <circle cx={node.x} cy={node.y} r={22} fill={getNodeFill(node.color)} stroke={getNodeStroke(node.color)} strokeWidth={2} />
      <text x={node.x} y={node.y + 1} textAnchor="middle" fontSize={13} fontFamily="monospace" fill="#1f2937">{node.key}</text>
      <text x={node.x} y={node.y + 14} textAnchor="middle" fontSize={9} fontFamily="monospace" fill="#6b7280">p={node.priority}</text>
    </g>
  );
  n.push(...renderNodes(node.left));
  n.push(...renderNodes(node.right));
  return n;
}

// --- Component ---

export default function TreapAnimationPage() {
  const [input, setInput] = useState("5,3,7,1,4,6,8");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const values = s.split(",").map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v));
    if (values.length === 0) return;
    seed = 42;
    const allSteps: Step[] = [];
    let tree: TreapNode | null = null;
    allSteps.push({ type: "init", tree: null, currentNode: null, rotateNode: null, description: "空のTreapからスタート" });

    for (const val of values) {
      const { steps: insertSteps, newTree } = generateInsertSteps(tree, val);
      allSteps.push(...insertSteps);
      tree = newTree;
    }

    allSteps.push({ type: "done", tree: cloneTree(tree), currentNode: null, rotateNode: null, description: "全ての値の挿入が完了" });
    setSteps(allSteps);
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(input); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 700);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;
  const positioned = step.tree ? layoutTree(step.tree, 300, 40, 120, step.currentNode, step.rotateNode) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Treap</h1>
        <p className="text-sm text-muted-foreground mb-6">挿入操作とヒープ修復をステップごとに可視化</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="カンマ区切りで値を入力" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-4 bg-white">
          <svg width="600" height={positioned ? 380 : 50} viewBox="0 0 600 380" className="w-full h-auto">
            {positioned && renderEdges(positioned)}
            {positioned && renderNodes(positioned)}
            {!positioned && <text x="300" y="30" textAnchor="middle" fontSize={14} fill="#9ca3af">空の木</text>}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3"><span>Step {currentStep + 1} / {steps.length}</span></div>
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center"><p className="text-sm font-mono">{step.description}</p></div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>挿入ノード</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" /><span>回転対象</span></div>
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
