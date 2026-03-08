"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "analyze_permutation" | "compute_term" | "sum_result" | "done";

interface Step {
  type: StepType;
  nPositions: number;
  nColors: number;
  currentPerm: number;
  cycleLengths: number[];
  cycleCount: number;
  term: number;
  totalSum: number;
  groupSize: number;
  result: number | null;
  description: string;
}

// --- Algorithm ---

function gcd(a: number, b: number): number {
  while (b > 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

function generateSteps(n: number, k: number): Step[] {
  const steps: Step[] = [];

  steps.push({
    type: "init",
    nPositions: n,
    nColors: k,
    currentPerm: -1,
    cycleLengths: [],
    cycleCount: 0,
    term: 0,
    totalSum: 0,
    groupSize: n,
    result: null,
    description: `ポリアの数え上げ定理: ${n} 位置を ${k} 色で塗る回転同値なパターン数を計算`,
  });

  let totalSum = 0;

  // Cyclic group of rotations
  for (let r = 0; r < n; r++) {
    // Find cycle structure of rotation by r
    const visited = new Array(n).fill(false);
    const cycleLengths: number[] = [];

    for (let i = 0; i < n; i++) {
      if (!visited[i]) {
        let len = 0;
        let j = i;
        while (!visited[j]) {
          visited[j] = true;
          j = (j + r) % n;
          len++;
        }
        cycleLengths.push(len);
      }
    }

    const cycleCount = cycleLengths.length;
    const term = Math.pow(k, cycleCount);
    totalSum += term;

    steps.push({
      type: "analyze_permutation",
      nPositions: n,
      nColors: k,
      currentPerm: r,
      cycleLengths: [...cycleLengths],
      cycleCount,
      term: 0,
      totalSum: totalSum - term,
      groupSize: n,
      result: null,
      description: `回転 ${r}: サイクル構造 = [${cycleLengths.join(", ")}], サイクル数 = ${cycleCount}`,
    });

    steps.push({
      type: "compute_term",
      nPositions: n,
      nColors: k,
      currentPerm: r,
      cycleLengths: [...cycleLengths],
      cycleCount,
      term,
      totalSum,
      groupSize: n,
      result: null,
      description: `寄与 = ${k}^${cycleCount} = ${term}, 累積合計 = ${totalSum}`,
    });
  }

  const result = totalSum / n;

  steps.push({
    type: "sum_result",
    nPositions: n,
    nColors: k,
    currentPerm: -1,
    cycleLengths: [],
    cycleCount: 0,
    term: 0,
    totalSum,
    groupSize: n,
    result,
    description: `パターン数 = ${totalSum} / ${n} = ${result}`,
  });

  steps.push({
    type: "done",
    nPositions: n,
    nColors: k,
    currentPerm: -1,
    cycleLengths: [],
    cycleCount: 0,
    term: 0,
    totalSum,
    groupSize: n,
    result,
    description: `計算完了: 異なるパターン数 = ${result}`,
  });

  return steps;
}

const BEAD_COLORS = [
  "bg-blue-400",
  "bg-red-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-purple-400",
];

// --- Component ---

export default function PolyaAnimationPage() {
  const [inputN, setInputN] = useState("4");
  const [inputK, setInputK] = useState("3");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((nStr: string, kStr: string) => {
    const n = parseInt(nStr, 10);
    const k = parseInt(kStr, 10);
    if (isNaN(n) || isNaN(k) || n < 1 || n > 8 || k < 1 || k > 5) return;
    setSteps(generateSteps(n, k));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputN, inputK);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") {
        setCurrentStep((prev) => Math.max(0, prev - 1));
        setIsPlaying(false);
      } else if (e.key === "ArrowRight") {
        setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
        setIsPlaying(false);
      } else if (e.key === " ") {
        e.preventDefault();
        if (currentStep < steps.length - 1) {
          setIsPlaying((prev) => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <>
{/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-sm">位置数:</span>
            <Input value={inputN} onChange={(e) => setInputN(e.target.value)} className="font-mono w-20" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">色数:</span>
            <Input value={inputK} onChange={(e) => setInputK(e.target.value)} className="font-mono w-20" />
          </div>
          <Button onClick={() => run(inputN, inputK)} variant="outline">
            実行
          </Button>
        </div>

        {/* Cycle visualization */}
        {step.currentPerm >= 0 && step.cycleLengths.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              回転 {step.currentPerm} のサイクル構造
            </div>
            <div className="flex gap-1 items-center">
              {Array.from({ length: step.nPositions }, (_, i) => {
                // Determine which cycle this position belongs to
                const visited = new Array(step.nPositions).fill(false);
                let cycleIdx = 0;
                for (let start = 0; start < step.nPositions; start++) {
                  if (!visited[start]) {
                    let j = start;
                    while (!visited[j]) {
                      visited[j] = true;
                      if (j === i) break;
                      j = (j + step.currentPerm) % step.nPositions;
                    }
                    if (j === i && visited[i]) break;
                    if (!visited[i]) cycleIdx++;
                  }
                }
                // Recompute to find actual cycle index for position i
                const vis2 = new Array(step.nPositions).fill(false);
                let ci = 0;
                let myCycle = 0;
                for (let start = 0; start < step.nPositions; start++) {
                  if (!vis2[start]) {
                    let j = start;
                    const members: number[] = [];
                    while (!vis2[j]) {
                      vis2[j] = true;
                      members.push(j);
                      j = (j + step.currentPerm) % step.nPositions;
                    }
                    if (members.includes(i)) {
                      myCycle = ci;
                    }
                    ci++;
                  }
                }

                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-10 h-10 rounded-full border-2 border-gray-300 ${BEAD_COLORS[myCycle % BEAD_COLORS.length]}`}
                    />
                    <div className="text-[10px] text-muted-foreground font-mono">{i}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-muted-foreground font-mono">
              サイクル: [{step.cycleLengths.join(", ")}]
            </div>
          </div>
        )}

        {/* Running total */}
        <div className="mb-6 p-3 border border-border rounded">
          <span className="text-sm font-mono">
            合計 = <span className="font-bold">{step.totalSum}</span>
            {step.term > 0 && step.type === "compute_term" && (
              <span className="text-muted-foreground"> (+ {step.term})</span>
            )}
          </span>
        </div>

        {/* Result */}
        {step.result !== null && (
          <div className="mb-6 p-4 border border-emerald-500 bg-emerald-50 rounded">
            <span className="text-sm font-mono font-bold">
              異なるパターン数 = {step.result}
            </span>
          </div>
        )}

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        {/* Description */}
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>現在の回転</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>結果</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
    </>
  );
}
