"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "copy" | "expand_match" | "expand_mismatch" | "update" | "complete" | "done";

interface Step {
  type: StepType;
  i: number;
  c: number;
  r: number;
  p: number[];
  transformed: string;
  compareIndices?: [number, number];
  description: string;
}

// --- Algorithm ---

function generateSteps(s: string): Step[] {
  if (s.length === 0) return [];
  const steps: Step[] = [];

  // Transform: "abc" -> "^#a#b#c#$"
  let t = "^#";
  for (let i = 0; i < s.length; i++) {
    t += s[i] + "#";
  }
  t += "$";

  const n = t.length;
  const p = new Array(n).fill(0);
  let c = 0, r = 0;

  steps.push({
    type: "init",
    i: 0,
    c: 0,
    r: 0,
    p: [...p],
    transformed: t,
    description: `Manacher: "${s}" → 変換文字列 "${t}"。回文半径配列を計算`,
  });

  for (let i = 1; i < n - 1; i++) {
    const mirror = 2 * c - i;

    if (i < r) {
      p[i] = Math.min(r - i, p[mirror]);
      steps.push({
        type: "copy",
        i,
        c,
        r,
        p: [...p],
        transformed: t,
        description: `i=${i} は回文 [${2*c-r}, ${r}) の内側。鏡像位置 ${mirror} から P[${i}] = min(${r - i}, ${p[mirror]}) = ${p[i]}`,
      });
    }

    while (i + p[i] + 1 < n && i - p[i] - 1 >= 0 && t[i + p[i] + 1] === t[i - p[i] - 1]) {
      steps.push({
        type: "expand_match",
        i,
        c,
        r,
        p: [...p],
        transformed: t,
        compareIndices: [i - p[i] - 1, i + p[i] + 1],
        description: `T[${i - p[i] - 1}]='${t[i - p[i] - 1]}' = T[${i + p[i] + 1}]='${t[i + p[i] + 1]}' → 一致。P[${i}] = ${p[i] + 1}`,
      });
      p[i]++;
    }

    if (i + p[i] + 1 < n && i - p[i] - 1 >= 0 && t[i + p[i] + 1] !== t[i - p[i] - 1]) {
      steps.push({
        type: "expand_mismatch",
        i,
        c,
        r,
        p: [...p],
        transformed: t,
        compareIndices: [i - p[i] - 1, i + p[i] + 1],
        description: `T[${i - p[i] - 1}]='${t[i - p[i] - 1]}' ≠ T[${i + p[i] + 1}]='${t[i + p[i] + 1]}' → 不一致。展開終了`,
      });
    }

    if (i + p[i] > r) {
      c = i;
      r = i + p[i];
      steps.push({
        type: "update",
        i,
        c,
        r,
        p: [...p],
        transformed: t,
        description: `中心と右端を更新: c=${c}, r=${r}`,
      });
    }

    steps.push({
      type: "complete",
      i,
      c,
      r,
      p: [...p],
      transformed: t,
      description: `P[${i}] = ${p[i]} 確定 ${t[i] !== '#' ? `(位置 '${t[i]}' 中心の回文半径)` : ""}`,
    });
  }

  // Find longest palindrome
  let maxLen = 0, centerIdx = 0;
  for (let i = 1; i < n - 1; i++) {
    if (p[i] > maxLen) {
      maxLen = p[i];
      centerIdx = i;
    }
  }
  const start = (centerIdx - maxLen) / 2;
  const palindrome = s.slice(start, start + maxLen);

  steps.push({
    type: "done",
    i: n,
    c,
    r,
    p: [...p],
    transformed: t,
    description: `完了。最長回文: "${palindrome}" (長さ ${maxLen}, 位置 ${start})`,
  });

  return steps;
}

// --- Component ---

export default function ManacherAnimationPage() {
  const [input, setInput] = useState("abacaba");
  const [text, setText] = useState("abacaba");
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

  return (
    <>
<div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="文字列を入力" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        {/* Original string */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">元の文字列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {text.split("").map((c, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 flex items-center justify-center border-2 text-sm font-mono bg-white border-gray-200">{c}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Transformed string */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">変換文字列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.transformed.split("").map((c, idx) => {
              const base = "w-8 h-8 flex items-center justify-center border text-xs font-mono transition-colors";
              let cls = `${base} bg-white border-gray-200`;

              if (step.compareIndices) {
                const [a, b] = step.compareIndices;
                if (idx === a || idx === b) {
                  cls = step.type === "expand_match"
                    ? `${base} bg-emerald-100 border-emerald-500`
                    : `${base} bg-red-100 border-red-500`;
                }
              }
              if (idx === step.i && step.type !== "done") {
                cls = `${base} bg-blue-100 border-blue-400`;
              }
              if (step.r > 0 && idx >= 2 * step.c - step.r && idx <= step.r && idx !== step.i) {
                if (!step.compareIndices || (idx !== step.compareIndices[0] && idx !== step.compareIndices[1])) {
                  cls = `${base} bg-amber-50 border-amber-400`;
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

        {/* P array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">回文半径 P</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.p.map((val, idx) => {
              if (idx === 0 || idx === step.transformed.length - 1) return null;
              const computed = step.type === "done" || idx < step.i || (idx === step.i && step.type === "complete");
              let cls = "w-8 h-8 flex items-center justify-center border text-xs font-mono transition-colors";
              if (idx === step.i && step.type === "complete") cls += " bg-blue-100 border-blue-400 font-bold";
              else if (computed) cls += " bg-white border-gray-300";
              else cls += " bg-gray-50 border-gray-200 text-muted-foreground";
              return (
                <div key={idx} className="flex flex-col items-center">
                  <div className={cls}>{computed ? val : "–"}</div>
                  <div className="text-[8px] text-muted-foreground font-mono">{idx}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.type !== "done" && step.type !== "init" && (
            <>
              <span>i = <span className="font-mono font-semibold text-foreground">{step.i}</span></span>
              <span>c = <span className="font-mono font-semibold text-foreground">{step.c}</span></span>
              <span>r = <span className="font-mono font-semibold text-foreground">{step.r}</span></span>
            </>
          )}
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>現在位置</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>現在の回文範囲</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>一致</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>不一致</span></div>
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
