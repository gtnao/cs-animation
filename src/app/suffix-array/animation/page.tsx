"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "sort_step" | "compare" | "done";

interface Step {
  type: StepType;
  sa: number[];
  suffixes: string[];
  k: number;
  compareIndices?: [number, number];
  description: string;
}

// --- Algorithm: naive O(n^2 log n) suffix array for visualization ---

function generateSteps(s: string): Step[] {
  const n = s.length;
  if (n === 0) return [];
  const steps: Step[] = [];

  const suffixes = Array.from({ length: n }, (_, i) => ({
    index: i,
    suffix: s.slice(i),
  }));

  steps.push({
    type: "init",
    sa: suffixes.map((s) => s.index),
    suffixes: suffixes.map((s) => s.suffix),
    k: 0,
    description: `全 ${n} 個の接尾辞を生成。辞書順にソートする`,
  });

  // Simple insertion sort for visualization
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0 && suffixes[j].suffix < suffixes[j - 1].suffix) {
      steps.push({
        type: "compare",
        sa: suffixes.map((s) => s.index),
        suffixes: suffixes.map((s) => s.suffix),
        k: i,
        compareIndices: [j - 1, j],
        description: `"${suffixes[j - 1].suffix.slice(0, 8)}${suffixes[j - 1].suffix.length > 8 ? "..." : ""}" > "${suffixes[j].suffix.slice(0, 8)}${suffixes[j].suffix.length > 8 ? "..." : ""}" → 交換`,
      });
      [suffixes[j], suffixes[j - 1]] = [suffixes[j - 1], suffixes[j]];
      j--;
    }
    if (j > 0) {
      steps.push({
        type: "sort_step",
        sa: suffixes.map((s) => s.index),
        suffixes: suffixes.map((s) => s.suffix),
        k: i,
        compareIndices: [j - 1, j],
        description: `"${suffixes[j - 1].suffix.slice(0, 8)}${suffixes[j - 1].suffix.length > 8 ? "..." : ""}" ≤ "${suffixes[j].suffix.slice(0, 8)}${suffixes[j].suffix.length > 8 ? "..." : ""}" → 位置確定`,
      });
    }
  }

  steps.push({
    type: "done",
    sa: suffixes.map((s) => s.index),
    suffixes: suffixes.map((s) => s.suffix),
    k: n,
    description: `Suffix Array 構築完了: SA = [${suffixes.map((s) => s.index).join(", ")}]`,
  });

  return steps;
}

// --- Component ---

export default function SuffixArrayAnimationPage() {
  const [input, setInput] = useState("banana$");
  const [text, setText] = useState("banana$");
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

  useEffect(() => {
    run(input);
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
    }, 500);
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
        <div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="文字列を入力"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* Original string */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            文字列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {text.split("").map((c, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 flex items-center justify-center border-2 text-sm font-mono bg-white border-gray-200">
                  {c}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suffixes being sorted */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            接尾辞 (ソート中)
          </div>
          <div className="space-y-1 overflow-x-auto">
            {step.sa.map((saIdx, rank) => {
              let cls = "px-3 py-1.5 border-2 rounded text-sm font-mono inline-block transition-colors";
              if (step.compareIndices) {
                if (rank === step.compareIndices[0] || rank === step.compareIndices[1]) {
                  cls += step.type === "compare"
                    ? " bg-red-100 border-red-500"
                    : " bg-emerald-100 border-emerald-500";
                } else {
                  cls += " bg-white border-gray-200";
                }
              } else if (step.type === "done") {
                cls += " bg-emerald-100 border-emerald-500";
              } else {
                cls += " bg-white border-gray-200";
              }

              return (
                <div key={rank} className="flex items-center gap-2">
                  <div className="w-8 text-right text-[10px] text-muted-foreground font-mono">
                    {rank}
                  </div>
                  <div className={cls}>
                    <span className="text-muted-foreground mr-2">[{saIdx}]</span>
                    {step.suffixes[rank].length > 20
                      ? step.suffixes[rank].slice(0, 20) + "..."
                      : step.suffixes[rank]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Description */}
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>確定 / 比較OK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>交換</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep((prev) => Math.max(0, prev - 1));
              setIsPlaying(false);
            }}
            disabled={currentStep === 0}
          >
            ← 前へ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
              setIsPlaying(false);
            }}
            disabled={currentStep === steps.length - 1}
          >
            次へ →
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying((prev) => !prev)}
            disabled={currentStep === steps.length - 1}
          >
            {isPlaying ? "停止" : "再生"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep(0);
              setIsPlaying(false);
            }}
          >
            リセット
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
    </>
  );
}
