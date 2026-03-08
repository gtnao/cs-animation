"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "split" | "compare" | "pick-left" | "pick-right" | "merge-complete" | "done";

interface Step {
  type: StepType;
  array: number[];
  left?: number[];
  right?: number[];
  merged?: number[];
  rangeStart: number;
  rangeEnd: number;
  leftIdx?: number;
  rightIdx?: number;
  mergedHighlight?: number[];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const a = [...arr];

  steps.push({
    type: "init",
    array: [...a],
    rangeStart: 0,
    rangeEnd: a.length,
    description: `配列 [${a.join(", ")}] をマージソートで整列します`,
  });

  function mergeSort(arr: number[], start: number): number[] {
    if (arr.length <= 1) return arr;

    const mid = Math.floor(arr.length / 2);
    const leftArr = arr.slice(0, mid);
    const rightArr = arr.slice(mid);

    steps.push({
      type: "split",
      array: [...a],
      left: [...leftArr],
      right: [...rightArr],
      rangeStart: start,
      rangeEnd: start + arr.length,
      description: `[${arr.join(", ")}] を [${leftArr.join(", ")}] と [${rightArr.join(", ")}] に分割`,
    });

    const sortedLeft = mergeSort(leftArr, start);
    const sortedRight = mergeSort(rightArr, start + mid);

    // Merge
    const result: number[] = [];
    let li = 0, ri = 0;

    while (li < sortedLeft.length && ri < sortedRight.length) {
      steps.push({
        type: "compare",
        array: [...a],
        left: [...sortedLeft],
        right: [...sortedRight],
        merged: [...result],
        rangeStart: start,
        rangeEnd: start + arr.length,
        leftIdx: li,
        rightIdx: ri,
        description: `左[${li}] = ${sortedLeft[li]} と 右[${ri}] = ${sortedRight[ri]} を比較`,
      });

      if (sortedLeft[li] <= sortedRight[ri]) {
        result.push(sortedLeft[li]);
        steps.push({
          type: "pick-left",
          array: [...a],
          left: [...sortedLeft],
          right: [...sortedRight],
          merged: [...result],
          rangeStart: start,
          rangeEnd: start + arr.length,
          leftIdx: li,
          rightIdx: ri,
          description: `左[${li}] = ${sortedLeft[li]} を選択`,
        });
        li++;
      } else {
        result.push(sortedRight[ri]);
        steps.push({
          type: "pick-right",
          array: [...a],
          left: [...sortedLeft],
          right: [...sortedRight],
          merged: [...result],
          rangeStart: start,
          rangeEnd: start + arr.length,
          leftIdx: li,
          rightIdx: ri,
          description: `右[${ri}] = ${sortedRight[ri]} を選択`,
        });
        ri++;
      }
    }

    while (li < sortedLeft.length) {
      result.push(sortedLeft[li]);
      li++;
    }
    while (ri < sortedRight.length) {
      result.push(sortedRight[ri]);
      ri++;
    }

    // Update the main array
    for (let k = 0; k < result.length; k++) {
      a[start + k] = result[k];
    }

    steps.push({
      type: "merge-complete",
      array: [...a],
      merged: [...result],
      rangeStart: start,
      rangeEnd: start + arr.length,
      mergedHighlight: Array.from({ length: result.length }, (_, i) => start + i),
      description: `マージ完了: [${result.join(", ")}]`,
    });

    return result;
  }

  mergeSort(a, 0);

  steps.push({
    type: "done",
    array: [...a],
    rangeStart: 0,
    rangeEnd: a.length,
    description: "ソート完了",
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step): string {
  const base =
    "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono font-bold transition-colors";

  if (step.type === "done") {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

  if (step.mergedHighlight?.includes(idx)) {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

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

export default function MergeSortAnimationPage() {
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

        {/* Main array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            配列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.array.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step)}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-arrays during merge */}
        {(step.type === "compare" || step.type === "pick-left" || step.type === "pick-right") && step.left && step.right && (
          <div className="mb-6 flex gap-8">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">左</div>
              <div className="flex gap-1">
                {step.left.map((val, idx) => (
                  <div key={idx} className={`w-10 h-10 flex items-center justify-center border-2 text-xs font-mono font-bold ${idx === step.leftIdx ? "bg-blue-100 border-blue-400" : "bg-white border-gray-200"}`}>
                    {val}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">右</div>
              <div className="flex gap-1">
                {step.right.map((val, idx) => (
                  <div key={idx} className={`w-10 h-10 flex items-center justify-center border-2 text-xs font-mono font-bold ${idx === step.rightIdx ? "bg-blue-100 border-blue-400" : "bg-white border-gray-200"}`}>
                    {val}
                  </div>
                ))}
              </div>
            </div>
            {step.merged && step.merged.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">マージ結果</div>
                <div className="flex gap-1">
                  {step.merged.map((val, idx) => (
                    <div key={idx} className="w-10 h-10 flex items-center justify-center border-2 text-xs font-mono font-bold bg-emerald-100 border-emerald-500">
                      {val}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
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
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>処理中の区間</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>マージ完了</span>
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
