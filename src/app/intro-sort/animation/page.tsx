"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "quicksort-pivot" | "quicksort-partition" | "quicksort-swap" | "heapsort-switch" | "heapsort-step" | "insertion-sort" | "done";

interface Step {
  type: StepType;
  array: number[];
  rangeStart: number;
  rangeEnd: number;
  highlightIndices?: number[];
  pivotIdx?: number;
  sortedIndices: number[];
  algorithm: "quick" | "heap" | "insertion" | "none";
  description: string;
}

const SIZE_THRESHOLD = 16;

// --- Algorithm step generation ---

function generateSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const a = [...arr];
  const n = a.length;
  const maxDepth = 2 * Math.floor(Math.log2(n));
  const sorted: Set<number> = new Set();

  steps.push({
    type: "init",
    array: [...a],
    rangeStart: 0,
    rangeEnd: n,
    sortedIndices: [],
    algorithm: "none",
    description: `配列 [${a.join(", ")}] を Intro Sort で整列します (深さ上限: ${maxDepth})`,
  });

  function introSort(lo: number, hi: number, depth: number) {
    const size = hi - lo + 1;
    if (size <= 1) {
      if (size === 1) sorted.add(lo);
      return;
    }

    if (size <= SIZE_THRESHOLD) {
      // Insertion sort
      steps.push({
        type: "insertion-sort",
        array: [...a],
        rangeStart: lo,
        rangeEnd: hi + 1,
        sortedIndices: [...sorted],
        algorithm: "insertion",
        description: `区間 [${lo}, ${hi}] は小さいので挿入ソートを使用`,
      });

      for (let i = lo + 1; i <= hi; i++) {
        const key = a[i];
        let j = i - 1;
        while (j >= lo && a[j] > key) {
          a[j + 1] = a[j];
          j--;
        }
        a[j + 1] = key;
      }

      for (let i = lo; i <= hi; i++) sorted.add(i);

      steps.push({
        type: "insertion-sort",
        array: [...a],
        rangeStart: lo,
        rangeEnd: hi + 1,
        sortedIndices: [...sorted],
        algorithm: "insertion",
        description: `挿入ソート完了: [${a.slice(lo, hi + 1).join(", ")}]`,
      });
      return;
    }

    if (depth === 0) {
      // Heap sort fallback
      steps.push({
        type: "heapsort-switch",
        array: [...a],
        rangeStart: lo,
        rangeEnd: hi + 1,
        sortedIndices: [...sorted],
        algorithm: "heap",
        description: `深さ上限到達 - ヒープソートにフォールバック (区間 [${lo}, ${hi}])`,
      });

      heapSort(lo, hi);

      for (let i = lo; i <= hi; i++) sorted.add(i);

      steps.push({
        type: "heapsort-step",
        array: [...a],
        rangeStart: lo,
        rangeEnd: hi + 1,
        sortedIndices: [...sorted],
        algorithm: "heap",
        description: `ヒープソート完了: [${a.slice(lo, hi + 1).join(", ")}]`,
      });
      return;
    }

    // Quick sort with median-of-three
    const pivotVal = medianOfThree(lo, hi);
    steps.push({
      type: "quicksort-pivot",
      array: [...a],
      rangeStart: lo,
      rangeEnd: hi + 1,
      pivotIdx: hi,
      sortedIndices: [...sorted],
      algorithm: "quick",
      description: `ピボット = ${pivotVal} (三要素の中央値) を選択`,
    });

    // Partition
    let storeIdx = lo;
    for (let j = lo; j < hi; j++) {
      if (a[j] <= pivotVal) {
        if (j !== storeIdx) {
          [a[storeIdx], a[j]] = [a[j], a[storeIdx]];
        }
        storeIdx++;
      }
    }
    [a[storeIdx], a[hi]] = [a[hi], a[storeIdx]];
    sorted.add(storeIdx);

    steps.push({
      type: "quicksort-partition",
      array: [...a],
      rangeStart: lo,
      rangeEnd: hi + 1,
      pivotIdx: storeIdx,
      sortedIndices: [...sorted],
      algorithm: "quick",
      description: `パーティション完了: ピボット ${pivotVal} を位置 ${storeIdx} に配置`,
    });

    introSort(lo, storeIdx - 1, depth - 1);
    introSort(storeIdx + 1, hi, depth - 1);
  }

  function medianOfThree(lo: number, hi: number): number {
    const mid = Math.floor((lo + hi) / 2);
    if (a[lo] > a[mid]) [a[lo], a[mid]] = [a[mid], a[lo]];
    if (a[lo] > a[hi]) [a[lo], a[hi]] = [a[hi], a[lo]];
    if (a[mid] > a[hi]) [a[mid], a[hi]] = [a[hi], a[mid]];
    [a[mid], a[hi]] = [a[hi], a[mid]];
    return a[hi];
  }

  function heapSort(lo: number, hi: number) {
    const size = hi - lo + 1;

    function siftDown(n: number, i: number) {
      let largest = i;
      const left = 2 * (i - lo) + 1 + lo;
      const right = 2 * (i - lo) + 2 + lo;
      if (left < lo + n && a[left] > a[largest]) largest = left;
      if (right < lo + n && a[right] > a[largest]) largest = right;
      if (largest !== i) {
        [a[i], a[largest]] = [a[largest], a[i]];
        siftDown(n, largest);
      }
    }

    for (let i = lo + Math.floor(size / 2) - 1; i >= lo; i--) {
      siftDown(size, i);
    }
    for (let i = hi; i > lo; i--) {
      [a[lo], a[i]] = [a[i], a[lo]];
      siftDown(i - lo, lo);
    }
  }

  introSort(0, n - 1, maxDepth);

  steps.push({
    type: "done",
    array: [...a],
    rangeStart: 0,
    rangeEnd: n,
    sortedIndices: Array.from({ length: n }, (_, i) => i),
    algorithm: "none",
    description: "ソート完了",
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step): string {
  const base =
    "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono font-bold transition-colors";

  if (step.type === "done") return `${base} bg-emerald-100 border-emerald-500`;

  if (idx === step.pivotIdx) return `${base} bg-blue-100 border-blue-400`;

  if (step.sortedIndices.includes(idx)) return `${base} bg-emerald-100 border-emerald-500`;

  if (idx >= step.rangeStart && idx < step.rangeEnd) {
    return `${base} bg-amber-50 border-amber-400`;
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

export default function IntroSortAnimationPage() {
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

  const algoLabel = step.algorithm === "quick" ? "Quick Sort" : step.algorithm === "heap" ? "Heap Sort" : step.algorithm === "insertion" ? "Insertion Sort" : "";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Intro Sort</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Quick Sort・Heap Sort・Insertion Sort を組み合わせたハイブリッドソートアルゴリズム
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

        {algoLabel && (
          <div className="mb-2 text-sm text-muted-foreground">
            使用中のアルゴリズム: <span className="font-semibold text-foreground">{algoLabel}</span>
          </div>
        )}

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
            <span>ピボット</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>処理中の区間</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>ソート済み</span>
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
