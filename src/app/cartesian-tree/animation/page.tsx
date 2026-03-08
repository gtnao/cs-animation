"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "push" | "pop" | "set_child" | "done";

interface TreeNode {
  value: number;
  index: number;
  left: number;
  right: number;
  parent: number;
}

interface Step {
  type: StepType;
  arr: number[];
  stack: number[];
  nodes: TreeNode[];
  root: number;
  currentIndex: number;
  poppedIndex: number;
  description: string;
}

function generateSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const n = arr.length;
  if (n === 0) return [];

  const nodes: TreeNode[] = arr.map((v, i) => ({
    value: v,
    index: i,
    left: -1,
    right: -1,
    parent: -1,
  }));
  const stack: number[] = [];
  let root = -1;

  steps.push({
    type: "init",
    arr: [...arr],
    stack: [],
    nodes: nodes.map((n) => ({ ...n })),
    root: -1,
    currentIndex: -1,
    poppedIndex: -1,
    description: `配列: [${arr.join(", ")}]。Cartesian Treeを構築 (最小ヒープ)`,
  });

  for (let i = 0; i < n; i++) {
    let lastPopped = -1;

    while (stack.length > 0 && arr[stack[stack.length - 1]] > arr[i]) {
      lastPopped = stack.pop()!;
      steps.push({
        type: "pop",
        arr: [...arr],
        stack: [...stack],
        nodes: nodes.map((n) => ({ ...n })),
        root,
        currentIndex: i,
        poppedIndex: lastPopped,
        description: `A[${lastPopped}]=${arr[lastPopped]} > A[${i}]=${arr[i]}。スタックからpop`,
      });
    }

    if (lastPopped >= 0) {
      nodes[i].left = lastPopped;
      nodes[lastPopped].parent = i;
      steps.push({
        type: "set_child",
        arr: [...arr],
        stack: [...stack],
        nodes: nodes.map((n) => ({ ...n })),
        root,
        currentIndex: i,
        poppedIndex: lastPopped,
        description: `ノード${i}の左の子 = ノード${lastPopped}`,
      });
    }

    if (stack.length > 0) {
      const top = stack[stack.length - 1];
      nodes[top].right = i;
      nodes[i].parent = top;
    }

    stack.push(i);
    root = stack[0];

    steps.push({
      type: "push",
      arr: [...arr],
      stack: [...stack],
      nodes: nodes.map((n) => ({ ...n })),
      root,
      currentIndex: i,
      poppedIndex: -1,
      description: `ノード${i} (値${arr[i]}) をスタックにpush。根=${root}`,
    });
  }

  steps.push({
    type: "done",
    arr: [...arr],
    stack: [...stack],
    nodes: nodes.map((n) => ({ ...n })),
    root,
    currentIndex: -1,
    poppedIndex: -1,
    description: `Cartesian Tree構築完了。根=ノード${root} (値${arr[root]})`,
  });

  return steps;
}

function getCellClass(idx: number, step: Step): string {
  const base = "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
  if (idx === step.currentIndex) return `${base} bg-blue-100 border-blue-400`;
  if (idx === step.poppedIndex) return `${base} bg-red-100 border-red-500`;
  if (step.stack.includes(idx)) return `${base} bg-amber-50 border-amber-400`;
  if (step.type === "done" && idx === step.root) return `${base} bg-emerald-100 border-emerald-500`;
  return `${base} bg-white border-gray-200`;
}

export default function CartesianTreeAnimationPage() {
  const [input, setInput] = useState("3 2 6 1 9 5 7");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const nums = s.trim().split(/[\s,]+/).map(Number).filter((x) => !isNaN(x));
    if (nums.length === 0) return;
    setSteps(generateSteps(nums));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(input); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Cartesian Tree</h1>
        <p className="text-sm text-muted-foreground mb-6">配列からCartesian Treeを線形時間で構築</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="スペース区切りで数値" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">配列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.arr.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step)}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">スタック</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.stack.length > 0 ? step.stack.map((s, idx) => (
              <div key={idx} className="w-12 h-10 flex items-center justify-center border-2 bg-amber-50 border-amber-400 text-sm font-mono">
                {s}({step.arr[s]})
              </div>
            )) : <div className="text-sm text-muted-foreground">（空）</div>}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">木構造</div>
          <div className="space-y-1">
            {step.nodes.filter((n) => n.left >= 0 || n.right >= 0 || n.index === step.root).map((node) => (
              <div key={node.index} className="text-sm font-mono">
                ノード{node.index}(値{node.value}):
                {node.left >= 0 && ` 左=${node.left}(${step.arr[node.left]})`}
                {node.right >= 0 && ` 右=${node.right}(${step.arr[node.right]})`}
                {node.index === step.root && " [根]"}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>現在の要素</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>スタック内</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>pop</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>根</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
      </div>
    </div>
  );
}
