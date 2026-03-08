"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "compare_match" | "compare_less" | "compare_greater" | "output" | "done";

interface Step {
  type: StepType;
  i: number;
  j: number;
  k: number;
  factors: { start: number; end: number; word: string }[];
  description: string;
}

// --- Duval's Algorithm ---

function generateSteps(s: string): Step[] {
  const n = s.length;
  if (n === 0) return [];
  const steps: Step[] = [];
  const factors: { start: number; end: number; word: string }[] = [];

  steps.push({
    type: "init",
    i: 0,
    j: 0,
    k: 0,
    factors: [],
    description: `Duval のアルゴリズムで Lyndon 分解: "${s}"`,
  });

  let i = 0;
  while (i < n) {
    let j = i;
    let k = i + 1;

    while (k < n && s[j] <= s[k]) {
      if (s[j] === s[k]) {
        steps.push({
          type: "compare_match",
          i,
          j,
          k,
          factors: [...factors],
          description: `s[${j}]='${s[j]}' = s[${k}]='${s[k]}' → 一致。j=${j + 1 === i ? i : j + 1}, k=${k + 1}`,
        });
        j++;
      } else {
        steps.push({
          type: "compare_less",
          i,
          j,
          k,
          factors: [...factors],
          description: `s[${j}]='${s[j]}' < s[${k}]='${s[k]}' → j をリセットして ${i}、k=${k + 1}`,
        });
        j = i;
      }
      k++;
    }

    if (k < n) {
      steps.push({
        type: "compare_greater",
        i,
        j,
        k,
        factors: [...factors],
        description: `s[${j}]='${s[j]}' > s[${k}]='${s[k]}' → Lyndon語の切れ目を検出`,
      });
    }

    const period = k - j;
    while (i + period <= k) {
      const word = s.slice(i, i + period);
      factors.push({ start: i, end: i + period - 1, word });
      steps.push({
        type: "output",
        i: i + period,
        j,
        k,
        factors: [...factors],
        description: `Lyndon語 "${word}" を出力 (位置 ${i}-${i + period - 1})`,
      });
      i += period;
    }
  }

  steps.push({
    type: "done",
    i: n,
    j: 0,
    k: 0,
    factors: [...factors],
    description: `Lyndon分解完了: [${factors.map((f) => `"${f.word}"`).join(", ")}]`,
  });

  return steps;
}

// --- Component ---

export default function LyndonAnimationPage() {
  const [input, setInput] = useState("abbaabbaac");
  const [text, setText] = useState("abbaabbaac");
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

  const colors = ["bg-blue-100 border-blue-400", "bg-emerald-100 border-emerald-500", "bg-amber-50 border-amber-400", "bg-red-100 border-red-500", "bg-purple-100 border-purple-400"];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Lyndon Factorization</h1>
        <p className="text-sm text-muted-foreground mb-6">文字列をLyndon語の非増加列に分解</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="文字列を入力" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        {/* String */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">文字列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {text.split("").map((c, idx) => {
              const base = "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              let cls = `${base} bg-white border-gray-200`;

              // Color by factor
              for (let fi = 0; fi < step.factors.length; fi++) {
                const f = step.factors[fi];
                if (idx >= f.start && idx <= f.end) {
                  cls = `${base} ${colors[fi % colors.length]}`;
                }
              }

              // Highlight comparison positions
              if (step.type === "compare_match" || step.type === "compare_less" || step.type === "compare_greater") {
                if (idx === step.j) cls = `${base} bg-blue-100 border-blue-400`;
                if (idx === step.k) {
                  if (step.type === "compare_match") cls = `${base} bg-emerald-100 border-emerald-500`;
                  else if (step.type === "compare_less") cls = `${base} bg-emerald-100 border-emerald-500`;
                  else cls = `${base} bg-red-100 border-red-500`;
                }
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

        {/* Factors */}
        {step.factors.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">検出された Lyndon語</div>
            <div className="flex gap-2 flex-wrap">
              {step.factors.map((f, idx) => (
                <span key={idx} className={`px-2 py-1 rounded text-sm font-mono border ${colors[idx % colors.length]}`}>
                  &quot;{f.word}&quot;
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.type !== "done" && step.type !== "init" && (
            <>
              <span>i = <span className="font-mono font-semibold text-foreground">{step.i}</span></span>
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
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>比較位置 j</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>一致 / 小さい</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>大きい (切れ目)</span></div>
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
