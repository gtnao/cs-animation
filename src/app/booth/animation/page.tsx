"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "compare_match" | "compare_less" | "compare_greater" | "update" | "done";

interface Step {
  type: StepType;
  f: number[];
  i: number;
  j: number;
  k: number;
  bestRotation: number;
  doubled: string;
  description: string;
}

// --- Algorithm ---

function generateSteps(s: string): Step[] {
  const n = s.length;
  if (n === 0) return [];
  const steps: Step[] = [];

  const doubled = s + s;
  const f = new Array(2 * n).fill(-1);

  steps.push({
    type: "init",
    f: [...f],
    i: 0,
    j: 0,
    k: 0,
    bestRotation: 0,
    doubled,
    description: `Booth のアルゴリズム: "${s}" の辞書順最小巡回シフトを求める。文字列を2回連結: "${doubled}"`,
  });

  let k = 0;
  for (let j = 1; j < 2 * n; j++) {
    let i = f[j - 1 - k];

    while (i !== -1 && doubled[j] !== doubled[k + i + 1]) {
      if (doubled[j] < doubled[k + i + 1]) {
        steps.push({
          type: "compare_less",
          f: [...f],
          i,
          j,
          k,
          bestRotation: k,
          doubled,
          description: `S'[${j}]='${doubled[j]}' < S'[${k + i + 1}]='${doubled[k + i + 1]}' → k を ${j - i - 1} に更新`,
        });
        k = j - i - 1;
      } else {
        steps.push({
          type: "compare_greater",
          f: [...f],
          i,
          j,
          k,
          bestRotation: k,
          doubled,
          description: `S'[${j}]='${doubled[j]}' > S'[${k + i + 1}]='${doubled[k + i + 1]}' → 失敗関数をたどる`,
        });
      }
      i = f[i];
    }

    if (doubled[j] !== doubled[k + i + 1]) {
      if (doubled[j] < doubled[k + i + 1]) {
        k = j;
        steps.push({
          type: "update",
          f: [...f],
          i,
          j,
          k,
          bestRotation: k,
          doubled,
          description: `S'[${j}]='${doubled[j]}' < S'[${k + i + 1}]='${doubled[k + i + 1]}' → k = ${j}`,
        });
      }
      f[j - k] = -1;
    } else {
      f[j - k] = i + 1;
      steps.push({
        type: "compare_match",
        f: [...f],
        i: i + 1,
        j,
        k,
        bestRotation: k,
        doubled,
        description: `S'[${j}]='${doubled[j]}' = S'[${k + i + 1}]='${doubled[k + i + 1]}' → f[${j - k}] = ${i + 1}`,
      });
    }
  }

  const result = s.slice(k) + s.slice(0, k);

  steps.push({
    type: "done",
    f: [...f],
    i: 0,
    j: 2 * n,
    k,
    bestRotation: k,
    doubled,
    description: `完了。最小巡回シフトは位置 ${k} から: "${result}"`,
  });

  return steps;
}

// --- Component ---

export default function BoothAnimationPage() {
  const [input, setInput] = useState("bbaaccaadd");
  const [text, setText] = useState("bbaaccaadd");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const trimmed = s.trim();
    if (trimmed.length === 0) return;
    setText(trimmed);
    setSteps(generateSteps(trimmed));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(input); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

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

  const n = text.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Minimum Rotation (Booth)</h1>
        <p className="text-sm text-muted-foreground mb-6">文字列の辞書順最小の巡回シフトを求める</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="文字列を入力" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        {/* Original string */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">元の文字列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {text.split("").map((c, idx) => {
              const base = "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              let cls = `${base} bg-white border-gray-200`;
              if (step.type === "done" && idx === step.bestRotation) {
                cls = `${base} bg-emerald-100 border-emerald-500`;
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{c}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Doubled string */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">2倍連結文字列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.doubled.split("").map((c, idx) => {
              const base = "w-8 h-8 flex items-center justify-center border text-xs font-mono transition-colors";
              let cls = `${base} bg-white border-gray-200`;
              if (idx === step.j && step.type !== "done") {
                cls = `${base} bg-blue-100 border-blue-400`;
              }
              if (idx >= step.bestRotation && idx < step.bestRotation + n) {
                if (step.type !== "done") {
                  cls = `${base} bg-amber-50 border-amber-400`;
                  if (idx === step.j) cls = `${base} bg-blue-100 border-blue-400`;
                } else {
                  cls = `${base} bg-emerald-100 border-emerald-500`;
                }
              }
              return (
                <div key={idx} className="flex flex-col items-center">
                  <div className={cls}>{c}</div>
                  <div className="text-[8px] text-muted-foreground font-mono">{idx}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Result */}
        {step.type === "done" && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded">
            <div className="text-xs text-muted-foreground mb-1">最小巡回シフト (位置 {step.bestRotation})</div>
            <div className="text-lg font-mono font-bold">{text.slice(step.bestRotation) + text.slice(0, step.bestRotation)}</div>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.type !== "done" && step.type !== "init" && (
            <>
              <span>j = <span className="font-mono font-semibold text-foreground">{step.j}</span></span>
              <span>k = <span className="font-mono font-semibold text-foreground">{step.k}</span></span>
            </>
          )}
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>現在の比較位置</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>現在の候補区間</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>最小巡回シフト</span></div>
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
