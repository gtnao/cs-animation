"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "sort_queries" | "process" | "answer" | "done";

interface Query {
  left: number;
  right: number;
  originalIndex: number;
}

interface Step {
  type: StepType;
  arr: number[];
  queries: Query[];
  sortedQueries: Query[];
  currentQueryIdx: number;
  scanPos: number;
  prefixSum: number[];
  answers: (number | null)[];
  description: string;
}

function generateSteps(arr: number[], queries: [number, number][]): Step[] {
  const steps: Step[] = [];
  const n = arr.length;
  if (n === 0 || queries.length === 0) return [];

  const qs: Query[] = queries.map(([l, r], i) => ({ left: l, right: r, originalIndex: i }));
  const answers: (number | null)[] = new Array(queries.length).fill(null);

  // Build prefix sum
  const prefixSum = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefixSum[i + 1] = prefixSum[i] + arr[i];
  }

  steps.push({
    type: "init",
    arr: [...arr],
    queries: qs.map((q) => ({ ...q })),
    sortedQueries: [],
    currentQueryIdx: -1,
    scanPos: -1,
    prefixSum: [...prefixSum],
    answers: [...answers],
    description: `配列: [${arr.join(", ")}]。${queries.length}個の区間和クエリをオフラインで処理`,
  });

  // Sort queries by right endpoint
  const sorted = [...qs].sort((a, b) => a.right - b.right);
  steps.push({
    type: "sort_queries",
    arr: [...arr],
    queries: qs.map((q) => ({ ...q })),
    sortedQueries: sorted.map((q) => ({ ...q })),
    currentQueryIdx: -1,
    scanPos: -1,
    prefixSum: [...prefixSum],
    answers: [...answers],
    description: `クエリを右端でソート: ${sorted.map((q) => `[${q.left},${q.right}]`).join(", ")}`,
  });

  for (let qi = 0; qi < sorted.length; qi++) {
    const q = sorted[qi];
    const sum = prefixSum[q.right + 1] - prefixSum[q.left];
    answers[q.originalIndex] = sum;

    steps.push({
      type: "process",
      arr: [...arr],
      queries: qs.map((qq) => ({ ...qq })),
      sortedQueries: sorted.map((qq) => ({ ...qq })),
      currentQueryIdx: qi,
      scanPos: q.right,
      prefixSum: [...prefixSum],
      answers: [...answers],
      description: `クエリ ${q.originalIndex}: [${q.left}, ${q.right}] → 区間和 = ${sum}`,
    });
  }

  steps.push({
    type: "done",
    arr: [...arr],
    queries: qs.map((q) => ({ ...q })),
    sortedQueries: sorted.map((q) => ({ ...q })),
    currentQueryIdx: -1,
    scanPos: -1,
    prefixSum: [...prefixSum],
    answers: [...answers],
    description: `完了。回答: [${answers.join(", ")}]`,
  });

  return steps;
}

function getCellClass(idx: number, step: Step): string {
  const base = "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
  if (step.currentQueryIdx >= 0 && step.sortedQueries.length > 0) {
    const q = step.sortedQueries[step.currentQueryIdx];
    if (idx >= q.left && idx <= q.right) {
      return `${base} bg-amber-50 border-amber-400`;
    }
  }
  return `${base} bg-white border-gray-200`;
}

export default function OfflineQueryAnimationPage() {
  const [inputArr, setInputArr] = useState("3 1 4 1 5 9 2 6");
  const [inputQueries, setInputQueries] = useState("1-3,0-4,2-5,6-7");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((arrStr: string, qStr: string) => {
    const nums = arrStr.trim().split(/[\s,]+/).map(Number).filter((x) => !isNaN(x));
    const qs: [number, number][] = qStr.trim().split(/[\s,]+/).map((s) => {
      const parts = s.split("-").map(Number);
      return [parts[0], parts[1]] as [number, number];
    }).filter(([l, r]) => !isNaN(l) && !isNaN(r) && l >= 0 && r < nums.length && l <= r);
    if (nums.length === 0 || qs.length === 0) return;
    setSteps(generateSteps(nums, qs));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(inputArr, inputQueries); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

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
    <>
<div className="flex gap-2 mb-8 flex-wrap">
          <Input value={inputArr} onChange={(e) => setInputArr(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputArr, inputQueries); }} placeholder="配列" className="font-mono max-w-xs" />
          <Input value={inputQueries} onChange={(e) => setInputQueries(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputArr, inputQueries); }} placeholder="クエリ (1-3,0-4,...)" className="font-mono max-w-xs" />
          <Button onClick={() => run(inputArr, inputQueries)} variant="outline">実行</Button>
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
          <div className="text-xs font-medium text-muted-foreground mb-2">クエリと回答</div>
          <div className="flex gap-2 flex-wrap">
            {step.queries.map((q, idx) => {
              const isCurrent = step.currentQueryIdx >= 0 && step.sortedQueries[step.currentQueryIdx]?.originalIndex === idx;
              return (
                <div key={idx} className={`px-3 py-2 border-2 rounded text-sm font-mono ${isCurrent ? "bg-blue-100 border-blue-400" : step.answers[idx] !== null ? "bg-emerald-100 border-emerald-500" : "bg-white border-gray-200"}`}>
                  Q{idx}: [{q.left},{q.right}] → {step.answers[idx] !== null ? step.answers[idx] : "?"}
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
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>処理中のクエリ</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>クエリ区間</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>回答済み</span></div>
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
