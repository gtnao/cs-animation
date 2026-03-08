"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "bit_reverse"
  | "butterfly_start"
  | "butterfly_compute"
  | "butterfly_done"
  | "stage_done"
  | "done";

interface Step {
  type: StepType;
  array: { re: number; im: number }[];
  stage: number;
  totalStages: number;
  j?: number;
  k?: number;
  halfLen?: number;
  description: string;
}

// --- Helpers ---

function bitReverse(x: number, bits: number): number {
  let result = 0;
  for (let i = 0; i < bits; i++) {
    result = (result << 1) | (x & 1);
    x >>= 1;
  }
  return result;
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function fmtComplex(c: { re: number; im: number }): string {
  const r = Math.round(c.re * 100) / 100;
  const i = Math.round(c.im * 100) / 100;
  if (i === 0) return `${r}`;
  if (r === 0) return `${i}i`;
  return `${r}${i >= 0 ? "+" : ""}${i}i`;
}

// --- Algorithm step generation ---

function generateSteps(coeffs: number[]): Step[] {
  const steps: Step[] = [];
  const n = nextPow2(coeffs.length);
  const bits = Math.log2(n);
  const a: { re: number; im: number }[] = [];

  for (let i = 0; i < n; i++) {
    a.push({ re: i < coeffs.length ? coeffs[i] : 0, im: 0 });
  }

  steps.push({
    type: "init",
    array: a.map((c) => ({ ...c })),
    stage: 0,
    totalStages: bits,
    description: `入力多項式の係数: [${coeffs.join(", ")}] (長さ ${n} にゼロ埋め)`,
  });

  // Bit-reverse permutation
  const rev: { re: number; im: number }[] = new Array(n);
  for (let i = 0; i < n; i++) {
    rev[bitReverse(i, bits)] = { ...a[i] };
  }
  for (let i = 0; i < n; i++) {
    a[i] = { ...rev[i] };
  }

  steps.push({
    type: "bit_reverse",
    array: a.map((c) => ({ ...c })),
    stage: 0,
    totalStages: bits,
    description: `ビット逆順に並べ替え完了`,
  });

  // Butterfly stages
  for (let s = 1; s <= bits; s++) {
    const halfLen = 1 << (s - 1);
    const len = 1 << s;
    const wBase = (2 * Math.PI) / len;

    steps.push({
      type: "butterfly_start",
      array: a.map((c) => ({ ...c })),
      stage: s,
      totalStages: bits,
      halfLen,
      description: `ステージ ${s}/${bits}: バタフライサイズ = ${len}、半分 = ${halfLen}`,
    });

    for (let j = 0; j < n; j += len) {
      for (let k = 0; k < halfLen; k++) {
        const angle = wBase * k;
        const wRe = Math.cos(angle);
        const wIm = -Math.sin(angle);

        const tRe = wRe * a[j + k + halfLen].re - wIm * a[j + k + halfLen].im;
        const tIm = wRe * a[j + k + halfLen].im + wIm * a[j + k + halfLen].re;

        const uRe = a[j + k].re;
        const uIm = a[j + k].im;

        a[j + k] = { re: uRe + tRe, im: uIm + tIm };
        a[j + k + halfLen] = { re: uRe - tRe, im: uIm - tIm };

        steps.push({
          type: "butterfly_compute",
          array: a.map((c) => ({ ...c })),
          stage: s,
          totalStages: bits,
          j: j + k,
          k: j + k + halfLen,
          halfLen,
          description: `バタフライ: a[${j + k}] と a[${j + k + halfLen}] を回転子 w^${k} で更新`,
        });
      }
    }

    steps.push({
      type: "stage_done",
      array: a.map((c) => ({ ...c })),
      stage: s,
      totalStages: bits,
      description: `ステージ ${s} 完了`,
    });
  }

  steps.push({
    type: "done",
    array: a.map((c) => ({ ...c })),
    stage: bits,
    totalStages: bits,
    description: "FFT 完了 - DFT 結果が得られました",
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step): string {
  const base =
    "min-w-[4.5rem] h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors px-1";

  if (step.type === "butterfly_compute") {
    if (idx === step.j || idx === step.k) {
      return `${base} bg-blue-100 border-blue-400`;
    }
  }

  if (step.type === "butterfly_start" && step.halfLen !== undefined) {
    const len = step.halfLen * 2;
    const block = Math.floor(idx / len);
    if (block % 2 === 0) {
      return `${base} bg-amber-50 border-amber-400`;
    }
  }

  if (step.type === "done") {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function FFTAnimationPage() {
  const [input, setInput] = useState("1,2,3,4");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const coeffs = s
      .split(",")
      .map((x) => parseFloat(x.trim()))
      .filter((x) => !isNaN(x));
    if (coeffs.length === 0) return;
    setSteps(generateSteps(coeffs));
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
        <h1 className="text-2xl font-bold mb-1">FFT (高速フーリエ変換)</h1>
        <p className="text-sm text-muted-foreground mb-6">
          多項式の乗算を O(n log n) で行う分割統治アルゴリズム
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="係数をカンマ区切りで入力 (例: 1,2,3,4)"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* Array visualization */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            配列 (ステージ {step.stage}/{step.totalStages})
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.array.map((c, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step)}>
                  {fmtComplex(c)}
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
            ステージ{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.stage}/{step.totalStages}
            </span>
          </span>
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
            <span>バタフライ対象</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>注目ブロック</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>完了</span>
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
      </div>
    </div>
  );
}
