"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

type StepType = "init" | "visit" | "merge" | "done";

interface Step {
  type: StepType;
  node: number;
  dp: number[];
  description: string;
  highlightNode?: number;
  highlightChild?: number;
}

// --- Tree and algorithm ---

interface TreeNode {
  children: number[];
  value: number;
}

function buildDefaultTree(): TreeNode[] {
  // Tree:  0(3) - 1(2) - 3(4)
  //              - 2(1) - 4(5)
  //                     - 5(2)
  return [
    { children: [1, 2], value: 3 },
    { children: [3], value: 2 },
    { children: [4, 5], value: 1 },
    { children: [], value: 4 },
    { children: [], value: 5 },
    { children: [], value: 2 },
  ];
}

function generateSteps(tree: TreeNode[]): Step[] {
  const n = tree.length;
  const steps: Step[] = [];
  const dp = new Array(n).fill(0);

  steps.push({
    type: "init",
    node: -1,
    dp: [...dp],
    description: `木DP: 各頂点を根とする部分木の最大独立集合の重みを求める。${n}頂点の木`,
  });

  // Post-order DFS
  function dfs(u: number) {
    steps.push({
      type: "visit",
      node: u,
      dp: [...dp],
      description: `頂点${u} (値=${tree[u].value}) を訪問`,
      highlightNode: u,
    });

    let sumChildren = 0;
    let sumGrandchildren = 0;

    for (const c of tree[u].children) {
      dfs(c);
      sumChildren += dp[c];

      for (const gc of tree[c].children) {
        sumGrandchildren += dp[gc];
      }

      steps.push({
        type: "merge",
        node: u,
        dp: [...dp],
        description: `頂点${u}: 子${c}の結果 dp[${c}]=${dp[c]} をマージ`,
        highlightNode: u,
        highlightChild: c,
      });
    }

    // Max independent set: either include u (+ grandchildren) or skip u (+ children)
    dp[u] = Math.max(tree[u].value + sumGrandchildren, sumChildren);

    steps.push({
      type: "merge",
      node: u,
      dp: [...dp],
      description: `dp[${u}] = max(${tree[u].value}+孫計=${tree[u].value + sumGrandchildren}, 子計=${sumChildren}) = ${dp[u]}`,
      highlightNode: u,
    });
  }

  dfs(0);

  steps.push({
    type: "done",
    node: 0,
    dp: [...dp],
    description: `完了。最大独立集合の重み = ${dp[0]}`,
  });

  return steps;
}

// --- Component ---

export default function TreeDPAnimationPage() {
  const [tree] = useState(buildDefaultTree);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSteps(generateSteps(tree));
    setCurrentStep(0);
  }, [tree]);

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

  const run = useCallback(() => {
    setSteps(generateSteps(tree));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [tree]);

  // Simple tree visualization
  const levels = [[0], [1, 2], [3, 4, 5]];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">木DP</h1>
        <p className="text-sm text-muted-foreground mb-6">最大重み独立集合を木DPで求める</p>

        <Button onClick={run} variant="outline" className="mb-8">リセット</Button>

        {/* Tree visualization */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">木構造 (頂点番号: 値)</div>
          <div className="space-y-4">
            {levels.map((level, li) => (
              <div key={li} className="flex justify-center gap-8">
                {level.map((node) => {
                  const base = "w-16 h-16 flex flex-col items-center justify-center border-2 rounded-full text-sm font-mono transition-colors";
                  let cls = `${base} bg-white border-gray-200`;
                  if (step.highlightNode === node) cls = `${base} bg-blue-100 border-blue-400 font-bold`;
                  else if (step.highlightChild === node) cls = `${base} bg-amber-50 border-amber-400`;
                  return (
                    <div key={node} className="flex flex-col items-center">
                      <div className={cls}>
                        <span className="text-xs">{node}</span>
                        <span className="text-[10px] text-muted-foreground">v={tree[node].value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* DP values */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">dp[i] = 頂点iを根とする部分木の最大独立集合重み</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.dp.map((val, idx) => {
              const base = "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              let cls = `${base} bg-white border-gray-200`;
              if (step.highlightNode === idx) cls = `${base} bg-blue-100 border-blue-400 font-bold`;
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{val}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>現在の頂点</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" /><span>参照中の子</span></div>
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
