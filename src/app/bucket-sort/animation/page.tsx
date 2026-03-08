"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "distribute" | "sort-bucket" | "collect" | "done";

interface Step {
  type: StepType;
  array: number[];
  buckets: number[][];
  numBuckets: number;
  highlightIdx?: number;
  highlightBucket?: number;
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const a = [...arr];
  const n = a.length;
  const maxVal = Math.max(...a);
  const numBuckets = Math.max(1, Math.ceil(Math.sqrt(n)));
  const buckets: number[][] = Array.from({ length: numBuckets }, () => []);

  steps.push({
    type: "init",
    array: [...a],
    buckets: buckets.map((b) => [...b]),
    numBuckets,
    description: `配列 [${a.join(", ")}] をバケットソートで整列します (${numBuckets} バケット)`,
  });

  // Distribute
  for (let i = 0; i < n; i++) {
    const bucketIdx = Math.min(Math.floor((a[i] / (maxVal + 1)) * numBuckets), numBuckets - 1);
    buckets[bucketIdx].push(a[i]);

    steps.push({
      type: "distribute",
      array: [...a],
      buckets: buckets.map((b) => [...b]),
      numBuckets,
      highlightIdx: i,
      highlightBucket: bucketIdx,
      description: `a[${i}] = ${a[i]} をバケット ${bucketIdx} に配置`,
    });
  }

  // Sort each bucket
  for (let i = 0; i < numBuckets; i++) {
    if (buckets[i].length > 1) {
      buckets[i].sort((x, y) => x - y);
      steps.push({
        type: "sort-bucket",
        array: [...a],
        buckets: buckets.map((b) => [...b]),
        numBuckets,
        highlightBucket: i,
        description: `バケット ${i} を内部ソート: [${buckets[i].join(", ")}]`,
      });
    }
  }

  // Collect
  const result = buckets.flat();
  steps.push({
    type: "collect",
    array: [...result],
    buckets: buckets.map((b) => [...b]),
    numBuckets,
    description: `全バケットから回収: [${result.join(", ")}]`,
  });

  steps.push({
    type: "done",
    array: [...result],
    buckets: buckets.map((b) => [...b]),
    numBuckets,
    description: "ソート完了",
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step): string {
  const base =
    "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono font-bold transition-colors";
  if (step.type === "done") return `${base} bg-emerald-100 border-emerald-500`;
  if (idx === step.highlightIdx) return `${base} bg-blue-100 border-blue-400`;
  return `${base} bg-white border-gray-200`;
}

// --- Component ---

function parseInput(s: string): number[] {
  return s
    .split(/[\s,]+/)
    .map((x) => parseInt(x, 10))
    .filter((x) => !isNaN(x) && x >= 0);
}

export default function BucketSortAnimationPage() {
  const [input, setInput] = useState("42, 32, 33, 52, 37, 47, 51, 22");
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
            placeholder="カンマ区切りで非負整数を入力"
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

        {/* Buckets */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">バケット</div>
          <div className="space-y-1">
            {step.buckets.map((bucket, bIdx) => (
              <div key={bIdx} className="flex items-center gap-2">
                <div className={`w-8 h-8 flex items-center justify-center text-xs font-mono font-bold border-2 ${bIdx === step.highlightBucket ? "bg-amber-50 border-amber-400" : "bg-white border-gray-200"}`}>
                  {bIdx}
                </div>
                <div className="flex gap-1">
                  {bucket.map((val, vIdx) => (
                    <div key={vIdx} className="w-10 h-8 flex items-center justify-center border-2 text-xs font-mono font-bold bg-amber-50 border-amber-400">
                      {val}
                    </div>
                  ))}
                  {bucket.length === 0 && (
                    <div className="text-xs text-muted-foreground italic">empty</div>
                  )}
                </div>
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
            <span>処理中の要素</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>バケット</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>ソート完了</span>
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
