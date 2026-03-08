"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "check_m1" | "check_m2" | "augment" | "build_graph" | "find_path" | "toggle" | "done";

interface Step {
  type: StepType;
  elements: string[];
  selected: boolean[];
  currentElement: number;
  path: number[];
  iteration: number;
  description: string;
}

function generateSteps(n: number): Step[] {
  const steps: Step[] = [];
  // Simple example: elements {0,...,n-1}
  // M1: uniform matroid rank 2 (any 2 elements form independent set)
  // M2: partition matroid, groups {0,1}, {2,3}, etc.
  const elements = Array.from({ length: n }, (_, i) => String(i));
  const selected = new Array(n).fill(false);

  steps.push({
    type: "init",
    elements: [...elements],
    selected: [...selected],
    currentElement: -1,
    path: [],
    iteration: 0,
    description: `${n}個の要素。M1=一様マトロイド(ランク2), M2=パーティションマトロイド。共通独立集合を増大法で求める`,
  });

  // Greedy augmentation simulation
  let iteration = 0;
  for (let i = 0; i < n && selected.filter(Boolean).length < 2; i++) {
    iteration++;
    const group = Math.floor(i / 2);
    const sameGroup = selected.some((s, j) => s && Math.floor(j / 2) === group);

    steps.push({
      type: "check_m1",
      elements: [...elements],
      selected: [...selected],
      currentElement: i,
      path: [],
      iteration,
      description: `反復${iteration}: 要素${i}をM1でチェック。現在の独立集合サイズ=${selected.filter(Boolean).length} < 2 → OK`,
    });

    steps.push({
      type: "check_m2",
      elements: [...elements],
      selected: [...selected],
      currentElement: i,
      path: [],
      iteration,
      description: `要素${i}をM2でチェック。グループ${group}${sameGroup ? "は使用済み → NG" : "は未使用 → OK"}`,
    });

    if (!sameGroup && selected.filter(Boolean).length < 2) {
      selected[i] = true;
      steps.push({
        type: "augment",
        elements: [...elements],
        selected: [...selected],
        currentElement: i,
        path: [i],
        iteration,
        description: `要素${i}を独立集合に追加。現在: {${elements.filter((_, j) => selected[j]).join(", ")}}`,
      });
    }
  }

  steps.push({
    type: "done",
    elements: [...elements],
    selected: [...selected],
    currentElement: -1,
    path: [],
    iteration,
    description: `完了。最大共通独立集合: {${elements.filter((_, j) => selected[j]).join(", ")}} (サイズ ${selected.filter(Boolean).length})`,
  });

  return steps;
}

export default function MatroidIntersectionAnimationPage() {
  const [inputN, setInputN] = useState("6");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((nStr: string) => {
    const n = parseInt(nStr);
    if (isNaN(n) || n <= 0 || n > 12) return;
    setSteps(generateSteps(n));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(inputN); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

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
<div className="flex gap-2 mb-8">
          <Input value={inputN} onChange={(e) => setInputN(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputN); }} placeholder="要素数" className="font-mono w-24" />
          <Button onClick={() => run(inputN)} variant="outline">実行</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">要素 (グループで色分け)</div>
          <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
            {step.elements.map((elem, idx) => (
              <div key={idx} className={`w-14 h-14 flex flex-col items-center justify-center border-2 rounded text-sm font-mono transition-colors ${
                idx === step.currentElement && step.type === "augment" ? "bg-emerald-100 border-emerald-500" :
                idx === step.currentElement ? "bg-blue-100 border-blue-400" :
                step.selected[idx] ? "bg-emerald-100 border-emerald-500" :
                "bg-white border-gray-200"
              }`}>
                <div>{elem}</div>
                <div className="text-[10px] text-muted-foreground">G{Math.floor(idx / 2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">現在の独立集合</div>
          <div className="flex gap-1">
            {step.selected.some(Boolean) ? step.elements.filter((_, i) => step.selected[i]).map((e, idx) => (
              <div key={idx} className="w-10 h-10 flex items-center justify-center border-2 bg-emerald-100 border-emerald-500 text-sm font-mono">{e}</div>
            )) : <div className="text-sm text-muted-foreground">（空）</div>}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>反復 = <span className="font-mono font-semibold text-foreground">{step.iteration}</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>検討中</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>独立集合に含む</span></div>
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
