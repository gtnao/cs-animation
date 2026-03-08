"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface TreeNode {
  id: number;
  label: string;
  children: TreeNode[];
  suffixIndex: number;
}

type StepType = "init" | "add_suffix" | "split" | "done";

interface Step {
  type: StepType;
  tree: TreeNode;
  currentSuffix: number;
  highlightNodeIds: number[];
  description: string;
}

// --- Naive suffix tree construction for visualization ---

let nodeCounter = 0;

function createNode(label: string, suffixIndex: number = -1): TreeNode {
  return { id: nodeCounter++, label, children: [], suffixIndex };
}

function insertSuffix(root: TreeNode, s: string, suffixStart: number, steps: Step[]): void {
  let node = root;
  let remaining = s.slice(suffixStart);

  while (remaining.length > 0) {
    let found = false;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const label = child.label;
      let matchLen = 0;
      while (matchLen < label.length && matchLen < remaining.length && label[matchLen] === remaining[matchLen]) {
        matchLen++;
      }

      if (matchLen === 0) continue;

      if (matchLen === label.length) {
        // Full match on this edge, continue deeper
        remaining = remaining.slice(matchLen);
        node = child;
        found = true;
        break;
      } else {
        // Partial match - split the edge
        const splitNode = createNode(label.slice(0, matchLen));
        child.label = label.slice(matchLen);
        splitNode.children.push(child);

        const newLeaf = createNode(remaining.slice(matchLen), suffixStart);
        splitNode.children.push(newLeaf);

        node.children[i] = splitNode;

        steps.push({
          type: "split",
          tree: JSON.parse(JSON.stringify(root)),
          currentSuffix: suffixStart,
          highlightNodeIds: [splitNode.id, newLeaf.id],
          description: `接尾辞 "${s.slice(suffixStart)}" の挿入: エッジ "${label}" を位置 ${matchLen} で分割`,
        });

        return;
      }
    }

    if (!found) {
      const newLeaf = createNode(remaining, suffixStart);
      node.children.push(newLeaf);

      steps.push({
        type: "add_suffix",
        tree: JSON.parse(JSON.stringify(root)),
        currentSuffix: suffixStart,
        highlightNodeIds: [newLeaf.id],
        description: `接尾辞 "${s.slice(suffixStart)}" を新しい葉として追加`,
      });

      return;
    }
  }
}

function generateSteps(s: string): Step[] {
  const n = s.length;
  if (n === 0) return [];
  const steps: Step[] = [];
  nodeCounter = 0;

  const root = createNode("root");

  steps.push({
    type: "init",
    tree: JSON.parse(JSON.stringify(root)),
    currentSuffix: -1,
    highlightNodeIds: [],
    description: `Suffix Tree を構築: "${s}"`,
  });

  for (let i = 0; i < n; i++) {
    insertSuffix(root, s, i, steps);
  }

  steps.push({
    type: "done",
    tree: JSON.parse(JSON.stringify(root)),
    currentSuffix: n,
    highlightNodeIds: [],
    description: `Suffix Tree 構築完了。${n} 個の接尾辞を格納`,
  });

  return steps;
}

// --- Render tree ---

function RenderTree({ node, depth, highlightIds }: { node: TreeNode; depth: number; highlightIds: number[] }) {
  const isHighlighted = highlightIds.includes(node.id);
  const isRoot = node.label === "root";

  return (
    <div className="ml-4">
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-mono border ${
        isHighlighted
          ? "bg-emerald-100 border-emerald-500"
          : isRoot
            ? "bg-blue-100 border-blue-400"
            : "bg-white border-gray-200"
      }`}>
        {isRoot ? "root" : `"${node.label}"`}
        {node.suffixIndex >= 0 && (
          <span className="text-[10px] text-muted-foreground ml-1">[{node.suffixIndex}]</span>
        )}
      </div>
      {node.children.length > 0 && (
        <div className="ml-2 border-l border-gray-200 pl-2 mt-1 space-y-1">
          {node.children.map((child) => (
            <RenderTree key={child.id} node={child} depth={depth + 1} highlightIds={highlightIds} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Component ---

export default function SuffixTreeAnimationPage() {
  const [input, setInput] = useState("banana$");
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
    }, 800);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((prev) => !prev); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <>
<div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="文字列を入力 (末尾に$推奨)" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 p-4 bg-muted/30 border border-border rounded overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">Suffix Tree</div>
          <RenderTree node={step.tree} depth={0} highlightIds={step.highlightNodeIds} />
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>ルート</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>新規ノード</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
    </>
  );
}
