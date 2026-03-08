"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "compare" | "swap" | "no-swap" | "done";

interface Step {
  type: StepType;
  array: number[];
  comparing?: [number, number];
  direction?: "asc" | "desc";
  stageSize?: number;
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(arr: number[]): Step[] {
  // Pad to next power of 2
  let n = 1;
  while (n < arr.length) n *= 2;
  const a = [...arr];
  while (a.length < n) a.push(Infinity);

  const steps: Step[] = [];
  const originalLength = arr.length;

  steps.push({
    type: "init",
    array: a.slice(0, originalLength),
    description: `配列 [${arr.join(", ")}] をバイトニックソートで整列します (配列長を ${n} にパディング)`,
  });

  function bitonicSort(lo: number, cnt: number, dir: boolean) {
    if (cnt <= 1) return;
    const k = Math.floor(cnt / 2);

    // Sort first half ascending, second half descending
    bitonicSort(lo, k, true);
    bitonicSort(lo + k, k, false);

    // Merge
    bitonicMerge(lo, cnt, dir);
  }

  function bitonicMerge(lo: number, cnt: number, dir: boolean) {
    if (cnt <= 1) return;
    const k = Math.floor(cnt / 2);

    for (let i = lo; i < lo + k; i++) {
      const shouldSwap = dir ? a[i] > a[i + k] : a[i] < a[i + k];

      if (i < originalLength && i + k < originalLength) {
        steps.push({
          type: "compare",
          array: a.slice(0, originalLength),
          comparing: [i, i + k],
          direction: dir ? "asc" : "desc",
          stageSize: cnt,
          description: `a[${i}] = ${a[i]} と a[${i + k}] = ${a[i + k]} を比較 (${dir ? "昇順" : "降順"})`,
        });
      }

      if (shouldSwap) {
        [a[i], a[i + k]] = [a[i + k], a[i]];

        if (i < originalLength && i + k < originalLength) {
          steps.push({
            type: "swap",
            array: a.slice(0, originalLength),
            comparing: [i, i + k],
            description: `a[${i}] と a[${i + k}] を交換`,
          });
        }
      } else if (i < originalLength && i + k < originalLength) {
        steps.push({
          type: "no-swap",
          array: a.slice(0, originalLength),
          comparing: [i, i + k],
          description: `交換不要`,
        });
      }
    }

    bitonicMerge(lo, k, dir);
    bitonicMerge(lo + k, k, dir);
  }

  bitonicSort(0, n, true);

  steps.push({
    type: "done",
    array: a.slice(0, originalLength),
    description: "ソート完了",
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step): string {
  const base =
    "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono font-bold transition-colors";

  if (step.type === "done") return `${base} bg-emerald-100 border-emerald-500`;

  if (step.comparing) {
    if (idx === step.comparing[0] || idx === step.comparing[1]) {
      if (step.type === "swap") return `${base} bg-red-100 border-red-500`;
      if (step.type === "no-swap") return `${base} bg-emerald-100 border-emerald-500`;
      return `${base} bg-blue-100 border-blue-400`;
    }
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

function parseInput(s: string): number[] {
  return s
    .split(/[\s,]+/)
    .map((x) => parseInt(x, 10))
    .filter((x) => !isNaN(x));
}

export default function BitonicSortAnimationPage() {
  const [input, setInput] = useState("5, 3, 8, 1, 2, 7, 4, 6");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const arr = parseInput(s);
    if (arr.length === 0) return;
    setSteps(generateSteps(arr));
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
    }, 400);
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Bitonic Sort</h1>
        <p className="text-sm text-muted-foreground mb-6">
          バイトニック列を利用した並列ソートに適したソートアルゴリズム
        </p>

        <div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="カンマ区切りで数値を入力"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">配列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.array.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step)}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>比較中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>交換</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>交換不要 / ソート完了</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
      </div>
    </div>
  );
}
