"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface SNode {
  key: number;
  left: SNode | null;
  right: SNode | null;
  parent: SNode | null;
}

interface PositionedNode {
  key: number;
  x: number;
  y: number;
  color: "default" | "current" | "rotateTarget" | "highlight";
  left: PositionedNode | null;
  right: PositionedNode | null;
}

type StepType = "init" | "insert_bst" | "splay_zig" | "splay_zigzig" | "splay_zigzag" | "splay_done" | "done";

interface Step {
  type: StepType;
  tree: SNode | null;
  currentNode: number | null;
  rotateNode: number | null;
  description: string;
}

// --- Splay tree utilities ---

function cloneTree(node: SNode | null, parent: SNode | null = null): SNode | null {
  if (!node) return null;
  const n: SNode = { key: node.key, left: null, right: null, parent };
  n.left = cloneTree(node.left, n);
  n.right = cloneTree(node.right, n);
  return n;
}

function snapshot(node: SNode | null): SNode | null {
  return cloneTree(node);
}

function rightRotate(root: SNode, y: SNode): SNode {
  const x = y.left!;
  y.left = x.right;
  if (x.right) x.right.parent = y;
  x.parent = y.parent;
  if (!y.parent) root = x;
  else if (y === y.parent.left) y.parent.left = x;
  else y.parent.right = x;
  x.right = y;
  y.parent = x;
  return root;
}

function leftRotate(root: SNode, x: SNode): SNode {
  const y = x.right!;
  x.right = y.left;
  if (y.left) y.left.parent = x;
  y.parent = x.parent;
  if (!x.parent) root = y;
  else if (x === x.parent.left) x.parent.left = y;
  else x.parent.right = y;
  y.left = x;
  x.parent = y;
  return root;
}

function findNode(root: SNode | null, key: number): SNode | null {
  if (!root) return null;
  if (key === root.key) return root;
  if (key < root.key) return findNode(root.left, key);
  return findNode(root.right, key);
}

function splayWithSteps(root: SNode, x: SNode, steps: Step[]): SNode {
  while (x.parent !== null) {
    const p = x.parent;
    const g = p.parent;
    if (!g) {
      // Zig
      steps.push({
        type: "splay_zig",
        tree: snapshot(root),
        currentNode: x.key,
        rotateNode: p.key,
        description: `Zig: ノード ${x.key} を根に回転`,
      });
      if (x === p.left) root = rightRotate(root, p);
      else root = leftRotate(root, p);
    } else if ((x === p.left && p === g.left) || (x === p.right && p === g.right)) {
      // Zig-Zig
      steps.push({
        type: "splay_zigzig",
        tree: snapshot(root),
        currentNode: x.key,
        rotateNode: g.key,
        description: `Zig-Zig: 祖父 ${g.key} → 親 ${p.key} の順に回転`,
      });
      if (x === p.left) {
        root = rightRotate(root, g);
        root = rightRotate(root, p);
      } else {
        root = leftRotate(root, g);
        root = leftRotate(root, p);
      }
    } else {
      // Zig-Zag
      steps.push({
        type: "splay_zigzag",
        tree: snapshot(root),
        currentNode: x.key,
        rotateNode: p.key,
        description: `Zig-Zag: 親 ${p.key} → 祖父 ${g!.key} の順に回転`,
      });
      if (x === p.right && p === g!.left) {
        root = leftRotate(root, p);
        root = rightRotate(root, g!);
      } else {
        root = rightRotate(root, p);
        root = leftRotate(root, g!);
      }
    }
  }
  steps.push({
    type: "splay_done",
    tree: snapshot(root),
    currentNode: x.key,
    rotateNode: null,
    description: `ノード ${x.key} が根に到達`,
  });
  return root;
}

function bstInsert(root: SNode | null, key: number): SNode {
  const newNode: SNode = { key, left: null, right: null, parent: null };
  if (!root) return newNode;
  let cur: SNode | null = root;
  let par: SNode = root;
  while (cur) {
    par = cur;
    if (key < cur.key) cur = cur.left;
    else if (key > cur.key) cur = cur.right;
    else return root;
  }
  newNode.parent = par;
  if (key < par.key) par.left = newNode;
  else par.right = newNode;
  return root;
}

// --- Layout ---

function layoutTree(node: SNode | null, x: number, y: number, spread: number, currentNode: number | null, rotateNode: number | null): PositionedNode | null {
  if (!node) return null;
  let color: PositionedNode["color"] = "default";
  if (node.key === currentNode) color = "current";
  else if (node.key === rotateNode) color = "rotateTarget";
  return {
    key: node.key, x, y, color,
    left: layoutTree(node.left, x - spread, y + 60, spread * 0.6, currentNode, rotateNode),
    right: layoutTree(node.right, x + spread, y + 60, spread * 0.6, currentNode, rotateNode),
  };
}

function getNodeFill(c: PositionedNode["color"]): string {
  switch (c) { case "current": return "#dbeafe"; case "rotateTarget": return "#fef3c7"; case "highlight": return "#d1fae5"; default: return "#ffffff"; }
}
function getNodeStroke(c: PositionedNode["color"]): string {
  switch (c) { case "current": return "#60a5fa"; case "rotateTarget": return "#f59e0b"; case "highlight": return "#10b981"; default: return "#d1d5db"; }
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

export default function SplayTreeAnimationPage() {
  const [input, setInput] = useState("5,3,7,1,4,6,8");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const values = s.split(",").map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v));
    if (values.length === 0) return;
    const allSteps: Step[] = [];
    let root: SNode | null = null;

    allSteps.push({ type: "init", tree: null, currentNode: null, rotateNode: null, description: "空のSplay木からスタート" });

    for (const val of values) {
      allSteps.push({ type: "insert_bst", tree: snapshot(root), currentNode: val, rotateNode: null, description: `値 ${val} をBST挿入` });
      root = bstInsert(root, val);
      allSteps.push({ type: "insert_bst", tree: snapshot(root), currentNode: val, rotateNode: null, description: `ノード ${val} を挿入完了。スプレー開始` });
      const node = findNode(root, val);
      if (node) root = splayWithSteps(root, node, allSteps);
    }

    allSteps.push({ type: "done", tree: snapshot(root), currentNode: null, rotateNode: null, description: "全ての値の挿入が完了" });
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
    <>
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
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>スプレー対象</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" /><span>回転対象</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((p) => !p)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
    </>
  );
}
