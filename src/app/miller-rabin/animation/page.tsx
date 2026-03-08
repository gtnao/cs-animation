"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "decompose" | "compute_base" | "check_initial" | "square" | "witness_found" | "probably_prime_round" | "done";

interface Step {
  type: StepType;
  n: number;
  d: number;
  r: number;
  witness: number;
  roundIdx: number;
  currentVal: number;
  squareIdx: number;
  isPrime: boolean | null;
  witnesses: number[];
  description: string;
}

// --- Modular exponentiation ---

function powMod(base: number, exp: number, mod: number): number {
  let result = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp & 1) result = (result * base) % mod;
    exp >>= 1;
    base = (base * base) % mod;
  }
  return result;
}

// --- Algorithm step generation ---

function generateSteps(n: number): Step[] {
  const steps: Step[] = [];

  if (n < 2) {
    steps.push({
      type: "done", n, d: 0, r: 0, witness: 0, roundIdx: 0,
      currentVal: 0, squareIdx: 0, isPrime: false, witnesses: [],
      description: `${n} < 2 なので素数でない`,
    });
    return steps;
  }

  if (n === 2 || n === 3) {
    steps.push({
      type: "done", n, d: 0, r: 0, witness: 0, roundIdx: 0,
      currentVal: 0, squareIdx: 0, isPrime: true, witnesses: [],
      description: `${n} は素数`,
    });
    return steps;
  }

  if (n % 2 === 0) {
    steps.push({
      type: "done", n, d: 0, r: 0, witness: 0, roundIdx: 0,
      currentVal: 0, squareIdx: 0, isPrime: false, witnesses: [],
      description: `${n} は偶数なので素数でない`,
    });
    return steps;
  }

  // Decompose n-1 = 2^r * d
  let d = n - 1;
  let r = 0;
  while (d % 2 === 0) {
    d /= 2;
    r++;
  }

  steps.push({
    type: "decompose", n, d, r, witness: 0, roundIdx: 0,
    currentVal: 0, squareIdx: 0, isPrime: null, witnesses: [],
    description: `${n} - 1 = ${n - 1} = 2^${r} × ${d}`,
  });

  // Deterministic witnesses for small n
  const witnesses = [2, 3, 5, 7, 11, 13].filter((a) => a < n);

  for (let roundIdx = 0; roundIdx < witnesses.length; roundIdx++) {
    const a = witnesses[roundIdx];

    let x = powMod(a, d, n);

    steps.push({
      type: "compute_base", n, d, r, witness: a, roundIdx,
      currentVal: x, squareIdx: 0, isPrime: null, witnesses,
      description: `ラウンド ${roundIdx + 1}: 証人 a = ${a}。a^d mod n = ${a}^${d} mod ${n} = ${x}`,
    });

    if (x === 1 || x === n - 1) {
      steps.push({
        type: "probably_prime_round", n, d, r, witness: a, roundIdx,
        currentVal: x, squareIdx: 0, isPrime: null, witnesses,
        description: `a^d ≡ ${x === 1 ? "1" : "-1"} (mod ${n})。この証人では合成数と判定できない`,
      });
      continue;
    }

    let compositeFound = false;
    let passedRound = false;
    for (let i = 0; i < r - 1; i++) {
      x = powMod(x, 2, n);

      steps.push({
        type: "square", n, d, r, witness: a, roundIdx,
        currentVal: x, squareIdx: i + 1, isPrime: null, witnesses,
        description: `二乗: x = x^2 mod ${n} = ${x}`,
      });

      if (x === n - 1) {
        steps.push({
          type: "probably_prime_round", n, d, r, witness: a, roundIdx,
          currentVal: x, squareIdx: i + 1, isPrime: null, witnesses,
          description: `x ≡ -1 (mod ${n})。この証人では合成数と判定できない`,
        });
        passedRound = true;
        break;
      }

      if (x === 1) {
        compositeFound = true;
        break;
      }
    }

    if (!passedRound && !compositeFound) {
      // One more squaring to check
      compositeFound = true;
    }

    if (compositeFound) {
      steps.push({
        type: "witness_found", n, d, r, witness: a, roundIdx,
        currentVal: x, squareIdx: r, isPrime: false, witnesses,
        description: `証人 ${a} により ${n} は合成数と判定`,
      });

      steps.push({
        type: "done", n, d, r, witness: a, roundIdx,
        currentVal: x, squareIdx: 0, isPrime: false, witnesses,
        description: `${n} は合成数`,
      });
      return steps;
    }
  }

  steps.push({
    type: "done", n, d, r, witness: 0, roundIdx: witnesses.length,
    currentVal: 0, squareIdx: 0, isPrime: true, witnesses,
    description: `全ての証人をパス。${n} は素数 (確定的)`,
  });

  return steps;
}

// --- Component ---

export default function MillerRabinAnimationPage() {
  const [input, setInput] = useState("561");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const val = parseInt(s, 10);
    if (isNaN(val) || val < 1 || val > 1000000) return;
    setSteps(generateSteps(val));
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
    }, 700);
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
{/* Input */}
        <div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") run(input); }}
            placeholder="n"
            className="font-mono max-w-[150px]"
          />
          <Button onClick={() => run(input)} variant="outline">
            判定
          </Button>
        </div>

        {/* Decomposition */}
        {step.r > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              分解: n - 1 = 2^r × d
            </div>
            <div className="flex gap-4 text-sm font-mono">
              <span>n = {step.n}</span>
              <span>r = {step.r}</span>
              <span>d = {step.d}</span>
            </div>
          </div>
        )}

        {/* Witnesses */}
        {step.witnesses.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              証人 (witnesses)
            </div>
            <div className="flex gap-1">
              {step.witnesses.map((w, idx) => {
                let cls = "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
                if (idx === step.roundIdx && step.type !== "done") {
                  cls += " bg-blue-100 border-blue-400 font-bold";
                } else if (idx < step.roundIdx) {
                  if (step.isPrime === false && idx === step.roundIdx) {
                    cls += " bg-red-100 border-red-500";
                  } else {
                    cls += " bg-emerald-100 border-emerald-500";
                  }
                } else {
                  cls += " bg-white border-gray-200";
                }
                return <div key={idx} className={cls}>{w}</div>;
              })}
            </div>
          </div>
        )}

        {/* Current value */}
        {step.type !== "init" && step.type !== "done" && step.type !== "decompose" && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              現在の値
            </div>
            <div
              className={`inline-block px-4 py-2 border-2 font-mono text-lg font-bold rounded ${
                step.type === "witness_found"
                  ? "bg-red-100 border-red-500"
                  : step.type === "probably_prime_round"
                  ? "bg-emerald-100 border-emerald-500"
                  : "bg-amber-50 border-amber-400"
              }`}
            >
              x = {step.currentVal}
            </div>
          </div>
        )}

        {/* Result */}
        {step.type === "done" && step.isPrime !== null && (
          <div className="mb-6">
            <div
              className={`inline-block px-6 py-3 border-2 rounded font-mono text-lg font-bold ${
                step.isPrime
                  ? "bg-emerald-100 border-emerald-500"
                  : "bg-red-100 border-red-500"
              }`}
            >
              {step.n} は{step.isPrime ? "素数" : "合成数"}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
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
            <span>現在の証人</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>パス</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>合成数判定</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>
            ← 前へ
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>
            次へ →
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>
            {isPlaying ? "停止" : "再生"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>
            リセット
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
    </>
  );
}
