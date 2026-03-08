"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "factorize" | "test_candidate" | "check_factor" | "reject" | "accept" | "done";

interface Step {
  type: StepType;
  p: number;
  candidate: number;
  factors: number[];
  checkingFactor?: number;
  powerResult?: number;
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

function generateSteps(p: number): Step[] {
  const steps: Step[] = [];

  if (p < 2) {
    steps.push({
      type: "done", p, candidate: 0, factors: [],
      description: `${p} は素数でないため原始根は存在しない`,
    });
    return steps;
  }

  // Factorize p-1
  const phi = p - 1;
  const factors: number[] = [];
  let tmp = phi;
  for (let d = 2; d * d <= tmp; d++) {
    if (tmp % d === 0) {
      factors.push(d);
      while (tmp % d === 0) tmp /= d;
    }
  }
  if (tmp > 1) factors.push(tmp);

  steps.push({
    type: "init", p, candidate: 0, factors,
    description: `素数 p = ${p} の原始根を探す。phi(p) = p - 1 = ${phi}`,
  });

  steps.push({
    type: "factorize", p, candidate: 0, factors,
    description: `${phi} の素因数: ${factors.join(", ")}。各候補 g に対して g^(${phi}/q) ≢ 1 (mod ${p}) を全ての素因数 q でチェック`,
  });

  for (let g = 2; g < p; g++) {
    steps.push({
      type: "test_candidate", p, candidate: g, factors,
      description: `候補 g = ${g} をテスト`,
    });

    let isRoot = true;
    for (const q of factors) {
      const exp = phi / q;
      const result = powMod(g, exp, p);

      steps.push({
        type: "check_factor", p, candidate: g, factors,
        checkingFactor: q, powerResult: result,
        description: `g^(${phi}/${q}) = ${g}^${exp} mod ${p} = ${result}${result === 1 ? " ≡ 1 → 失敗" : " ≢ 1 → OK"}`,
      });

      if (result === 1) {
        isRoot = false;
        steps.push({
          type: "reject", p, candidate: g, factors,
          description: `g = ${g} は原始根でない (${g}^${exp} ≡ 1)`,
        });
        break;
      }
    }

    if (isRoot) {
      steps.push({
        type: "accept", p, candidate: g, factors,
        description: `g = ${g} は原始根! 全ての条件をパス`,
      });

      steps.push({
        type: "done", p, candidate: g, factors,
        description: `${p} の最小の原始根は ${g}`,
      });
      return steps;
    }
  }

  steps.push({
    type: "done", p, candidate: 0, factors,
    description: `原始根が見つからなかった`,
  });

  return steps;
}

// --- Component ---

export default function PrimitiveRootAnimationPage() {
  const [input, setInput] = useState("13");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const val = parseInt(s, 10);
    if (isNaN(val) || val < 2 || val > 200) return;
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
{/* Input */}
        <div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") run(input); }}
            placeholder="素数 p (2-200)"
            className="font-mono max-w-[150px]"
          />
          <Button onClick={() => run(input)} variant="outline">
            探索
          </Button>
        </div>

        {/* Factors of p-1 */}
        {step.factors.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              p - 1 = {step.p - 1} の素因数
            </div>
            <div className="flex gap-1">
              {step.factors.map((f, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1 border-2 text-sm font-mono rounded ${
                    step.checkingFactor === f
                      ? "bg-blue-100 border-blue-400 font-bold"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current candidate */}
        {step.candidate > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              現在の候補
            </div>
            <div
              className={`inline-block px-6 py-3 border-2 rounded font-mono text-lg font-bold ${
                step.type === "accept" || (step.type === "done" && step.candidate > 0)
                  ? "bg-emerald-100 border-emerald-500"
                  : step.type === "reject"
                  ? "bg-red-100 border-red-500"
                  : "bg-amber-50 border-amber-400"
              }`}
            >
              g = {step.candidate}
            </div>
          </div>
        )}

        {/* Power result */}
        {step.powerResult !== undefined && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              べき乗結果
            </div>
            <div
              className={`inline-block px-4 py-2 border-2 rounded font-mono ${
                step.powerResult === 1
                  ? "bg-red-100 border-red-500"
                  : "bg-emerald-100 border-emerald-500"
              }`}
            >
              {step.powerResult}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        {/* Description */}
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>テスト中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>原始根確定</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>棄却</span>
          </div>
        </div>

        {/* Controls */}
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
