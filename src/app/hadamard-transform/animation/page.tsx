"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "stage_start" | "butterfly" | "stage_done" | "done";

interface Step {
  type: StepType;
  array: number[];
  n: number;
  stage: number;
  totalStages: number;
  i?: number;
  j?: number;
  inverse: boolean;
  description: string;
}

// --- Helpers ---

function binaryStr(x: number, bits: number): string {
  return x.toString(2).padStart(bits, "0");
}

// --- Algorithm step generation ---

function generateSteps(values: number[], inverse: boolean): Step[] {
  const steps: Step[] = [];
  let n = values.length;
  const bits = Math.round(Math.log2(n));

  if ((1 << bits) !== n) {
    // Pad to next power of 2
    n = 1 << (bits + 1);
  }

  const a = new Array(n).fill(0);
  for (let i = 0; i < values.length; i++) a[i] = values[i];

  const totalStages = Math.log2(n);

  steps.push({
    type: "init",
    array: [...a],
    n,
    stage: 0,
    totalStages,
    inverse,
    description: `Walsh-Hadamard変換${inverse ? " (逆変換)" : ""}: [${a.join(", ")}]`,
  });

  // In-place Walsh-Hadamard Transform
  for (let len = 1; len < n; len <<= 1) {
    const stage = Math.log2(len) + 1;

    steps.push({
      type: "stage_start",
      array: [...a],
      n,
      stage,
      totalStages,
      inverse,
      description: `ステージ ${stage}: ブロックサイズ = ${len * 2}`,
    });

    for (let i = 0; i < n; i += len * 2) {
      for (let j = 0; j < len; j++) {
        const u = a[i + j];
        const v = a[i + j + len];
        a[i + j] = u + v;
        a[i + j + len] = u - v;

        steps.push({
          type: "butterfly",
          array: [...a],
          n,
          stage,
          totalStages,
          i: i + j,
          j: i + j + len,
          inverse,
          description: `バタフライ: a[${i + j}] = ${u} + ${v} = ${a[i + j]}, a[${i + j + len}] = ${u} - ${v} = ${a[i + j + len]}`,
        });
      }
    }

    steps.push({
      type: "stage_done",
      array: [...a],
      n,
      stage,
      totalStages,
      inverse,
      description: `ステージ ${stage} 完了`,
    });
  }

  // If inverse, divide by n
  if (inverse) {
    for (let i = 0; i < n; i++) {
      a[i] /= n;
    }
  }

  steps.push({
    type: "done",
    array: [...a],
    n,
    stage: totalStages,
    totalStages,
    inverse,
    description: `Hadamard変換${inverse ? " (逆)" : ""}完了: [${a.map((x) => (Number.isInteger(x) ? x : x.toFixed(2))).join(", ")}]`,
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step): string {
  const base =
    "min-w-[3rem] h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors px-1";

  if (step.type === "butterfly") {
    if (idx === step.i || idx === step.j) {
      return `${base} bg-blue-100 border-blue-400`;
    }
  }

  if (step.type === "stage_start" || step.type === "stage_done") {
    return `${base} bg-amber-50 border-amber-400`;
  }

  if (step.type === "done") {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function HadamardTransformAnimationPage() {
  const [input, setInput] = useState("1,2,3,4,5,6,7,8");
  const [inverse, setInverse] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string, inv: boolean) => {
    const vals = s
      .split(",")
      .map((x) => parseFloat(x.trim()))
      .filter((x) => !isNaN(x));
    if (vals.length === 0) return;
    // Pad to next power of 2
    let len = 1;
    while (len < vals.length) len <<= 1;
    while (vals.length < len) vals.push(0);
    setSteps(generateSteps(vals, inv));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(input, inverse);
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

  const bits = Math.log2(step.n);

  return (
    <>
<div className="flex flex-wrap gap-2 mb-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input, inverse);
            }}
            placeholder="値 (2^n 個)"
            className="font-mono max-w-xs"
          />
          <Button
            onClick={() => {
              const newInv = !inverse;
              setInverse(newInv);
              run(input, newInv);
            }}
            variant="outline"
          >
            {inverse ? "逆変換" : "順変換"}
          </Button>
          <Button onClick={() => run(input, inverse)} variant="outline">
            実行
          </Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            配列 (ステージ {step.stage}/{step.totalStages})
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.array.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step)}>
                  {Number.isInteger(val) ? val : val.toFixed(2)}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {binaryStr(idx, bits)}
                </div>
              </div>
            ))}
          </div>
        </div>

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

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>バタフライ対象</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>注目ステージ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>完了</span>
          </div>
        </div>

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
