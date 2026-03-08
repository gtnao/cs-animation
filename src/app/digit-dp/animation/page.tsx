"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---
// Digit DP: count numbers from 1..N whose digit sum is divisible by K

type StepType = "init" | "process_digit" | "transition" | "done";

interface Step {
  type: StepType;
  pos: number;
  tight: number; // 0 or 1
  remainder: number;
  digit: number;
  dp: number[][][]; // dp[pos][tight][remainder]
  description: string;
  highlightState?: [number, number, number]; // [pos, tight, remainder]
}

// --- Algorithm step generation ---

function generateSteps(N: string, K: number): Step[] {
  const digits = N.split("").map(Number);
  const n = digits.length;
  const steps: Step[] = [];

  // dp[pos][tight][remainder]
  const dp: number[][][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: 2 }, () => new Array(K).fill(0))
  );
  dp[0][1][0] = 1; // Start: position 0, tight=true, remainder=0

  steps.push({
    type: "init",
    pos: 0,
    tight: 1,
    remainder: 0,
    digit: -1,
    dp: dp.map((a) => a.map((b) => [...b])),
    description: `N=${N}, K=${K}。1〜Nで桁和がKの倍数の個数を数える。dp[0][tight=1][rem=0]=1で初期化`,
  });

  for (let pos = 0; pos < n; pos++) {
    for (let tight = 0; tight <= 1; tight++) {
      for (let rem = 0; rem < K; rem++) {
        if (dp[pos][tight][rem] === 0) continue;

        const limit = tight ? digits[pos] : 9;

        steps.push({
          type: "process_digit",
          pos,
          tight,
          remainder: rem,
          digit: -1,
          dp: dp.map((a) => a.map((b) => [...b])),
          description: `dp[${pos}][tight=${tight}][rem=${rem}]=${dp[pos][tight][rem]}から遷移。桁${pos}の上限=${limit}`,
          highlightState: [pos, tight, rem],
        });

        for (let d = 0; d <= limit; d++) {
          const newTight = tight && d === limit ? 1 : 0;
          const newRem = (rem + d) % K;
          dp[pos + 1][newTight][newRem] += dp[pos][tight][rem];

          steps.push({
            type: "transition",
            pos,
            tight,
            remainder: rem,
            digit: d,
            dp: dp.map((a) => a.map((b) => [...b])),
            description: `桁${pos}に${d}を置く → dp[${pos + 1}][tight=${newTight}][rem=${newRem}] += ${dp[pos][tight][rem]}`,
            highlightState: [pos + 1, newTight, newRem],
          });
        }
      }
    }
  }

  const result = dp[n][0][0] + dp[n][1][0] - 1; // -1 to exclude 0
  steps.push({
    type: "done",
    pos: n,
    tight: 0,
    remainder: 0,
    digit: -1,
    dp: dp.map((a) => a.map((b) => [...b])),
    description: `完了。1〜${N}で桁和が${K}の倍数の個数 = ${result}`,
  });

  return steps;
}

// --- Component ---

export default function DigitDPAnimationPage() {
  const [inputN, setInputN] = useState("25");
  const [inputK, setInputK] = useState("3");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayN, setDisplayN] = useState("25");
  const [displayK, setDisplayK] = useState(3);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    const n = inputN.trim().replace(/^0+/, "") || "0";
    const k = Math.max(1, Math.min(parseInt(inputK) || 3, 9));
    if (!/^\d+$/.test(n) || n.length > 4) return;
    setDisplayN(n);
    setDisplayK(k);
    setSteps(generateSteps(n, k));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [inputN, inputK]);

  useEffect(() => {
    setSteps(generateSteps("25", 3));
    setCurrentStep(0);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 400);
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

  const digits = displayN.split("").map(Number);
  const n = digits.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">桁DP</h1>
        <p className="text-sm text-muted-foreground mb-6">1〜Nで桁和がKの倍数である数の個数を求める</p>

        <div className="flex flex-wrap gap-2 mb-8">
          <Input value={inputN} onChange={(e) => setInputN(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="N (上限)" className="font-mono w-32" />
          <Input value={inputK} onChange={(e) => setInputK(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="K (除数)" className="font-mono w-20" />
          <Button onClick={run} variant="outline">実行</Button>
        </div>

        {/* Digits display */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">N = {displayN} の各桁</div>
          <div className="flex gap-1">
            {digits.map((d, idx) => {
              const base = "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              const cls = step.pos === idx && step.type !== "done"
                ? `${base} bg-blue-100 border-blue-400 font-bold`
                : `${base} bg-white border-gray-200`;
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{d}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">桁{idx}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DP table display */}
        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            DPテーブル (各桁位置 × tight × 余り)
          </div>
          {[0, 1].map((tight) => (
            <div key={tight} className="mb-4">
              <div className="text-xs text-muted-foreground mb-1">tight = {tight}</div>
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="w-16 h-8 text-xs text-muted-foreground font-normal text-left">pos\rem</th>
                    {Array.from({ length: displayK }, (_, r) => (
                      <th key={r} className="w-12 h-8 text-xs text-muted-foreground font-normal">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: n + 1 }, (_, pos) => (
                    <tr key={pos}>
                      <td className="w-16 h-10 text-xs text-muted-foreground">{pos}</td>
                      {Array.from({ length: displayK }, (_, rem) => {
                        const base = "w-12 h-10 flex items-center justify-center border text-xs font-mono transition-colors";
                        const isHighlight = step.highlightState &&
                          step.highlightState[0] === pos &&
                          step.highlightState[1] === tight &&
                          step.highlightState[2] === rem;
                        const cls = isHighlight
                          ? `${base} bg-blue-100 border-blue-400 font-bold`
                          : step.dp[pos][tight][rem] > 0
                          ? `${base} bg-white border-gray-300`
                          : `${base} bg-gray-50 border-gray-200 text-muted-foreground`;
                        return (
                          <td key={rem}>
                            <div className={cls}>{step.dp[pos][tight][rem]}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>現在の状態/遷移先</span></div>
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
