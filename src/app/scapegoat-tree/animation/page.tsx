"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface SGNode {
  key: number;
  left: SGNode | null;
  right: SGNode | null;
}

interface PositionedNode {
  key: number;
  x: number;
  y: number;
  color: "default" | "current" | "scapegoat" | "rebuilt" | "highlight";
  left: PositionedNode | null;
  right: PositionedNode | null;
}

type StepType = "init" | "bst_insert" | "check_depth" | "find_scapegoat" | "rebuild" | "insert_done" | "done";

interface Step {
  type: StepType;
  tree: SGNode | null;
  currentNode: number | null;
  scapegoatNode: number | null;
  description: string;
}

// --- Scapegoat tree utilities ---

const ALPHA = 2 / 3;

function cloneTree(node: SGNode | null): SGNode | null {
  if (!node) return null;
  return { key: node.key, left: cloneTree(node.left), right: cloneTree(node.right) };
}

function treeSize(node: SGNode | null): number {
  if (!node) return 0;
  return 1 + treeSize(node.left) + treeSize(node.right);
}

function flatten(node: SGNode | null, arr: SGNode[]): void {
  if (!node) return;
  flatten(node.left, arr);
  arr.push(node);
  flatten(node.right, arr);
}

function buildBalanced(nodes: SGNode[], lo: number, hi: number): SGNode | null {
  if (lo > hi) return null;
  const mid = Math.floor((lo + hi) / 2);
  const node = nodes[mid];
  node.left = buildBalanced(nodes, lo, mid - 1);
  node.right = buildBalanced(nodes, mid + 1, hi);
  return node;
}

function rebuild(node: SGNode): SGNode {
  const arr: SGNode[] = [];
  flatten(node, arr);
  return buildBalanced(arr, 0, arr.length - 1)!;
}

function insertBST(node: SGNode | null, key: number, depth: number, path: SGNode[]): { root: SGNode; depth: number } {
  if (!node) {
    const newNode: SGNode = { key, left: null, right: null };
    return { root: newNode, depth };
  }
  path.push(node);
  if (key < node.key) {
    const { root: left, depth: d } = insertBST(node.left, key, depth + 1, path);
    node.left = left;
    return { root: node, depth: d };
  } else if (key > node.key) {
    const { root: right, depth: d } = insertBST(node.right, key, depth + 1, path);
    node.right = right;
    return { root: node, depth: d };
  }
  return { root: node, depth };
}

function findAndRebuildScapegoat(root: SGNode, path: SGNode[], key: number): { newRoot: SGNode; scapegoatKey: number | null } {
  // Walk up path to find scapegoat
  let childSize = 1;
  for (let i = path.length - 1; i >= 0; i--) {
    const node = path[i];
    const nodeSize = treeSize(node);
    if (childSize > ALPHA * nodeSize) {
      // Found scapegoat
      const rebuilt = rebuild(node);
      if (i === 0) {
        return { newRoot: rebuilt, scapegoatKey: node.key };
      }
      const parent = path[i - 1];
      if (parent.left === node) parent.left = rebuilt;
      else parent.right = rebuilt;
      return { newRoot: root, scapegoatKey: node.key };
    }
    childSize = nodeSize;
  }
  return { newRoot: root, scapegoatKey: null };
}

function generateInsertSteps(root: SGNode | null, key: number): { steps: Step[]; newTree: SGNode | null } {
  const steps: Step[] = [];
  const n = treeSize(root);

  steps.push({
    type: "bst_insert",
    tree: cloneTree(root),
    currentNode: key,
    scapegoatNode: null,
    description: `値 ${key} をBST挿入`,
  });

  const path: SGNode[] = [];
  const cloned = cloneTree(root);
  const { root: newRoot, depth } = insertBST(cloned, key, 0, path);
  const maxDepth = Math.floor(Math.log(n + 1) / Math.log(1 / ALPHA));

  steps.push({
    type: "check_depth",
    tree: cloneTree(newRoot),
    currentNode: key,
    scapegoatNode: null,
    description: `挿入深さ = ${depth}, 閾値 = ${maxDepth}${depth > maxDepth ? " → 再構築が必要" : " → OK"}`,
  });

  let finalTree = newRoot;

  if (depth > maxDepth) {
    const pathCloned: SGNode[] = [];
    const recloned = cloneTree(root);
    insertBST(recloned, key, 0, pathCloned);

    // Find scapegoat on actual tree
    const { newRoot: rebuiltRoot, scapegoatKey } = findAndRebuildScapegoat(newRoot, path, key);

    if (scapegoatKey !== null) {
      steps.push({
        type: "find_scapegoat",
        tree: cloneTree(newRoot),
        currentNode: key,
        scapegoatNode: scapegoatKey,
        description: `スケープゴート発見: ノード ${scapegoatKey}`,
      });
    }

    finalTree = rebuiltRoot;

    steps.push({
      type: "rebuild",
      tree: cloneTree(finalTree),
      currentNode: null,
      scapegoatNode: scapegoatKey,
      description: `ノード ${scapegoatKey} の部分木を再構築完了`,
    });
  }

  steps.push({
    type: "insert_done",
    tree: cloneTree(finalTree),
    currentNode: key,
    scapegoatNode: null,
    description: `値 ${key} の挿入完了`,
  });

  return { steps, newTree: finalTree };
}

// --- Layout ---

function layoutTree(node: SGNode | null, x: number, y: number, spread: number, currentNode: number | null, scapegoatNode: number | null): PositionedNode | null {
  if (!node) return null;
  let color: PositionedNode["color"] = "default";
  if (node.key === scapegoatNode) color = "scapegoat";
  else if (node.key === currentNode) color = "current";
  return {
    key: node.key, x, y, color,
    left: layoutTree(node.left, x - spread, y + 60, spread * 0.6, currentNode, scapegoatNode),
    right: layoutTree(node.right, x + spread, y + 60, spread * 0.6, currentNode, scapegoatNode),
  };
}

function getNodeFill(c: PositionedNode["color"]): string {
  switch (c) { case "current": return "#dbeafe"; case "scapegoat": return "#fee2e2"; case "rebuilt": return "#d1fae5"; default: return "#ffffff"; }
}
function getNodeStroke(c: PositionedNode["color"]): string {
  switch (c) { case "current": return "#60a5fa"; case "scapegoat": return "#ef4444"; case "rebuilt": return "#10b981"; default: return "#d1d5db"; }
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
      <circle cx={node.x} cy={node.y} r={20} fill={getNodeFill(node.color)} stroke={getNodeStroke(node.color)} strokeWidth={2} />
      <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize={14} fontFamily="monospace" fill="#1f2937">{node.key}</text>
    </g>
  );
  n.push(...renderNodes(node.left));
  n.push(...renderNodes(node.right));
  return n;
}

// --- Component ---

export default function ScapegoatTreeAnimationPage() {
  const [input, setInput] = useState("5,3,7,2,4,1,0");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const values = s.split(",").map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v));
    if (values.length === 0) return;
    const allSteps: Step[] = [];
    let tree: SGNode | null = null;
    allSteps.push({ type: "init", tree: null, currentNode: null, scapegoatNode: null, description: "空のScapegoat木からスタート" });

    for (const val of values) {
      const { steps: insertSteps, newTree } = generateInsertSteps(tree, val);
      allSteps.push(...insertSteps);
      tree = newTree;
    }

    allSteps.push({ type: "done", tree: cloneTree(tree), currentNode: null, scapegoatNode: null, description: "全ての値の挿入が完了" });
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
  const positioned = step.tree ? layoutTree(step.tree, 300, 40, 120, step.currentNode, step.scapegoatNode) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Scapegoat木</h1>
        <p className="text-sm text-muted-foreground mb-6">挿入と再構築をステップごとに可視化</p>

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

        <div className="flex gap-6 text-sm text-muted-foreground mb-3"><span>Step {currentStep + 1} / {steps.length}</span></div>
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center"><p className="text-sm font-mono">{step.description}</p></div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>挿入ノード</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500 rounded-full" /><span>スケープゴート</span></div>
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
