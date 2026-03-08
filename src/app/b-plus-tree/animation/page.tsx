"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface BPNode {
  keys: number[];
  children: BPNode[];
  leaf: boolean;
  next: BPNode | null;
}

interface PositionedBPNode {
  keys: number[];
  x: number;
  y: number;
  width: number;
  leaf: boolean;
  highlight: "default" | "current" | "split";
  children: PositionedBPNode[];
}

type StepType = "init" | "search_node" | "split_leaf" | "split_internal" | "insert_key" | "done";

interface Step {
  type: StepType;
  tree: BPNode | null;
  currentKeys: number[];
  description: string;
}

// --- B+ tree (order=4, max 3 keys per node) ---

const ORDER = 4;
const MAX_KEYS = ORDER - 1;

function cloneTree(node: BPNode | null): BPNode | null {
  if (!node) return null;
  const cloned: BPNode = {
    keys: [...node.keys],
    children: node.children.map((c) => cloneTree(c)!),
    leaf: node.leaf,
    next: null,
  };
  return cloned;
}

function insertIntoBPTree(root: BPNode | null, key: number, steps: Step[]): BPNode {
  if (!root) {
    const newRoot: BPNode = { keys: [key], children: [], leaf: true, next: null };
    steps.push({ type: "insert_key", tree: cloneTree(newRoot), currentKeys: [key], description: `空の木にキー ${key} を挿入` });
    return newRoot;
  }

  // Find leaf
  let node = root;
  const path: { node: BPNode; childIndex: number }[] = [];

  while (!node.leaf) {
    let i = 0;
    while (i < node.keys.length && key >= node.keys[i]) i++;
    steps.push({ type: "search_node", tree: cloneTree(root), currentKeys: [...node.keys], description: `内部ノード [${node.keys.join(", ")}] で子 ${i} へ進む` });
    path.push({ node, childIndex: i });
    node = node.children[i];
  }

  // Insert into leaf
  let i = 0;
  while (i < node.keys.length && key > node.keys[i]) i++;
  if (i < node.keys.length && node.keys[i] === key) {
    steps.push({ type: "insert_key", tree: cloneTree(root), currentKeys: [...node.keys], description: `キー ${key} は既に存在` });
    return root;
  }
  node.keys.splice(i, 0, key);

  steps.push({ type: "insert_key", tree: cloneTree(root), currentKeys: [...node.keys], description: `キー ${key} を葉 [${node.keys.join(", ")}] に挿入` });

  // Split if necessary
  if (node.keys.length > MAX_KEYS) {
    const mid = Math.ceil(node.keys.length / 2);
    const newLeaf: BPNode = {
      keys: node.keys.splice(mid),
      children: [],
      leaf: true,
      next: node.next,
    };
    node.next = newLeaf;
    const pushUpKey = newLeaf.keys[0];

    steps.push({ type: "split_leaf", tree: cloneTree(root), currentKeys: [pushUpKey], description: `葉が満杯。分割してキー ${pushUpKey} を親に送る` });

    // Push up
    let currentPushKey = pushUpKey;
    let rightChild: BPNode = newLeaf;

    while (path.length > 0) {
      const { node: parent, childIndex } = path.pop()!;
      parent.keys.splice(childIndex, 0, currentPushKey);
      parent.children.splice(childIndex + 1, 0, rightChild);

      if (parent.keys.length <= MAX_KEYS) {
        return root;
      }

      // Split internal
      const midI = Math.floor(parent.keys.length / 2);
      currentPushKey = parent.keys[midI];
      const newInternal: BPNode = {
        keys: parent.keys.splice(midI + 1),
        children: parent.children.splice(midI + 1),
        leaf: false,
        next: null,
      };
      parent.keys.splice(midI);
      rightChild = newInternal;

      steps.push({ type: "split_internal", tree: cloneTree(root), currentKeys: [currentPushKey], description: `内部ノード分割。キー ${currentPushKey} を親に送る` });
    }

    // New root needed
    const newRoot: BPNode = {
      keys: [currentPushKey],
      children: [root, rightChild],
      leaf: false,
      next: null,
    };
    steps.push({ type: "split_internal", tree: cloneTree(newRoot), currentKeys: [currentPushKey], description: `新しい根 [${currentPushKey}] を作成` });
    return newRoot;
  }

  return root;
}

// --- Layout ---

function getNodeWidth(keys: number[]): number {
  return Math.max(keys.length * 40 + 20, 60);
}

function getSubtreeWidth(node: BPNode): number {
  if (node.children.length === 0) return getNodeWidth(node.keys);
  const cw = node.children.map((c) => getSubtreeWidth(c));
  return Math.max(getNodeWidth(node.keys), cw.reduce((a, b) => a + b + 20, -20));
}

function layoutBPTree(node: BPNode | null, x: number, y: number, currentKeys: number[]): PositionedBPNode | null {
  if (!node) return null;
  const width = getNodeWidth(node.keys);
  let highlight: PositionedBPNode["highlight"] = "default";
  if (node.keys.some((k) => currentKeys.includes(k))) highlight = "current";

  const childWidths = node.children.map((c) => getSubtreeWidth(c));
  const totalCW = childWidths.reduce((a, b) => a + b + 20, -20);
  let cx = x - totalCW / 2;
  const children: PositionedBPNode[] = [];
  for (let i = 0; i < node.children.length; i++) {
    const cw = childWidths[i];
    const child = layoutBPTree(node.children[i], cx + cw / 2, y + 80, currentKeys);
    if (child) children.push(child);
    cx += cw + 20;
  }

  return { keys: node.keys, x, y, width, leaf: node.leaf, highlight, children };
}

function renderBPEdges(node: PositionedBPNode): React.ReactNode[] {
  const edges: React.ReactNode[] = [];
  for (const child of node.children) {
    edges.push(<line key={`e-${node.keys.join("")}-${child.keys.join("")}-${child.x}`} x1={node.x} y1={node.y + 15} x2={child.x} y2={child.y - 15} stroke="#9ca3af" strokeWidth={2} />);
    edges.push(...renderBPEdges(child));
  }
  return edges;
}

function renderBPNodes(node: PositionedBPNode): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const w = node.width;
  const h = 30;
  const fill = node.highlight === "current" ? "#dbeafe" : node.leaf ? "#f0fdf4" : "#ffffff";
  const stroke = node.highlight === "current" ? "#60a5fa" : node.leaf ? "#86efac" : "#d1d5db";

  nodes.push(
    <g key={`bn-${node.keys.join("-")}-${node.x}`}>
      <rect x={node.x - w / 2} y={node.y - h / 2} width={w} height={h} rx={4} fill={fill} stroke={stroke} strokeWidth={2} />
      <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize={13} fontFamily="monospace" fill="#1f2937">{node.keys.join(" | ")}</text>
    </g>
  );
  for (const child of node.children) nodes.push(...renderBPNodes(child));
  return nodes;
}

// --- Component ---

export default function BPlusTreeAnimationPage() {
  const [input, setInput] = useState("10,20,5,6,12,30,7,17");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const values = s.split(",").map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v));
    if (values.length === 0) return;
    const allSteps: Step[] = [];
    let tree: BPNode | null = null;
    allSteps.push({ type: "init", tree: null, currentKeys: [], description: "空のB+木 (order=4) からスタート" });

    for (const val of values) {
      allSteps.push({ type: "search_node", tree: cloneTree(tree), currentKeys: [], description: `キー ${val} を挿入開始` });
      tree = insertIntoBPTree(tree, val, allSteps);
    }

    allSteps.push({ type: "done", tree: cloneTree(tree), currentKeys: [], description: "全てのキーの挿入が完了" });
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
  const positioned = step.tree ? layoutBPTree(step.tree, 300, 40, step.currentKeys) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">B+木</h1>
        <p className="text-sm text-muted-foreground mb-6">挿入操作と分割をステップごとに可視化 (order=4)</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="カンマ区切りで値を入力" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-4 bg-white overflow-x-auto">
          <svg width="600" height={positioned ? 300 : 50} viewBox="0 0 600 300" className="w-full h-auto">
            {positioned && renderBPEdges(positioned)}
            {positioned && renderBPNodes(positioned)}
            {!positioned && <text x="300" y="30" textAnchor="middle" fontSize={14} fill="#9ca3af">空の木</text>}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3"><span>Step {currentStep + 1} / {steps.length}</span></div>
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center"><p className="text-sm font-mono">{step.description}</p></div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded" /><span>処理中</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-green-50 border-2 border-green-300 rounded" /><span>葉ノード</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-white border-2 border-gray-200 rounded" /><span>内部ノード</span></div>
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
