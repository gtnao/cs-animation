"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface BNode {
  keys: number[];
  children: BNode[];
  leaf: boolean;
}

interface PositionedBNode {
  keys: number[];
  x: number;
  y: number;
  width: number;
  highlight: "default" | "current" | "split" | "inserted";
  children: PositionedBNode[];
}

type StepType = "init" | "search_node" | "split" | "insert_key" | "done";

interface Step {
  type: StepType;
  tree: BNode | null;
  currentKeys: number[];
  description: string;
}

// --- B-tree utilities (t=2, aka 2-3-4 tree) ---

const T = 2;

function cloneTree(node: BNode | null): BNode | null {
  if (!node) return null;
  return {
    keys: [...node.keys],
    children: node.children.map((c) => cloneTree(c)!),
    leaf: node.leaf,
  };
}

function splitChild(parent: BNode, i: number): void {
  const fullChild = parent.children[i];
  const midIndex = T - 1;
  const midKey = fullChild.keys[midIndex];

  const newChild: BNode = {
    keys: fullChild.keys.splice(midIndex + 1),
    children: fullChild.leaf ? [] : fullChild.children.splice(midIndex + 1),
    leaf: fullChild.leaf,
  };
  fullChild.keys.splice(midIndex);

  parent.keys.splice(i, 0, midKey);
  parent.children.splice(i + 1, 0, newChild);
}

function insertNonFull(node: BNode, key: number, steps: Step[], rootRef: { root: BNode }): void {
  if (node.leaf) {
    let i = node.keys.length - 1;
    while (i >= 0 && key < node.keys[i]) i--;
    node.keys.splice(i + 1, 0, key);
    steps.push({
      type: "insert_key",
      tree: cloneTree(rootRef.root),
      currentKeys: [...node.keys],
      description: `キー ${key} を葉ノード [${node.keys.join(", ")}] に挿入`,
    });
  } else {
    let i = node.keys.length - 1;
    while (i >= 0 && key < node.keys[i]) i--;
    i++;

    steps.push({
      type: "search_node",
      tree: cloneTree(rootRef.root),
      currentKeys: [...node.keys],
      description: `ノード [${node.keys.join(", ")}] で子 ${i} に進む`,
    });

    if (node.children[i].keys.length === 2 * T - 1) {
      splitChild(node, i);
      steps.push({
        type: "split",
        tree: cloneTree(rootRef.root),
        currentKeys: [...node.keys],
        description: `子ノードが満杯のため分割。中央キー ${node.keys[i]} を親に移動`,
      });
      if (key > node.keys[i]) i++;
    }
    insertNonFull(node.children[i], key, steps, rootRef);
  }
}

function insertKey(root: BNode | null, key: number, steps: Step[]): BNode {
  if (!root) {
    const newRoot: BNode = { keys: [key], children: [], leaf: true };
    steps.push({
      type: "insert_key",
      tree: cloneTree(newRoot),
      currentKeys: [key],
      description: `空の木にキー ${key} を挿入`,
    });
    return newRoot;
  }

  const rootRef = { root };

  if (root.keys.length === 2 * T - 1) {
    const newRoot: BNode = { keys: [], children: [root], leaf: false };
    splitChild(newRoot, 0);
    rootRef.root = newRoot;
    steps.push({
      type: "split",
      tree: cloneTree(newRoot),
      currentKeys: [...newRoot.keys],
      description: `根が満杯のため分割。新しい根: [${newRoot.keys.join(", ")}]`,
    });
    insertNonFull(newRoot, key, steps, rootRef);
    return newRoot;
  }

  insertNonFull(root, key, steps, rootRef);
  return rootRef.root;
}

// --- Layout ---

function getNodeWidth(node: BNode): number {
  return Math.max(node.keys.length * 40 + 20, 60);
}

function layoutBTree(
  node: BNode | null,
  x: number,
  y: number,
  currentKeys: number[]
): PositionedBNode | null {
  if (!node) return null;

  const width = getNodeWidth(node);
  let highlight: PositionedBNode["highlight"] = "default";
  if (node.keys.some((k) => currentKeys.includes(k))) highlight = "current";

  const childWidths = node.children.map((c) => getSubtreeWidth(c));
  const totalChildWidth = childWidths.reduce((a, b) => a + b + 20, -20);
  const startX = x - totalChildWidth / 2;

  let cx = startX;
  const children: PositionedBNode[] = [];
  for (let i = 0; i < node.children.length; i++) {
    const cw = childWidths[i];
    const child = layoutBTree(node.children[i], cx + cw / 2, y + 80, currentKeys);
    if (child) children.push(child);
    cx += cw + 20;
  }

  return { keys: node.keys, x, y, width, highlight, children };
}

function getSubtreeWidth(node: BNode): number {
  if (node.children.length === 0) return getNodeWidth(node);
  const childWidths = node.children.map((c) => getSubtreeWidth(c));
  return Math.max(getNodeWidth(node), childWidths.reduce((a, b) => a + b + 20, -20));
}

function renderBEdges(node: PositionedBNode): React.ReactNode[] {
  const edges: React.ReactNode[] = [];
  for (const child of node.children) {
    edges.push(
      <line
        key={`e-${node.keys.join("")}-${child.keys.join("")}`}
        x1={node.x}
        y1={node.y + 15}
        x2={child.x}
        y2={child.y - 15}
        stroke="#9ca3af"
        strokeWidth={2}
      />
    );
    edges.push(...renderBEdges(child));
  }
  return edges;
}

function renderBNodes(node: PositionedBNode): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const w = node.width;
  const h = 30;
  const fill = node.highlight === "current" ? "#dbeafe" : "#ffffff";
  const stroke = node.highlight === "current" ? "#60a5fa" : "#d1d5db";

  nodes.push(
    <g key={`bn-${node.keys.join("-")}-${node.x}`}>
      <rect x={node.x - w / 2} y={node.y - h / 2} width={w} height={h} rx={4} fill={fill} stroke={stroke} strokeWidth={2} />
      <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize={13} fontFamily="monospace" fill="#1f2937">
        {node.keys.join(" | ")}
      </text>
    </g>
  );

  for (const child of node.children) {
    nodes.push(...renderBNodes(child));
  }
  return nodes;
}

// --- Component ---

export default function BTreeAnimationPage() {
  const [input, setInput] = useState("10,20,5,6,12,30,7,17");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const values = s.split(",").map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v));
    if (values.length === 0) return;
    const allSteps: Step[] = [];
    let tree: BNode | null = null;
    allSteps.push({ type: "init", tree: null, currentKeys: [], description: "空のB木 (t=2) からスタート" });

    for (const val of values) {
      allSteps.push({ type: "search_node", tree: cloneTree(tree), currentKeys: [], description: `キー ${val} を挿入開始` });
      tree = insertKey(tree, val, allSteps);
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
  const positioned = step.tree ? layoutBTree(step.tree, 300, 40, step.currentKeys) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">B木</h1>
        <p className="text-sm text-muted-foreground mb-6">挿入操作と分割をステップごとに可視化 (t=2)</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="カンマ区切りで値を入力" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-4 bg-white overflow-x-auto">
          <svg width="600" height={positioned ? 300 : 50} viewBox="0 0 600 300" className="w-full h-auto">
            {positioned && renderBEdges(positioned)}
            {positioned && renderBNodes(positioned)}
            {!positioned && <text x="300" y="30" textAnchor="middle" fontSize={14} fill="#9ca3af">空の木</text>}
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3"><span>Step {currentStep + 1} / {steps.length}</span></div>
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center"><p className="text-sm font-mono">{step.description}</p></div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded" /><span>処理中のノード</span></div>
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
