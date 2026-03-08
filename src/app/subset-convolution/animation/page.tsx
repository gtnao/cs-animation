"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "ranked_start"
  | "ranked_compute"
  | "zeta"
  | "pointwise"
  | "mobius"
  | "extract"
  | "done";

interface Step {
  type: StepType;
  arrayF: number[];
  arrayG: number[];
  result: number[];
  n: number;
  bits: number;
  highlightIdx?: number;
  description: string;
}

// --- Helpers ---

function popcount(x: number): number {
  let count = 0;
  while (x) {
    count += x & 1;
    x >>= 1;
  }
  return count;
}

function binaryStr(x: number, bits: number): string {
  return x.toString(2).padStart(bits, "0");
}

// --- Algorithm step generation ---

function generateSteps(fVals: number[], gVals: number[]): Step[] {
  const steps: Step[] = [];
  const n = fVals.length;
  const bits = Math.round(Math.log2(n));

  if ((1 << bits) !== n) {
    steps.push({
      type: "init",
      arrayF: [...fVals],
      arrayG: [...gVals],
      result: new Array(n).fill(0),
      n,
      bits: 0,
      description: `配列の長さは 2^n の形でなければなりません`,
    });
    return steps;
  }

  steps.push({
    type: "init",
    arrayF: [...fVals],
    arrayG: [...gVals],
    result: new Array(n).fill(0),
    n,
    bits,
    description: `Subset Convolution: f = [${fVals.join(", ")}], g = [${gVals.join(", ")}], ${bits}ビット`,
  });

  // Step 1: Create ranked polynomials
  // fRanked[popcount(S)][S] = f[S], gRanked similarly
  const fRanked: number[][] = Array.from({ length: bits + 1 }, () =>
    new Array(n).fill(0)
  );
  const gRanked: number[][] = Array.from({ length: bits + 1 }, () =>
    new Array(n).fill(0)
  );

  for (let s = 0; s < n; s++) {
    fRanked[popcount(s)][s] = fVals[s];
    gRanked[popcount(s)][s] = gVals[s];
  }

  steps.push({
    type: "ranked_start",
    arrayF: [...fVals],
    arrayG: [...gVals],
    result: new Array(n).fill(0),
    n,
    bits,
    description: `ランク付き多項式を構築: popcount(S) ごとに分類`,
  });

  // Step 2: Zeta transform on each rank
  for (let r = 0; r <= bits; r++) {
    for (let bit = 0; bit < bits; bit++) {
      for (let i = 0; i < n; i++) {
        if (i & (1 << bit)) {
          fRanked[r][i] += fRanked[r][i ^ (1 << bit)];
          gRanked[r][i] += gRanked[r][i ^ (1 << bit)];
        }
      }
    }
  }

  steps.push({
    type: "zeta",
    arrayF: [...fVals],
    arrayG: [...gVals],
    result: new Array(n).fill(0),
    n,
    bits,
    description: `各ランクに対してゼータ変換を適用`,
  });

  // Step 3: Pointwise ranked polynomial multiplication
  const hRanked: number[][] = Array.from({ length: bits + 1 }, () =>
    new Array(n).fill(0)
  );

  for (let s = 0; s < n; s++) {
    for (let r = 0; r <= bits; r++) {
      for (let j = 0; j <= r; j++) {
        hRanked[r][s] += fRanked[j][s] * gRanked[r - j][s];
      }
    }
  }

  steps.push({
    type: "pointwise",
    arrayF: [...fVals],
    arrayG: [...gVals],
    result: new Array(n).fill(0),
    n,
    bits,
    description: `各点でランク付き多項式同士の畳み込み`,
  });

  // Step 4: Mobius transform on each rank
  for (let r = 0; r <= bits; r++) {
    for (let bit = 0; bit < bits; bit++) {
      for (let i = 0; i < n; i++) {
        if (i & (1 << bit)) {
          hRanked[r][i] -= hRanked[r][i ^ (1 << bit)];
        }
      }
    }
  }

  steps.push({
    type: "mobius",
    arrayF: [...fVals],
    arrayG: [...gVals],
    result: new Array(n).fill(0),
    n,
    bits,
    description: `各ランクに対してメビウス変換 (逆変換) を適用`,
  });

  // Step 5: Extract result
  const result = new Array(n).fill(0);
  for (let s = 0; s < n; s++) {
    result[s] = hRanked[popcount(s)][s];

    steps.push({
      type: "extract",
      arrayF: [...fVals],
      arrayG: [...gVals],
      result: [...result],
      n,
      bits,
      highlightIdx: s,
      description: `h[${binaryStr(s, bits)}] = hRanked[${popcount(s)}][${binaryStr(s, bits)}] = ${result[s]}`,
    });
  }

  steps.push({
    type: "done",
    arrayF: [...fVals],
    arrayG: [...gVals],
    result: [...result],
    n,
    bits,
    description: `Subset Convolution 完了: [${result.join(", ")}]`,
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(
  idx: number,
  step: Step,
  target: "f" | "g" | "result"
): string {
  const base =
    "min-w-[3rem] h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors px-1";

  if (target === "result") {
    if (step.type === "done") {
      return `${base} bg-emerald-100 border-emerald-500`;
    }
    if (step.type === "extract" && idx === step.highlightIdx) {
      return `${base} bg-blue-100 border-blue-400`;
    }
    if (
      step.type === "extract" &&
      step.highlightIdx !== undefined &&
      idx < step.highlightIdx &&
      step.result[idx] !== 0
    ) {
      return `${base} bg-emerald-100 border-emerald-500`;
    }
  }

  if (step.type === "zeta" || step.type === "pointwise") {
    return `${base} bg-amber-50 border-amber-400`;
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function SubsetConvolutionAnimationPage() {
  const [inputF, setInputF] = useState("1,2,3,4");
  const [inputG, setInputG] = useState("5,6,7,8");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((sF: string, sG: string) => {
    const f = sF
      .split(",")
      .map((x) => parseInt(x.trim(), 10))
      .filter((x) => !isNaN(x));
    const g = sG
      .split(",")
      .map((x) => parseInt(x.trim(), 10))
      .filter((x) => !isNaN(x));
    if (f.length === 0 || g.length === 0) return;
    // Pad to next power of 2, same length
    let len = 1;
    while (len < Math.max(f.length, g.length)) len <<= 1;
    while (f.length < len) f.push(0);
    while (g.length < len) g.push(0);
    setSteps(generateSteps(f, g));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputF, inputG);
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
        <h1 className="text-2xl font-bold mb-1">Subset Convolution</h1>
        <p className="text-sm text-muted-foreground mb-6">
          集合関数の subset convolution を計算する手法
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          <Input
            value={inputF}
            onChange={(e) => setInputF(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputF, inputG);
            }}
            placeholder="f の値 (2^n 個)"
            className="font-mono max-w-[12rem]"
          />
          <Input
            value={inputG}
            onChange={(e) => setInputG(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputF, inputG);
            }}
            placeholder="g の値 (2^n 個)"
            className="font-mono max-w-[12rem]"
          />
          <Button onClick={() => run(inputF, inputG)} variant="outline">
            実行
          </Button>
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            f
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.arrayF.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step, "f")}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {binaryStr(idx, step.bits)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            g
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.arrayG.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step, "g")}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {binaryStr(idx, step.bits)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            h = f *_subset g
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.result.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step, "result")}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {binaryStr(idx, step.bits)}
                </div>
              </div>
            ))}
          </div>
        </div>

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
            <span>現在抽出中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>変換処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>確定</span>
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
      </div>
    </div>
  );
}
