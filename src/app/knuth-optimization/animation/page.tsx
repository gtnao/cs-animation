"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "consider" | "try_split" | "best_split" | "done";

interface Step {
  type: StepType;
  l: number;
  r: number;
  k: number;
  dp: number[][];
  opt: number[][];
  description: string;
  highlightCells?: [number, number][];
}

// --- Algorithm ---

function generateSteps(freq: number[]): Step[] {
  const n = freq.length;
  const steps: Step[] = [];
  const INF = 1e9;

  // Prefix sums for cost
  const prefix = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + freq[i];
  const cost = (i: number, j: number) => prefix[j + 1] - prefix[i];

  const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const opt: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    dp[i][i] = freq[i];
    opt[i][i] = i;
  }

  steps.push({
    type: "init",
    l: 0, r: 0, k: 0,
    dp: dp.map(r => [...r]),
    opt: opt.map(r => [...r]),
    description: `Knuth's Optimization: 最適BST。頻度=[${freq.join(",")}]。長さ1の区間を初期化`,
  });

  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      dp[i][j] = INF;

      const lo = opt[i][j - 1];
      const hi = i + 1 <= j ? opt[i + 1][j] : j;

      steps.push({
        type: "consider",
        l: i, r: j, k: -1,
        dp: dp.map(r => [...r]),
        opt: opt.map(r => [...r]),
        description: `区間[${i},${j}]: 分割点を[${lo},${hi}]で探索 (Knuthの条件による制限)`,
        highlightCells: [[i, j]],
      });

      for (let k = lo; k <= hi; k++) {
        const left = k > i ? dp[i][k - 1] : 0;
        const right = k < j ? dp[k + 1][j] : 0;
        const val = left + right + cost(i, j);

        if (val < dp[i][j]) {
          dp[i][j] = val;
          opt[i][j] = k;
        }
      }

      steps.push({
        type: "best_split",
        l: i, r: j, k: opt[i][j],
        dp: dp.map(r => [...r]),
        opt: opt.map(r => [...r]),
        description: `dp[${i}][${j}] = ${dp[i][j]}, opt = ${opt[i][j]}`,
        highlightCells: [[i, j]],
      });
    }
  }

  steps.push({
    type: "done",
    l: 0, r: n - 1, k: 0,
    dp: dp.map(r => [...r]),
    opt: opt.map(r => [...r]),
    description: `完了。最適BST のコスト = ${dp[0][n - 1]}`,
    highlightCells: [[0, n - 1]],
  });

  return steps;
}

// --- Component ---

export default function KnuthOptimizationAnimationPage() {
  const [input, setInput] = useState("3 5 1 2 4");
  const [freq, setFreq] = useState([3, 5, 1, 2, 4]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    const parsed = input.trim().split(/[\s,]+/).map(Number).filter(x => !isNaN(x) && x > 0);
    if (parsed.length < 2 || parsed.length > 8) return;
    setFreq(parsed);
    setSteps(generateSteps(parsed));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [input]);

  useEffect(() => {
    setSteps(generateSteps([3, 5, 1, 2, 4]));
    setCurrentStep(0);
  }, []);

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
  const n = freq.length;

  return (
    <>
<div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="頻度 (空白区切り)" className="font-mono max-w-xs" />
          <Button onClick={run} variant="outline">実行</Button>
        </div>

        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">dp[i][j] / opt[i][j]</div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-14 h-8 text-xs text-muted-foreground font-normal">i\j</th>
                {Array.from({ length: n }, (_, j) => (
                  <th key={j} className="w-20 h-8 text-xs text-muted-foreground font-normal">{j}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: n }, (_, i) => (
                <tr key={i}>
                  <td className="w-14 h-10 text-xs text-muted-foreground text-center">{i}</td>
                  {Array.from({ length: n }, (_, j) => {
                    const base = "w-20 h-10 flex items-center justify-center border text-[10px] font-mono transition-colors";
                    if (j < i) return <td key={j}><div className={`${base} bg-gray-100 border-gray-200`}></div></td>;
                    const isHighlight = step.highlightCells?.some(([r, c]) => r === i && c === j);
                    const cls = isHighlight
                      ? step.type === "done" ? `${base} bg-emerald-100 border-emerald-500 font-bold` : `${base} bg-blue-100 border-blue-400 font-bold`
                      : step.dp[i][j] > 0 ? `${base} bg-white border-gray-300` : `${base} bg-gray-50 border-gray-200`;
                    return (
                      <td key={j}>
                        <div className={cls}>
                          {step.dp[i][j] >= 1e9 ? "-" : `${step.dp[i][j]}(k=${step.opt[i][j]})`}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
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
