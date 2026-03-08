"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "round_start" | "check_mid" | "narrow_left" | "narrow_right" | "round_end" | "done";

interface QueryState {
  lo: number;
  hi: number;
  answer: number;
}

interface Step {
  type: StepType;
  values: number[];
  queries: number[];
  states: QueryState[];
  round: number;
  currentQuery: number;
  midValue: number;
  description: string;
}

function generateSteps(values: number[], queries: number[]): Step[] {
  const steps: Step[] = [];
  const n = values.length;
  const q = queries.length;
  if (n === 0 || q === 0) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const states: QueryState[] = queries.map(() => ({ lo: 0, hi: n - 1, answer: -1 }));

  steps.push({
    type: "init",
    values: [...sorted],
    queries: [...queries],
    states: states.map((s) => ({ ...s })),
    round: 0,
    currentQuery: -1,
    midValue: 0,
    description: `ソート済み配列: [${sorted.join(", ")}]。${q}個のクエリで各値の位置を並列二分探索`,
  });

  let round = 0;
  let active = true;

  while (active) {
    active = false;
    round++;

    steps.push({
      type: "round_start",
      values: [...sorted],
      queries: [...queries],
      states: states.map((s) => ({ ...s })),
      round,
      currentQuery: -1,
      midValue: 0,
      description: `ラウンド${round}: 全クエリの中間点を一括チェック`,
    });

    for (let qi = 0; qi < q; qi++) {
      if (states[qi].lo > states[qi].hi) continue;
      active = true;

      const mid = Math.floor((states[qi].lo + states[qi].hi) / 2);
      const midVal = sorted[mid];

      steps.push({
        type: "check_mid",
        values: [...sorted],
        queries: [...queries],
        states: states.map((s) => ({ ...s })),
        round,
        currentQuery: qi,
        midValue: midVal,
        description: `Q${qi}: target=${queries[qi]}, mid=${mid} (値${midVal})`,
      });

      if (sorted[mid] <= queries[qi]) {
        states[qi].answer = mid;
        states[qi].lo = mid + 1;
        steps.push({
          type: "narrow_right",
          values: [...sorted],
          queries: [...queries],
          states: states.map((s) => ({ ...s })),
          round,
          currentQuery: qi,
          midValue: midVal,
          description: `Q${qi}: ${midVal} ≤ ${queries[qi]}。answer=${mid}, lo=${mid + 1}に更新`,
        });
      } else {
        states[qi].hi = mid - 1;
        steps.push({
          type: "narrow_left",
          values: [...sorted],
          queries: [...queries],
          states: states.map((s) => ({ ...s })),
          round,
          currentQuery: qi,
          midValue: midVal,
          description: `Q${qi}: ${midVal} > ${queries[qi]}。hi=${mid - 1}に更新`,
        });
      }
    }

    steps.push({
      type: "round_end",
      values: [...sorted],
      queries: [...queries],
      states: states.map((s) => ({ ...s })),
      round,
      currentQuery: -1,
      midValue: 0,
      description: `ラウンド${round}完了`,
    });
  }

  steps.push({
    type: "done",
    values: [...sorted],
    queries: [...queries],
    states: states.map((s) => ({ ...s })),
    round,
    currentQuery: -1,
    midValue: 0,
    description: `完了。各クエリの答え: [${states.map((s) => s.answer).join(", ")}]`,
  });

  return steps;
}

function getCellClass(idx: number, step: Step): string {
  const base = "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (step.currentQuery >= 0) {
    const s = step.states[step.currentQuery];
    const mid = Math.floor((s.lo + s.hi) / 2);
    if (idx === mid && step.type === "check_mid") return `${base} bg-blue-100 border-blue-400`;
    if (idx >= s.lo && idx <= s.hi) return `${base} bg-amber-50 border-amber-400`;
  }

  return `${base} bg-white border-gray-200`;
}

export default function ParallelBinarySearchAnimationPage() {
  const [inputValues, setInputValues] = useState("1 3 5 7 9 11 13 15");
  const [inputQueries, setInputQueries] = useState("4 10 1 15 8");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((vStr: string, qStr: string) => {
    const vals = vStr.trim().split(/[\s,]+/).map(Number).filter((x) => !isNaN(x));
    const qs = qStr.trim().split(/[\s,]+/).map(Number).filter((x) => !isNaN(x));
    if (vals.length === 0 || qs.length === 0) return;
    setSteps(generateSteps(vals, qs));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(inputValues, inputQueries); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 500);
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
        <h1 className="text-2xl font-bold mb-1">Parallel Binary Search</h1>
        <p className="text-sm text-muted-foreground mb-6">複数クエリの二分探索を並列に実行</p>

        <div className="flex gap-2 mb-8 flex-wrap">
          <Input value={inputValues} onChange={(e) => setInputValues(e.target.value)} placeholder="ソート済み配列" className="font-mono max-w-xs" />
          <Input value={inputQueries} onChange={(e) => setInputQueries(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputValues, inputQueries); }} placeholder="クエリ値" className="font-mono max-w-xs" />
          <Button onClick={() => run(inputValues, inputQueries)} variant="outline">実行</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">ソート済み配列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.values.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step)}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">クエリ状態</div>
          <div className="space-y-1">
            {step.states.map((s, idx) => (
              <div key={idx} className={`flex items-center gap-3 px-3 py-1 border-2 rounded text-sm font-mono ${idx === step.currentQuery ? "bg-blue-100 border-blue-400" : "bg-white border-gray-200"}`}>
                <span className="w-16">Q{idx}: {step.queries[idx]}</span>
                <span className="w-24">[{s.lo}, {s.hi}]</span>
                <span>ans={s.answer >= 0 ? s.answer : "?"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>ラウンド = <span className="font-mono font-semibold text-foreground">{step.round}</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>中間点/現在のクエリ</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>探索範囲</span></div>
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
