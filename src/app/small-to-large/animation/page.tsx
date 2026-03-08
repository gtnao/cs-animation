"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "compare_sizes" | "merge" | "move_element" | "done";

interface Step {
  type: StepType;
  sets: number[][];
  mergeFrom: number;
  mergeTo: number;
  movedElement: number;
  totalMoves: number;
  description: string;
}

function generateSteps(initialSets: number[][], mergeOps: [number, number][]): Step[] {
  const steps: Step[] = [];
  const sets = initialSets.map((s) => [...s]);
  let totalMoves = 0;

  steps.push({
    type: "init",
    sets: sets.map((s) => [...s]),
    mergeFrom: -1,
    mergeTo: -1,
    movedElement: -1,
    totalMoves: 0,
    description: `${sets.length}個の集合を初期化。マージテクで小さい集合を大きい集合に統合`,
  });

  for (const [a, b] of mergeOps) {
    if (a >= sets.length || b >= sets.length || a === b) continue;
    if (sets[a].length === 0 && sets[b].length === 0) continue;

    let from: number, to: number;
    if (sets[a].length < sets[b].length) {
      from = a;
      to = b;
    } else {
      from = b;
      to = a;
    }

    steps.push({
      type: "compare_sizes",
      sets: sets.map((s) => [...s]),
      mergeFrom: from,
      mergeTo: to,
      movedElement: -1,
      totalMoves,
      description: `集合${a}(サイズ${sets[a].length}) と 集合${b}(サイズ${sets[b].length}) をマージ。集合${from}→集合${to}に移動`,
    });

    const elementsToMove = [...sets[from]];
    for (const elem of elementsToMove) {
      sets[to].push(elem);
      sets[from] = sets[from].filter((e) => e !== elem);
      totalMoves++;

      steps.push({
        type: "move_element",
        sets: sets.map((s) => [...s]),
        mergeFrom: from,
        mergeTo: to,
        movedElement: elem,
        totalMoves,
        description: `要素 ${elem} を集合${from} → 集合${to} に移動。総移動回数=${totalMoves}`,
      });
    }

    steps.push({
      type: "merge",
      sets: sets.map((s) => [...s]),
      mergeFrom: from,
      mergeTo: to,
      movedElement: -1,
      totalMoves,
      description: `マージ完了: 集合${to} = [${sets[to].join(", ")}]`,
    });
  }

  steps.push({
    type: "done",
    sets: sets.map((s) => [...s]),
    mergeFrom: -1,
    mergeTo: -1,
    movedElement: -1,
    totalMoves,
    description: `全マージ完了。総移動回数=${totalMoves}`,
  });

  return steps;
}

export default function SmallToLargeAnimationPage() {
  const [inputSets, setInputSets] = useState("{1,2},{3},{4,5,6},{7,8}");
  const [inputOps, setInputOps] = useState("0-1,2-3,0-2");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((setsStr: string, opsStr: string) => {
    const setsMatch = setsStr.match(/\{[^}]*\}/g);
    if (!setsMatch) return;
    const sets = setsMatch.map((s) => s.slice(1, -1).split(",").map(Number).filter((x) => !isNaN(x)));
    const ops: [number, number][] = opsStr.trim().split(/[\s,]+/).map((s) => {
      const parts = s.split("-").map(Number);
      return [parts[0], parts[1]] as [number, number];
    }).filter(([a, b]) => !isNaN(a) && !isNaN(b));
    setSteps(generateSteps(sets, ops));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(inputSets, inputOps); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

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
        <h1 className="text-2xl font-bold mb-1">マージテク (Small to Large)</h1>
        <p className="text-sm text-muted-foreground mb-6">小さい集合を大きい集合にマージして計算量を削減</p>

        <div className="flex gap-2 mb-8 flex-wrap">
          <Input value={inputSets} onChange={(e) => setInputSets(e.target.value)} placeholder="集合 {1,2},{3},..." className="font-mono max-w-xs" />
          <Input value={inputOps} onChange={(e) => setInputOps(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputSets, inputOps); }} placeholder="マージ操作 0-1,2-3,..." className="font-mono max-w-xs" />
          <Button onClick={() => run(inputSets, inputOps)} variant="outline">実行</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">集合</div>
          <div className="space-y-2">
            {step.sets.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-sm font-mono w-12 text-muted-foreground">集合{idx}:</span>
                <div className="flex gap-1">
                  {s.length > 0 ? s.map((elem, ei) => (
                    <div key={ei} className={`w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors ${
                      elem === step.movedElement && idx === step.mergeTo ? "bg-emerald-100 border-emerald-500" :
                      idx === step.mergeFrom ? "bg-red-100 border-red-500" :
                      idx === step.mergeTo ? "bg-amber-50 border-amber-400" :
                      "bg-white border-gray-200"
                    }`}>{elem}</div>
                  )) : <span className="text-sm text-muted-foreground">（空）</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>総移動回数 = <span className="font-mono font-semibold text-foreground">{step.totalMoves}</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>マージ先</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>マージ元</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>移動した要素</span></div>
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
