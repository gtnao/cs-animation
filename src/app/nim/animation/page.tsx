"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "show_binary" | "compute_xor" | "check_result" | "find_move" | "done";

interface Step {
  type: StepType;
  piles: number[];
  binary: string[];
  nimSum: number;
  nimSumBinary: string;
  currentPile: number;
  moveFromPile: number;
  moveToValue: number;
  description: string;
}

// --- Step generation ---

function toBin(n: number, width: number): string {
  return n.toString(2).padStart(width, "0");
}

function generateSteps(piles: number[]): Step[] {
  const steps: Step[] = [];
  const maxVal = Math.max(...piles, 1);
  const width = Math.max(maxVal.toString(2).length, 1);

  const binary = piles.map((p) => toBin(p, width));

  steps.push({
    type: "init",
    piles, binary,
    nimSum: 0,
    nimSumBinary: toBin(0, width),
    currentPile: -1,
    moveFromPile: -1,
    moveToValue: -1,
    description: `Nim: ${piles.length} 個の山 [${piles.join(", ")}]`,
  });

  // Show binary representations
  steps.push({
    type: "show_binary",
    piles, binary,
    nimSum: 0,
    nimSumBinary: toBin(0, width),
    currentPile: -1,
    moveFromPile: -1,
    moveToValue: -1,
    description: `各山の2進数表現: ${binary.join(", ")}`,
  });

  // Compute XOR step by step
  let xor = 0;
  for (let i = 0; i < piles.length; i++) {
    xor ^= piles[i];
    steps.push({
      type: "compute_xor",
      piles, binary,
      nimSum: xor,
      nimSumBinary: toBin(xor, width),
      currentPile: i,
      moveFromPile: -1,
      moveToValue: -1,
      description: `XOR に山 ${i} (${piles[i]}) を追加: Nim和 = ${toBin(xor, width)} (${xor})`,
    });
  }

  const nimSum = xor;

  steps.push({
    type: "check_result",
    piles, binary,
    nimSum,
    nimSumBinary: toBin(nimSum, width),
    currentPile: -1,
    moveFromPile: -1,
    moveToValue: -1,
    description: nimSum === 0
      ? `Nim和 = 0 → 後手必勝 (現在のプレイヤーは負け)`
      : `Nim和 = ${nimSum} (≠ 0) → 先手必勝`,
  });

  // Find winning move if nim sum != 0
  if (nimSum !== 0) {
    for (let i = 0; i < piles.length; i++) {
      const newVal = piles[i] ^ nimSum;
      if (newVal < piles[i]) {
        steps.push({
          type: "find_move",
          piles, binary,
          nimSum,
          nimSumBinary: toBin(nimSum, width),
          currentPile: i,
          moveFromPile: i,
          moveToValue: newVal,
          description: `必勝手: 山 ${i} から ${piles[i] - newVal} 個取る (${piles[i]} → ${newVal})`,
        });
        break;
      }
    }
  }

  steps.push({
    type: "done",
    piles, binary,
    nimSum,
    nimSumBinary: toBin(nimSum, width),
    currentPile: -1,
    moveFromPile: -1,
    moveToValue: -1,
    description: "解析完了",
  });

  return steps;
}

function parsePiles(s: string): number[] {
  return s.split(",").map(Number).filter((n) => !isNaN(n) && n >= 0);
}

export default function NimAnimationPage() {
  const [input, setInput] = useState("3,5,7");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const piles = parsePiles(s);
    if (piles.length === 0) return;
    setSteps(generateSteps(piles));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(input); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 700);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  const maxPile = Math.max(...step.piles, 1);

  return (
    <>
<div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="各山の石数(カンマ区切り)" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        {/* Pile visualization */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">石の山</div>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {step.piles.map((count, i) => {
              const isCurrent = i === step.currentPile;
              const isMove = i === step.moveFromPile;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="flex flex-col-reverse items-center gap-0.5">
                    {Array.from({ length: maxPile }, (_, j) => (
                      <div
                        key={j}
                        className={`w-8 h-3 rounded-sm border transition-colors ${
                          j < count
                            ? isMove && j >= (step.moveToValue ?? count)
                              ? "bg-red-100 border-red-500"
                              : isCurrent
                              ? "bg-blue-100 border-blue-400"
                              : "bg-amber-50 border-amber-400"
                            : "bg-gray-50 border-gray-100"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs font-mono mt-1">{count}</div>
                  <div className="text-[10px] text-muted-foreground">山{i}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Binary / XOR table */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">2進数表現とXOR</div>
          <div className="font-mono text-sm space-y-1">
            {step.piles.map((_, i) => (
              <div key={i} className={`flex gap-2 ${i === step.currentPile ? "text-blue-600 font-bold" : ""}`}>
                <span className="w-12 text-right text-muted-foreground">山{i}:</span>
                <span>{step.binary[i]}</span>
                <span className="text-muted-foreground">({step.piles[i]})</span>
              </div>
            ))}
            <div className="border-t border-border pt-1 flex gap-2 font-bold">
              <span className="w-12 text-right text-muted-foreground">XOR:</span>
              <span className={step.nimSum === 0 ? "text-red-600" : "text-emerald-600"}>
                {step.nimSumBinary}
              </span>
              <span className="text-muted-foreground">({step.nimSum})</span>
            </div>
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Nim和: {step.nimSum}</span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>現在の山</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>石</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>先手必勝</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>取る石 / 後手必勝</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((p) => !p)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
    </>
  );
}
