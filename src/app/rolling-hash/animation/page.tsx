"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "compute_initial" | "roll" | "done";

interface Step {
  type: StepType;
  windowStart: number;
  windowEnd: number;
  hash: number;
  windowSize: number;
  description: string;
}

// --- Algorithm ---

const BASE = 31;
const MOD = 1000000007;

function generateSteps(s: string, windowSize: number): Step[] {
  const n = s.length;
  if (n === 0 || windowSize > n || windowSize === 0) return [];
  const steps: Step[] = [];

  steps.push({
    type: "init",
    windowStart: 0,
    windowEnd: windowSize - 1,
    hash: 0,
    windowSize,
    description: `Rolling Hash: ウィンドウサイズ ${windowSize}、基数 ${BASE}、法 ${MOD}`,
  });

  // Compute initial hash
  let hash = 0;
  let basePow = 1;
  for (let i = 0; i < windowSize; i++) {
    hash = (hash + s.charCodeAt(i) * basePow) % MOD;
    if (i < windowSize - 1) basePow = (basePow * BASE) % MOD;
  }

  steps.push({
    type: "compute_initial",
    windowStart: 0,
    windowEnd: windowSize - 1,
    hash,
    windowSize,
    description: `初期ハッシュ計算: H("${s.slice(0, windowSize)}") = ${hash}`,
  });

  // Roll the window
  for (let i = 1; i <= n - windowSize; i++) {
    const oldChar = s.charCodeAt(i - 1);
    hash = (hash - oldChar + MOD) % MOD;
    hash = (hash * modInverse(BASE, MOD)) % MOD;
    const newChar = s.charCodeAt(i + windowSize - 1);
    hash = (hash + newChar * basePow) % MOD;

    steps.push({
      type: "roll",
      windowStart: i,
      windowEnd: i + windowSize - 1,
      hash,
      windowSize,
      description: `ウィンドウをスライド: '${s[i - 1]}' を除去、'${s[i + windowSize - 1]}' を追加 → H("${s.slice(i, i + windowSize)}") = ${hash}`,
    });
  }

  steps.push({
    type: "done",
    windowStart: n - windowSize,
    windowEnd: n - 1,
    hash,
    windowSize,
    description: `Rolling Hash 計算完了`,
  });

  return steps;
}

function modInverse(a: number, m: number): number {
  let [old_r, r] = [a, m];
  let [old_s, s] = [1, 0];
  while (r !== 0) {
    const q = Math.floor(old_r / r);
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  return ((old_s % m) + m) % m;
}

// --- Component ---

export default function RollingHashAnimationPage() {
  const [input, setInput] = useState("abracadabra");
  const [winSizeInput, setWinSizeInput] = useState("4");
  const [text, setText] = useState("abracadabra");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string, w: string) => {
    const trimmed = s.trim();
    const ws = parseInt(w) || 3;
    if (trimmed.length === 0) return;
    setText(trimmed);
    setSteps(generateSteps(trimmed, Math.min(ws, trimmed.length)));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(input, winSizeInput); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

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
<div className="flex gap-2 mb-8 flex-wrap">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="文字列" className="font-mono max-w-xs" />
          <Input value={winSizeInput} onChange={(e) => setWinSizeInput(e.target.value)} placeholder="窓サイズ" className="font-mono w-24" />
          <Button onClick={() => run(input, winSizeInput)} variant="outline">実行</Button>
        </div>

        {/* String */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">文字列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {text.split("").map((c, idx) => {
              const base = "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              let cls = `${base} bg-white border-gray-200`;
              if (idx >= step.windowStart && idx <= step.windowEnd) {
                cls = `${base} bg-amber-50 border-amber-400`;
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

        {/* Hash value */}
        <div className="mb-6 p-4 bg-muted/30 border border-border rounded">
          <div className="text-xs font-medium text-muted-foreground mb-1">ハッシュ値</div>
          <div className="text-lg font-mono font-bold">{step.hash}</div>
          <div className="text-xs text-muted-foreground mt-1">
            ウィンドウ: [{step.windowStart}, {step.windowEnd}] = &quot;{text.slice(step.windowStart, step.windowEnd + 1)}&quot;
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>ウィンドウ</span></div>
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
