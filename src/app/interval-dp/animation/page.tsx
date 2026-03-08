"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---
// Matrix Chain Multiplication as interval DP example

type StepType = "init" | "consider" | "try_split" | "best_split" | "done";

interface Step {
  type: StepType;
  l: number;
  r: number;
  k: number;
  dp: number[][];
  description: string;
  highlightCells?: [number, number][];
}

// --- Algorithm step generation ---

function generateSteps(dims: number[]): Step[] {
  const n = dims.length - 1; // number of matrices
  const steps: Step[] = [];
  const INF = 1e9;
  const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  steps.push({
    type: "init",
    l: 0,
    r: 0,
    k: 0,
    dp: dp.map((r) => [...r]),
    description: `行列連鎖乗算: ${n}個の行列。次元=[${dims.join(",")}]。dp[i][i]=0で初期化`,
  });

  // Fill by increasing interval length
  for (let len = 2; len <= n; len++) {
    for (let l = 0; l <= n - len; l++) {
      const r = l + len - 1;
      dp[l][r] = INF;

      steps.push({
        type: "consider",
        l,
        r,
        k: -1,
        dp: dp.map((row) => [...row]),
        description: `区間 [${l}, ${r}] (長さ${len}) の最適分割を求める`,
        highlightCells: [[l, r]],
      });

      let bestK = l;
      for (let k = l; k < r; k++) {
        const cost = dp[l][k] + dp[k + 1][r] + dims[l] * dims[k + 1] * dims[r + 1];

        steps.push({
          type: "try_split",
          l,
          r,
          k,
          dp: dp.map((row) => [...row]),
          description: `k=${k}で分割: dp[${l}][${k}]+dp[${k + 1}][${r}]+${dims[l]}*${dims[k + 1]}*${dims[r + 1]}=${cost}`,
          highlightCells: [[l, r], [l, k], [k + 1, r]],
        });

        if (cost < dp[l][r]) {
          dp[l][r] = cost;
          bestK = k;
        }
      }

      steps.push({
        type: "best_split",
        l,
        r,
        k: bestK,
        dp: dp.map((row) => [...row]),
        description: `dp[${l}][${r}] = ${dp[l][r]} (k=${bestK}で分割が最適)`,
        highlightCells: [[l, r]],
      });
    }
  }

  steps.push({
    type: "done",
    l: 0,
    r: n - 1,
    k: 0,
    dp: dp.map((row) => [...row]),
    description: `完了。最小乗算回数 = ${dp[0][n - 1]}`,
    highlightCells: [[0, n - 1]],
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(row: number, col: number, step: Step): string {
  const base = "w-14 h-10 flex items-center justify-center border text-xs font-mono transition-colors";
  if (col < row) return `${base} bg-gray-100 border-gray-200`;

  if (!step.highlightCells) return `${base} bg-white border-gray-200`;

  for (let k = 0; k < step.highlightCells.length; k++) {
    const [r, c] = step.highlightCells[k];
    if (r === row && c === col) {
      if (k === 0) {
        if (step.type === "best_split" || step.type === "done") return `${base} bg-emerald-100 border-emerald-500 font-bold`;
        return `${base} bg-blue-100 border-blue-400 font-bold`;
      }
      return `${base} bg-amber-50 border-amber-400`;
    }
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function IntervalDPAnimationPage() {
  const [input, setInput] = useState("10 20 30 40 30");
  const [dims, setDims] = useState([10, 20, 30, 40, 30]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    const parsed = input.trim().split(/[\s,]+/).map(Number).filter((x) => !isNaN(x) && x > 0);
    if (parsed.length < 3) return;
    setDims(parsed);
    setSteps(generateSteps(parsed));
    setCurrentStep(0);
    setIsPlaying(false);
  }, [input]);

  useEffect(() => {
    setSteps(generateSteps([10, 20, 30, 40, 30]));
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

  const n = dims.length - 1;

  return (
    <>
<div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="行列の次元 (空白区切り)" className="font-mono max-w-md" />
          <Button onClick={run} variant="outline">実行</Button>
        </div>

        <div className="mb-4 text-sm text-muted-foreground">
          行列: {Array.from({ length: n }, (_, i) => `M${i}(${dims[i]}x${dims[i + 1]})`).join(", ")}
        </div>

        {/* DP Table */}
        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">dp[l][r] = 区間[l,r]の最小乗算回数</div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-14 h-8 text-xs text-muted-foreground font-normal">l\r</th>
                {Array.from({ length: n }, (_, i) => (
                  <th key={i} className="w-14 h-8 text-xs text-muted-foreground font-normal">{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: n }, (_, l) => (
                <tr key={l}>
                  <td className="w-14 h-10 text-xs text-muted-foreground text-center">{l}</td>
                  {Array.from({ length: n }, (_, r) => (
                    <td key={r}>
                      <div className={getCellClass(l, r, step)}>
                        {r >= l ? (step.dp[l][r] >= 1e9 ? "-" : step.dp[l][r]) : ""}
                      </div>
                    </td>
                  ))}
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

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>現在の区間</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>分割先</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>最適分割確定</span></div>
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
