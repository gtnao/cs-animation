"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "cycle-start" | "count-pos" | "skip" | "place" | "cycle-complete" | "done";

interface Step {
  type: StepType;
  array: number[];
  cycleStart?: number;
  targetPos?: number;
  item?: number;
  sortedIndices: number[];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const a = [...arr];
  const n = a.length;
  const sorted: Set<number> = new Set();

  steps.push({
    type: "init",
    array: [...a],
    sortedIndices: [],
    description: `配列 [${a.join(", ")}] をサイクルソートで整列します`,
  });

  for (let cycleStart = 0; cycleStart < n - 1; cycleStart++) {
    let item = a[cycleStart];

    // Count elements smaller than item
    let pos = cycleStart;
    for (let i = cycleStart + 1; i < n; i++) {
      if (a[i] < item) pos++;
    }

    steps.push({
      type: "count-pos",
      array: [...a],
      cycleStart,
      targetPos: pos,
      item,
      sortedIndices: [...sorted],
      description: `a[${cycleStart}] = ${item} の正しい位置を計算: 位置 ${pos}`,
    });

    // Skip if already in place
    if (pos === cycleStart) {
      sorted.add(cycleStart);
      steps.push({
        type: "skip",
        array: [...a],
        cycleStart,
        sortedIndices: [...sorted],
        description: `a[${cycleStart}] = ${item} は既に正しい位置`,
      });
      continue;
    }

    // Skip duplicates
    while (item === a[pos]) pos++;

    // Place item
    if (pos !== cycleStart) {
      const temp = a[pos];
      a[pos] = item;
      item = temp;
      sorted.add(pos);

      steps.push({
        type: "place",
        array: [...a],
        cycleStart,
        targetPos: pos,
        item,
        sortedIndices: [...sorted],
        description: `${a[pos]} を位置 ${pos} に配置、${item} を取り出す`,
      });
    }

    // Rotate the rest of the cycle
    while (pos !== cycleStart) {
      pos = cycleStart;
      for (let i = cycleStart + 1; i < n; i++) {
        if (a[i] < item) pos++;
      }

      while (item === a[pos]) pos++;

      if (item !== a[pos]) {
        const temp = a[pos];
        a[pos] = item;
        item = temp;
        sorted.add(pos);

        steps.push({
          type: "place",
          array: [...a],
          cycleStart,
          targetPos: pos,
          item,
          sortedIndices: [...sorted],
          description: `${a[pos]} を位置 ${pos} に配置、${item} を取り出す`,
        });
      }
    }

    sorted.add(cycleStart);
    steps.push({
      type: "cycle-complete",
      array: [...a],
      cycleStart,
      sortedIndices: [...sorted],
      description: `サイクル (開始: 位置 ${cycleStart}) 完了`,
    });
  }

  sorted.add(n - 1);
  steps.push({
    type: "done",
    array: [...a],
    sortedIndices: Array.from({ length: n }, (_, i) => i),
    description: "ソート完了",
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step): string {
  const base =
    "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono font-bold transition-colors";

  if (step.type === "done") return `${base} bg-emerald-100 border-emerald-500`;

  if (idx === step.targetPos && (step.type === "count-pos" || step.type === "place")) {
    return `${base} bg-red-100 border-red-500`;
  }

  if (idx === step.cycleStart) {
    return `${base} bg-blue-100 border-blue-400`;
  }

  if (step.sortedIndices.includes(idx)) {
    return `${base} bg-emerald-100 border-emerald-500`;
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

export default function CycleSortAnimationPage() {
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Cycle Sort</h1>
        <p className="text-sm text-muted-foreground mb-6">
          書き込み回数を最小化するin-placeソートアルゴリズム
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

        {step.item !== undefined && step.type !== "done" && step.type !== "init" && step.type !== "skip" && step.type !== "cycle-complete" && (
          <div className="mb-4 text-sm text-muted-foreground">
            持っている値: <span className="font-mono font-semibold text-foreground">{step.item}</span>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>サイクル開始位置</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>配置先</span>
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
