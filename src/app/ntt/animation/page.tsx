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
  | "stage_done"
  | "done";

interface Step {
  type: StepType;
  array: number[];
  stage: number;
  totalStages: number;
  j?: number;
  k?: number;
  description: string;
}

// --- Helpers ---

const MOD = 998244353;
const PRIM_ROOT = 3;

// Modular exponentiation using number (safe for small exponents with mod < 2^26)
function modpow(base: number, exp: number, mod: number): number {
  let result = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp & 1) result = mulmod(result, base, mod);
    exp >>= 1;
    base = mulmod(base, base, mod);
  }
  return result;
}

// Safe modular multiplication avoiding overflow
function mulmod(a: number, b: number, mod: number): number {
  // Split b into high and low 15 bits to avoid exceeding 2^53
  const bHigh = Math.floor(b / (1 << 15));
  const bLow = b & ((1 << 15) - 1);
  return ((a * bHigh) % mod * (1 << 15) + a * bLow) % mod;
}

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

// --- Algorithm step generation ---

function generateSteps(coeffs: number[]): Step[] {
  const steps: Step[] = [];
  const n = nextPow2(Math.max(coeffs.length, 2));
  const bits = Math.log2(n);

  const a: number[] = [];
  for (let i = 0; i < n; i++) {
    a.push(i < coeffs.length ? ((coeffs[i] % MOD) + MOD) % MOD : 0);
  }

  steps.push({
    type: "init",
    array: [...a],
    stage: 0,
    totalStages: bits,
    description: `入力: [${coeffs.join(", ")}], mod = ${MOD}, 原始根 = ${PRIM_ROOT}`,
  });

  // Bit-reverse permutation
  const rev: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    rev[bitReverse(i, bits)] = a[i];
  }
  for (let i = 0; i < n; i++) {
    a[i] = rev[i];
  }

  steps.push({
    type: "bit_reverse",
    array: [...a],
    stage: 0,
    totalStages: bits,
    description: `ビット逆順に並べ替え完了`,
  });

  // Butterfly stages
  for (let s = 1; s <= bits; s++) {
    const halfLen = 1 << (s - 1);
    const len = 1 << s;
    const w = modpow(PRIM_ROOT, (MOD - 1) / len, MOD);

    steps.push({
      type: "butterfly_start",
      array: [...a],
      stage: s,
      totalStages: bits,
      description: `ステージ ${s}/${bits}: バタフライサイズ = ${len}, w = ${PRIM_ROOT}^{(${MOD}-1)/${len}} mod ${MOD}`,
    });

    for (let j = 0; j < n; j += len) {
      let wk = 1;
      for (let k = 0; k < halfLen; k++) {
        const t = mulmod(wk, a[j + k + halfLen], MOD);
        const u = a[j + k];

        a[j + k] = (u + t) % MOD;
        a[j + k + halfLen] = ((u - t) % MOD + MOD) % MOD;
        wk = mulmod(wk, w, MOD);

        steps.push({
          type: "butterfly_compute",
          array: [...a],
          stage: s,
          totalStages: bits,
          j: j + k,
          k: j + k + halfLen,
          description: `バタフライ: a[${j + k}] = ${a[j + k]}, a[${j + k + halfLen}] = ${a[j + k + halfLen]}`,
        });
      }
    }

    steps.push({
      type: "stage_done",
      array: [...a],
      stage: s,
      totalStages: bits,
      description: `ステージ ${s} 完了`,
    });
  }

  steps.push({
    type: "done",
    array: [...a],
    stage: bits,
    totalStages: bits,
    description: "NTT 完了 - 数論変換の結果が得られました",
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

  if (step.type === "done") {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function NTTAnimationPage() {
  const [input, setInput] = useState("1,2,3,4");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const coeffs = s
      .split(",")
      .map((x) => parseInt(x.trim(), 10))
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
    <>
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

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            配列 (ステージ {step.stage}/{step.totalStages})
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
