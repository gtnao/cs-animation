"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "find" | "union" | "save" | "rollback" | "done";

interface Step {
  type: StepType;
  parent: number[];
  rank: number[];
  history: { idx: number; oldVal: number; type: "parent" | "rank" }[];
  historyLen: number;
  currentOp: string;
  highlightNodes: number[];
  description: string;
}

interface Operation {
  type: "union" | "rollback";
  args: number[];
}

function find(parent: number[], x: number): number {
  while (parent[x] !== x) x = parent[x];
  return x;
}

function generateSteps(n: number, ops: Operation[]): Step[] {
  const steps: Step[] = [];
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  const history: { idx: number; oldVal: number; type: "parent" | "rank" }[] = [];

  steps.push({
    type: "init",
    parent: [...parent],
    rank: [...rank],
    history: [],
    historyLen: 0,
    currentOp: "",
    highlightNodes: [],
    description: `${n}個のノードでUnion-Findを初期化。各ノードが独立した集合`,
  });

  for (const op of ops) {
    if (op.type === "union") {
      const [a, b] = op.args;
      const ra = find(parent, a);
      const rb = find(parent, b);

      if (ra === rb) {
        steps.push({
          type: "find",
          parent: [...parent],
          rank: [...rank],
          history: history.map((h) => ({ ...h })),
          historyLen: history.length,
          currentOp: `union(${a}, ${b})`,
          highlightNodes: [a, b],
          description: `union(${a}, ${b}): 根 ${ra} = ${rb}、既に同じ集合`,
        });
        continue;
      }

      steps.push({
        type: "find",
        parent: [...parent],
        rank: [...rank],
        history: history.map((h) => ({ ...h })),
        historyLen: history.length,
        currentOp: `union(${a}, ${b})`,
        highlightNodes: [a, b, ra, rb],
        description: `union(${a}, ${b}): find(${a})=${ra}, find(${b})=${rb}`,
      });

      // Union by rank (no path compression for rollback support)
      if (rank[ra] < rank[rb]) {
        history.push({ idx: ra, oldVal: parent[ra], type: "parent" });
        parent[ra] = rb;
      } else if (rank[ra] > rank[rb]) {
        history.push({ idx: rb, oldVal: parent[rb], type: "parent" });
        parent[rb] = ra;
      } else {
        history.push({ idx: rb, oldVal: parent[rb], type: "parent" });
        history.push({ idx: ra, oldVal: rank[ra], type: "rank" });
        parent[rb] = ra;
        rank[ra]++;
      }

      steps.push({
        type: "union",
        parent: [...parent],
        rank: [...rank],
        history: history.map((h) => ({ ...h })),
        historyLen: history.length,
        currentOp: `union(${a}, ${b})`,
        highlightNodes: [ra, rb],
        description: `union完了: ${ra} と ${rb} を統合。履歴サイズ=${history.length}`,
      });
    } else if (op.type === "rollback") {
      const target = op.args[0];
      const savePoint = target;

      steps.push({
        type: "save",
        parent: [...parent],
        rank: [...rank],
        history: history.map((h) => ({ ...h })),
        historyLen: history.length,
        currentOp: `rollback to ${savePoint}`,
        highlightNodes: [],
        description: `ロールバック: 履歴を ${history.length} → ${savePoint} に巻き戻す`,
      });

      while (history.length > savePoint) {
        const entry = history.pop()!;
        if (entry.type === "parent") {
          parent[entry.idx] = entry.oldVal;
        } else {
          rank[entry.idx] = entry.oldVal;
        }
      }

      steps.push({
        type: "rollback",
        parent: [...parent],
        rank: [...rank],
        history: history.map((h) => ({ ...h })),
        historyLen: history.length,
        currentOp: `rollback to ${savePoint}`,
        highlightNodes: [],
        description: `ロールバック完了。現在の履歴サイズ=${history.length}`,
      });
    }
  }

  steps.push({
    type: "done",
    parent: [...parent],
    rank: [...rank],
    history: history.map((h) => ({ ...h })),
    historyLen: history.length,
    currentOp: "",
    highlightNodes: [],
    description: "全操作完了",
  });

  return steps;
}

function getNodeClass(idx: number, step: Step): string {
  const base = "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono rounded-full transition-colors";
  if (step.highlightNodes.includes(idx)) {
    return `${base} bg-blue-100 border-blue-400`;
  }
  if (step.type === "rollback") {
    return `${base} bg-amber-50 border-amber-400`;
  }
  return `${base} bg-white border-gray-200`;
}

export default function RollbackUnionFindAnimationPage() {
  const [inputN, setInputN] = useState("6");
  const [inputOps, setInputOps] = useState("u0-1,u2-3,u1-3,r1,u4-5");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((nStr: string, opsStr: string) => {
    const n = parseInt(nStr);
    if (isNaN(n) || n <= 0) return;
    const ops = opsStr.trim().split(/[\s,]+/).map((s) => {
      if (s.startsWith("u")) {
        const parts = s.slice(1).split("-").map(Number);
        return { type: "union" as const, args: parts };
      } else if (s.startsWith("r")) {
        return { type: "rollback" as const, args: [parseInt(s.slice(1))] };
      }
      return null;
    }).filter((x) => x !== null) as Operation[];
    setSteps(generateSteps(n, ops));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(inputN, inputOps); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 700);
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
        <h1 className="text-2xl font-bold mb-1">Rollback可能Union-Find</h1>
        <p className="text-sm text-muted-foreground mb-6">Union操作を巻き戻せるUnion-Findの動作を可視化</p>

        <div className="flex gap-2 mb-8 flex-wrap">
          <Input value={inputN} onChange={(e) => setInputN(e.target.value)} placeholder="ノード数" className="font-mono w-24" />
          <Input value={inputOps} onChange={(e) => setInputOps(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputN, inputOps); }} placeholder="操作 (u0-1,u2-3,r1,...)" className="font-mono max-w-sm" />
          <Button onClick={() => run(inputN, inputOps)} variant="outline">実行</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">ノード</div>
          <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
            {step.parent.map((_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getNodeClass(idx, step)}>{idx}</div>
                <div className="text-[10px] text-muted-foreground font-mono">p={step.parent[idx]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">親配列 / ランク</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.parent.map((p, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="w-12 h-10 flex items-center justify-center border-2 bg-white border-gray-200 text-sm font-mono">{p}</div>
                <div className="text-[10px] text-muted-foreground font-mono">r={step.rank[idx]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">履歴スタック (サイズ: {step.historyLen})</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.history.length > 0 ? step.history.map((h, idx) => (
              <div key={idx} className="px-2 py-1 border-2 bg-amber-50 border-amber-400 text-xs font-mono rounded">
                {h.type}[{h.idx}]←{h.oldVal}
              </div>
            )) : <div className="text-sm text-muted-foreground">（空）</div>}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.currentOp && <span className="font-mono font-semibold text-foreground">{step.currentOp}</span>}
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>操作対象</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>履歴/ロールバック</span></div>
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
