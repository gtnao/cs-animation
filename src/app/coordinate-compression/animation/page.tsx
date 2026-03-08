"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType =
  | "init"
  | "sort"
  | "deduplicate"
  | "assign"
  | "map"
  | "done";

interface Step {
  type: StepType;
  original: number[];
  sorted: number[];
  unique: number[];
  compressed: number[];
  currentIndex: number;
  highlightOriginal: number;
  highlightUnique: number;
  description: string;
}

function generateSteps(input: number[]): Step[] {
  const steps: Step[] = [];
  const n = input.length;
  if (n === 0) return [];

  const compressed = new Array(n).fill(-1);

  steps.push({
    type: "init",
    original: [...input],
    sorted: [],
    unique: [],
    compressed: [...compressed],
    currentIndex: -1,
    highlightOriginal: -1,
    highlightUnique: -1,
    description: `入力配列: [${input.join(", ")}]。座標圧縮を開始`,
  });

  const sorted = [...input].sort((a, b) => a - b);
  steps.push({
    type: "sort",
    original: [...input],
    sorted: [...sorted],
    unique: [],
    compressed: [...compressed],
    currentIndex: -1,
    highlightOriginal: -1,
    highlightUnique: -1,
    description: `ソート結果: [${sorted.join(", ")}]`,
  });

  const unique: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || sorted[i] !== sorted[i - 1]) {
      unique.push(sorted[i]);
    }
  }
  steps.push({
    type: "deduplicate",
    original: [...input],
    sorted: [...sorted],
    unique: [...unique],
    compressed: [...compressed],
    currentIndex: -1,
    highlightOriginal: -1,
    highlightUnique: -1,
    description: `重複除去: [${unique.join(", ")}] (${unique.length}個の異なる値)`,
  });

  for (let i = 0; i < n; i++) {
    const rank = unique.indexOf(input[i]);
    compressed[i] = rank;
    steps.push({
      type: "assign",
      original: [...input],
      sorted: [...sorted],
      unique: [...unique],
      compressed: [...compressed],
      currentIndex: i,
      highlightOriginal: i,
      highlightUnique: rank,
      description: `A[${i}] = ${input[i]} → ランク ${rank} (unique配列の位置${rank})`,
    });
  }

  steps.push({
    type: "done",
    original: [...input],
    sorted: [...sorted],
    unique: [...unique],
    compressed: [...compressed],
    currentIndex: -1,
    highlightOriginal: -1,
    highlightUnique: -1,
    description: `座標圧縮完了: [${compressed.join(", ")}]`,
  });

  return steps;
}

function getCellClass(
  idx: number,
  step: Step,
  arrayType: "original" | "unique" | "compressed"
): string {
  const base =
    "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (arrayType === "original" && idx === step.highlightOriginal) {
    return `${base} bg-blue-100 border-blue-400`;
  }
  if (arrayType === "unique" && idx === step.highlightUnique) {
    return `${base} bg-emerald-100 border-emerald-500`;
  }
  if (arrayType === "compressed" && idx === step.highlightOriginal && step.type === "assign") {
    return `${base} bg-blue-100 border-blue-400 font-bold`;
  }

  return `${base} bg-white border-gray-200`;
}

export default function CoordinateCompressionAnimationPage() {
  const [input, setInput] = useState("30 10 50 10 40");
  const [data, setData] = useState<number[]>([30, 10, 50, 10, 40]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const nums = s
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((x) => !isNaN(x));
    if (nums.length === 0) return;
    setData(nums);
    setSteps(generateSteps(nums));
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
<div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="スペース区切りで数値を入力"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* Original array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            元の配列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.original.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step, "original")}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unique array */}
        {step.unique.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              ソート済み重複除去配列
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {step.unique.map((val, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={getCellClass(idx, step, "unique")}>{val}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {idx}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compressed array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            圧縮後の配列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.compressed.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step, "compressed")}>
                  {val >= 0 ? val : "–"}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {idx}
                </div>
              </div>
            ))}
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>現在の要素</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>対応するランク</span>
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
