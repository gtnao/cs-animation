"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "iterate" | "found" | "done";

interface Step {
  type: StepType;
  n: number;
  x: number;
  y: number;
  d: number;
  iteration: number;
  history: { x: number; y: number; d: number }[];
  description: string;
}

// --- GCD ---

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

// --- Algorithm step generation ---

function generateSteps(n: number): Step[] {
  const steps: Step[] = [];

  if (n <= 1) {
    steps.push({
      type: "done", n, x: 0, y: 0, d: 0, iteration: 0, history: [],
      description: `${n} は因数分解できない`,
    });
    return steps;
  }

  // f(x) = (x^2 + 1) mod n
  const f = (x: number) => ((x * x) % n + 1) % n;
  let x = 2;
  let y = 2;
  let d = 1;
  const history: { x: number; y: number; d: number }[] = [];

  steps.push({
    type: "init", n, x, y, d, iteration: 0, history: [],
    description: `Pollard's rho 法で ${n} の因数を探す。f(x) = (x^2 + 1) mod ${n}`,
  });

  let iter = 0;
  while (d === 1 && iter < 100) {
    x = f(x);
    y = f(f(y));
    d = gcd(Math.abs(x - y), n);
    iter++;

    history.push({ x, y, d });

    if (d === 1) {
      steps.push({
        type: "iterate", n, x, y, d, iteration: iter, history: [...history],
        description: `反復 ${iter}: x = ${x}, y = ${y}, gcd(|${x} - ${y}|, ${n}) = ${d}`,
      });
    } else if (d === n) {
      steps.push({
        type: "iterate", n, x, y, d, iteration: iter, history: [...history],
        description: `反復 ${iter}: gcd = ${n} (失敗、別のパラメータで再試行が必要)`,
      });
    } else {
      steps.push({
        type: "found", n, x, y, d, iteration: iter, history: [...history],
        description: `反復 ${iter}: gcd(|${x} - ${y}|, ${n}) = ${d}。因数 ${d} を発見!`,
      });
    }
  }

  if (d !== 1 && d !== n) {
    steps.push({
      type: "done", n, x, y, d, iteration: iter, history: [...history],
      description: `${n} = ${d} × ${n / d}`,
    });
  } else {
    steps.push({
      type: "done", n, x, y, d: 0, iteration: iter, history: [...history],
      description: d === n ? `失敗: 別のパラメータで再試行が必要` : `タイムアウト`,
    });
  }

  return steps;
}

// --- Component ---

export default function PollardRhoAnimationPage() {
  const [input, setInput] = useState("8051");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const val = parseInt(s, 10);
    if (isNaN(val) || val < 2 || val > 10000000) return;
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Pollard&apos;s rho 法</h1>
        <p className="text-sm text-muted-foreground mb-6">
          素因数分解のための確率的アルゴリズム
        </p>

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
            因数分解
          </Button>
        </div>

        {/* Current values */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            現在の値 (Floyd's cycle detection)
          </div>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">x (tortoise)</div>
              <div className="w-20 h-12 flex items-center justify-center border-2 bg-blue-100 border-blue-400 text-lg font-mono font-bold">
                {step.x}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">y (hare)</div>
              <div className="w-20 h-12 flex items-center justify-center border-2 bg-amber-50 border-amber-400 text-lg font-mono font-bold">
                {step.y}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">gcd</div>
              <div
                className={`w-20 h-12 flex items-center justify-center border-2 text-lg font-mono font-bold ${
                  step.d > 1 && step.d < step.n
                    ? "bg-emerald-100 border-emerald-500"
                    : "bg-white border-gray-200"
                }`}
              >
                {step.d}
              </div>
            </div>
          </div>
        </div>

        {/* History table */}
        {step.history.length > 0 && (
          <div className="mb-6 max-h-48 overflow-y-auto">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              反復履歴
            </div>
            <table className="text-sm font-mono border-collapse">
              <thead>
                <tr>
                  <th className="px-2 py-1 border border-border text-left">#</th>
                  <th className="px-2 py-1 border border-border text-right">x</th>
                  <th className="px-2 py-1 border border-border text-right">y</th>
                  <th className="px-2 py-1 border border-border text-right">gcd</th>
                </tr>
              </thead>
              <tbody>
                {step.history.map((h, idx) => (
                  <tr
                    key={idx}
                    className={
                      h.d > 1 && h.d < step.n ? "bg-emerald-50" : ""
                    }
                  >
                    <td className="px-2 py-1 border border-border">{idx + 1}</td>
                    <td className="px-2 py-1 border border-border text-right">{h.x}</td>
                    <td className="px-2 py-1 border border-border text-right">{h.y}</td>
                    <td className="px-2 py-1 border border-border text-right">{h.d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Result */}
        {step.type === "done" && step.d > 1 && step.d < step.n && (
          <div className="mb-6">
            <div
              className="inline-block px-6 py-3 border-2 rounded font-mono text-lg font-bold bg-emerald-100 border-emerald-500"
            >
              {step.n} = {step.d} x {step.n / step.d}
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>x (亀)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>y (兎)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>因数発見</span>
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
      </div>
    </div>
  );
}
