"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "digit-start" | "distribute" | "collect" | "done";

interface Step {
  type: StepType;
  array: number[];
  digitPlace: number;
  buckets?: number[][];
  highlightIdx?: number;
  highlightBucket?: number;
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  let a = [...arr];
  const maxVal = Math.max(...a);
  const maxDigits = maxVal === 0 ? 1 : Math.floor(Math.log10(maxVal)) + 1;

  steps.push({
    type: "init",
    array: [...a],
    digitPlace: 0,
    description: `配列 [${a.join(", ")}] を基数ソートで整列します (最大桁数: ${maxDigits})`,
  });

  for (let d = 0; d < maxDigits; d++) {
    const exp = Math.pow(10, d);
    const digitName = d === 0 ? "1の位" : d === 1 ? "10の位" : d === 2 ? "100の位" : `${exp}の位`;

    steps.push({
      type: "digit-start",
      array: [...a],
      digitPlace: d,
      description: `${digitName} でソート開始`,
    });

    const buckets: number[][] = Array.from({ length: 10 }, () => []);

    for (let i = 0; i < a.length; i++) {
      const digit = Math.floor(a[i] / exp) % 10;
      buckets[digit].push(a[i]);

      steps.push({
        type: "distribute",
        array: [...a],
        digitPlace: d,
        buckets: buckets.map((b) => [...b]),
        highlightIdx: i,
        highlightBucket: digit,
        description: `a[${i}] = ${a[i]} (${digitName}: ${digit}) をバケット ${digit} に配置`,
      });
    }

    // Collect from buckets
    a = buckets.flat();
    steps.push({
      type: "collect",
      array: [...a],
      digitPlace: d,
      buckets: buckets.map((b) => [...b]),
      description: `バケットから回収: [${a.join(", ")}]`,
    });
  }

  steps.push({
    type: "done",
    array: [...a],
    digitPlace: maxDigits,
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

export default function RadixSortAnimationPage() {
  const [input, setInput] = useState("170, 45, 75, 90, 802, 24, 2, 66");
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Radix Sort</h1>
        <p className="text-sm text-muted-foreground mb-6">
          桁ごとに安定ソートを適用して整列する非比較ベースのソートアルゴリズム
        </p>

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

        {/* Main array */}
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
        {step.buckets && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">バケット (0-9)</div>
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
      </div>
    </div>
  );
}
