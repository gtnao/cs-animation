"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "run-start" | "insertion" | "run-complete" | "merge-start" | "merge-pick" | "merge-complete" | "done";

interface Step {
  type: StepType;
  array: number[];
  runStart?: number;
  runEnd?: number;
  mergeLeft?: [number, number];
  mergeRight?: [number, number];
  highlightIdx?: number;
  description: string;
}

const MIN_RUN = 4;

// --- Algorithm step generation ---

function generateSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const a = [...arr];
  const n = a.length;

  steps.push({
    type: "init",
    array: [...a],
    description: `配列 [${a.join(", ")}] を Tim Sort で整列します (minRun = ${MIN_RUN})`,
  });

  // Phase 1: Create runs using insertion sort
  const runs: [number, number][] = [];

  for (let start = 0; start < n; start += MIN_RUN) {
    const end = Math.min(start + MIN_RUN, n);

    steps.push({
      type: "run-start",
      array: [...a],
      runStart: start,
      runEnd: end,
      description: `Run [${start}, ${end}) を挿入ソートで整列`,
    });

    // Insertion sort on the run
    for (let i = start + 1; i < end; i++) {
      const key = a[i];
      let j = i - 1;
      while (j >= start && a[j] > key) {
        a[j + 1] = a[j];
        j--;
      }
      a[j + 1] = key;

      steps.push({
        type: "insertion",
        array: [...a],
        runStart: start,
        runEnd: end,
        highlightIdx: j + 1,
        description: `${key} を位置 ${j + 1} に挿入`,
      });
    }

    runs.push([start, end]);

    steps.push({
      type: "run-complete",
      array: [...a],
      runStart: start,
      runEnd: end,
      description: `Run [${start}, ${end}) 完了: [${a.slice(start, end).join(", ")}]`,
    });
  }

  // Phase 2: Merge runs
  let size = MIN_RUN;
  while (size < n) {
    for (let left = 0; left < n; left += 2 * size) {
      const mid = Math.min(left + size, n);
      const right = Math.min(left + 2 * size, n);

      if (mid < right) {
        steps.push({
          type: "merge-start",
          array: [...a],
          mergeLeft: [left, mid],
          mergeRight: [mid, right],
          description: `[${left}, ${mid}) と [${mid}, ${right}) をマージ`,
        });

        // Merge
        const leftArr = a.slice(left, mid);
        const rightArr = a.slice(mid, right);
        let li = 0, ri = 0, k = left;

        while (li < leftArr.length && ri < rightArr.length) {
          if (leftArr[li] <= rightArr[ri]) {
            a[k] = leftArr[li];
            li++;
          } else {
            a[k] = rightArr[ri];
            ri++;
          }

          steps.push({
            type: "merge-pick",
            array: [...a],
            mergeLeft: [left, mid],
            mergeRight: [mid, right],
            highlightIdx: k,
            description: `位置 ${k} に ${a[k]} を配置`,
          });
          k++;
        }

        while (li < leftArr.length) {
          a[k] = leftArr[li];
          li++;
          k++;
        }
        while (ri < rightArr.length) {
          a[k] = rightArr[ri];
          ri++;
          k++;
        }

        steps.push({
          type: "merge-complete",
          array: [...a],
          mergeLeft: [left, right],
          description: `マージ完了: [${a.slice(left, right).join(", ")}]`,
        });
      }
    }
    size *= 2;
  }

  steps.push({
    type: "done",
    array: [...a],
    description: "ソート完了",
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step): string {
  const base =
    "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono font-bold transition-colors";

  if (step.type === "done") return `${base} bg-emerald-100 border-emerald-500`;

  if (idx === step.highlightIdx) {
    if (step.type === "merge-pick") return `${base} bg-emerald-100 border-emerald-500`;
    return `${base} bg-blue-100 border-blue-400`;
  }

  if (step.runStart !== undefined && step.runEnd !== undefined) {
    if (idx >= step.runStart && idx < step.runEnd) {
      return `${base} bg-amber-50 border-amber-400`;
    }
  }

  if (step.mergeLeft && step.mergeRight) {
    if (idx >= step.mergeLeft[0] && idx < step.mergeLeft[1]) {
      return `${base} bg-amber-50 border-amber-400`;
    }
    if (idx >= step.mergeRight[0] && idx < step.mergeRight[1]) {
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

export default function TimSortAnimationPage() {
  const [input, setInput] = useState("9, 3, 7, 1, 5, 8, 2, 4, 6, 10, 12, 11");
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

  return (
    <>
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
            <span>現在の要素</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>Run / マージ区間</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>配置済み / ソート完了</span>
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
    </>
  );
}
