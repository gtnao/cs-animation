"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "scan" | "group" | "done";

interface Step {
  type: StepType;
  currentIdx: number;
  groups: { char: string; count: number; start: number; end: number }[];
  currentGroupStart: number;
  encoded: string;
  description: string;
}

// --- Algorithm ---

function generateSteps(s: string): Step[] {
  const n = s.length;
  if (n === 0) return [];
  const steps: Step[] = [];
  const groups: { char: string; count: number; start: number; end: number }[] = [];

  steps.push({
    type: "init",
    currentIdx: 0,
    groups: [],
    currentGroupStart: 0,
    encoded: "",
    description: `Run Length Encoding: "${s}" を圧縮`,
  });

  let i = 0;
  while (i < n) {
    const c = s[i];
    let count = 1;
    const start = i;

    while (i + count < n && s[i + count] === c) {
      count++;
    }

    groups.push({ char: c, count, start, end: start + count - 1 });
    const encoded = groups.map((g) => (g.count > 1 ? `${g.char}${g.count}` : g.char)).join("");

    steps.push({
      type: "group",
      currentIdx: start + count - 1,
      groups: [...groups],
      currentGroupStart: start,
      encoded,
      description: `'${c}' が ${count} 回連続 (位置 ${start}-${start + count - 1}) → ${count > 1 ? `"${c}${count}"` : `"${c}"`}`,
    });

    i += count;
  }

  const finalEncoded = groups.map((g) => (g.count > 1 ? `${g.char}${g.count}` : g.char)).join("");

  steps.push({
    type: "done",
    currentIdx: n,
    groups: [...groups],
    currentGroupStart: -1,
    encoded: finalEncoded,
    description: `RLE完了。"${s}" → "${finalEncoded}" (${n}文字 → ${finalEncoded.length}文字、圧縮率 ${Math.round((finalEncoded.length / n) * 100)}%)`,
  });

  return steps;
}

// --- Component ---

export default function RLEAnimationPage() {
  const [input, setInput] = useState("aaabbbccdddddeef");
  const [text, setText] = useState("aaabbbccdddddeef");
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
    <>
<div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="文字列を入力" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        {/* String */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">入力文字列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {text.split("").map((c, idx) => {
              const base = "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              let cls = `${base} bg-white border-gray-200`;
              // Highlight current group
              for (const g of step.groups) {
                if (idx >= g.start && idx <= g.end) {
                  if (g.start === step.currentGroupStart) {
                    cls = `${base} bg-emerald-100 border-emerald-500`;
                  } else {
                    cls = `${base} bg-amber-50 border-amber-400`;
                  }
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

        {/* Encoded result */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">エンコード結果</div>
          <div className="p-3 bg-muted/30 border border-border rounded font-mono text-lg">
            {step.encoded || "–"}
          </div>
        </div>

        {/* Groups */}
        {step.groups.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">検出されたラン</div>
            <div className="flex gap-2 flex-wrap">
              {step.groups.map((g, idx) => (
                <span key={idx} className={`px-2 py-1 rounded text-sm font-mono border ${
                  g.start === step.currentGroupStart ? "bg-emerald-50 border-emerald-300" : "bg-muted border-border"
                }`}>
                  &apos;{g.char}&apos; x{g.count} [{g.start}-{g.end}]
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>現在のラン</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>処理済みラン</span></div>
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
