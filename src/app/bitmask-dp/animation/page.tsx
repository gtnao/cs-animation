"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---
// TSP (Traveling Salesman Problem) as bitmask DP example

type StepType = "init" | "consider" | "transition" | "done";

interface Step {
  type: StepType;
  mask: number;
  last: number;
  dp: number[][];
  description: string;
  highlightMask?: number;
  highlightLast?: number;
}

// --- Algorithm step generation ---

function generateSteps(dist: number[][]): Step[] {
  const n = dist.length;
  const INF = 1e9;
  const steps: Step[] = [];
  const full = (1 << n) - 1;

  // dp[mask][last] = minimum distance to visit cities in mask, ending at last
  const dp: number[][] = Array.from({ length: 1 << n }, () =>
    new Array(n).fill(INF)
  );
  dp[1][0] = 0; // Start at city 0

  steps.push({
    type: "init",
    mask: 1,
    last: 0,
    dp: dp.map((r) => [...r]),
    description: `TSP: ${n}都市の巡回セールスマン問題。dp[{0}][0]=0で初期化`,
  });

  for (let mask = 1; mask <= full; mask++) {
    for (let u = 0; u < n; u++) {
      if (!(mask & (1 << u))) continue;
      if (dp[mask][u] >= INF) continue;

      const visited = [];
      for (let b = 0; b < n; b++) if (mask & (1 << b)) visited.push(b);

      steps.push({
        type: "consider",
        mask,
        last: u,
        dp: dp.map((r) => [...r]),
        description: `mask=${mask.toString(2).padStart(n, "0")} (訪問済み:{${visited.join(",")}}), 最後=${u}, コスト=${dp[mask][u]}`,
        highlightMask: mask,
        highlightLast: u,
      });

      for (let v = 0; v < n; v++) {
        if (mask & (1 << v)) continue;
        const newMask = mask | (1 << v);
        const newCost = dp[mask][u] + dist[u][v];
        if (newCost < dp[newMask][v]) {
          dp[newMask][v] = newCost;
          steps.push({
            type: "transition",
            mask: newMask,
            last: v,
            dp: dp.map((r) => [...r]),
            description: `都市${u}→${v} (距離${dist[u][v]}): dp[${newMask.toString(2).padStart(n, "0")}][${v}] = ${newCost}`,
            highlightMask: newMask,
            highlightLast: v,
          });
        }
      }
    }
  }

  let ans = INF;
  for (let u = 0; u < n; u++) {
    if (dp[full][u] + dist[u][0] < ans) {
      ans = dp[full][u] + dist[u][0];
    }
  }

  steps.push({
    type: "done",
    mask: full,
    last: 0,
    dp: dp.map((r) => [...r]),
    description: `完了。最短巡回路 = ${ans === INF ? "不可能" : ans}`,
  });

  return steps;
}

function parseDist(input: string, n: number): number[][] {
  const values = input.trim().split(/[\s,]+/).map(Number);
  const dist: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  let k = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      dist[i][j] = values[k++] || 0;
    }
  }
  return dist;
}

// --- Component ---

const DEFAULT_N = 4;
const DEFAULT_DIST = [
  [0, 10, 15, 20],
  [10, 0, 35, 25],
  [15, 35, 0, 30],
  [20, 25, 30, 0],
];

export default function BitmaskDPAnimationPage() {
  const [nInput, setNInput] = useState("4");
  const [distInput, setDistInput] = useState("0 10 15 20, 10 0 35 25, 15 35 0 30, 20 25 30 0");
  const [n, setN] = useState(DEFAULT_N);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    const newN = Math.max(2, Math.min(parseInt(nInput) || 4, 5));
    const dist = parseDist(distInput, newN);
    setN(newN);
    setSteps(generateSteps(dist));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [nInput, distInput]);

  useEffect(() => {
    setSteps(generateSteps(DEFAULT_DIST));
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((prev) => !prev); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  const INF = 1e9;

  return (
    <>
<div className="flex flex-wrap gap-2 mb-8">
          <Input value={nInput} onChange={(e) => setNInput(e.target.value)} placeholder="都市数" className="font-mono w-20" />
          <Input value={distInput} onChange={(e) => setDistInput(e.target.value)} placeholder="距離行列 (カンマ区切り)" className="font-mono max-w-lg" />
          <Button onClick={run} variant="outline">実行</Button>
        </div>

        {/* Bitmask states */}
        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            DPテーブル (mask × last city) ※ 値が更新済みの状態のみ表示
          </div>
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th className="px-2 h-8 text-muted-foreground font-normal text-left">mask</th>
                {Array.from({ length: n }, (_, i) => (
                  <th key={i} className="w-14 h-8 text-muted-foreground font-normal">city {i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 1 << n }, (_, mask) => {
                const hasValue = step.dp[mask].some((v) => v < INF);
                if (!hasValue) return null;
                return (
                  <tr key={mask}>
                    <td className="px-2 h-8 text-muted-foreground font-mono">
                      {mask.toString(2).padStart(n, "0")}
                    </td>
                    {Array.from({ length: n }, (_, last) => {
                      const val = step.dp[mask][last];
                      const base = "w-14 h-8 flex items-center justify-center border text-xs font-mono transition-colors";
                      const isHighlight = step.highlightMask === mask && step.highlightLast === last;
                      const cls = isHighlight
                        ? `${base} bg-blue-100 border-blue-400 font-bold`
                        : val < INF
                        ? `${base} bg-white border-gray-300`
                        : `${base} bg-gray-50 border-gray-200 text-muted-foreground`;
                      return (
                        <td key={last}>
                          <div className={cls}>{val < INF ? val : "-"}</div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
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
    </>
  );
}
