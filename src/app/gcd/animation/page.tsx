"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "divide" | "update" | "done";

interface Step {
  type: StepType;
  a: number;
  b: number;
  q?: number;
  r?: number;
  history: { a: number; b: number; q: number; r: number }[];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(a: number, b: number): Step[] {
  const steps: Step[] = [];
  // Ensure a >= b >= 0
  if (a < b) [a, b] = [b, a];
  if (b < 0) { a = Math.abs(a); b = Math.abs(b); }

  const history: { a: number; b: number; q: number; r: number }[] = [];

  steps.push({
    type: "init",
    a,
    b,
    history: [],
    description: `gcd(${a}, ${b}) を求めます`,
  });

  while (b !== 0) {
    const q = Math.floor(a / b);
    const r = a % b;

    steps.push({
      type: "divide",
      a,
      b,
      q,
      r,
      history: [...history],
      description: `${a} = ${b} × ${q} + ${r}`,
    });

    history.push({ a, b, q, r });

    const newA = b;
    const newB = r;

    steps.push({
      type: "update",
      a: newA,
      b: newB,
      history: [...history],
      description: `a ← ${newA}, b ← ${newB}`,
    });

    a = newA;
    b = newB;
  }

  steps.push({
    type: "done",
    a,
    b: 0,
    history: [...history],
    description: `b = 0 なので gcd = ${a}`,
  });

  return steps;
}

// --- Component ---

export default function GCDAnimationPage() {
  const [inputA, setInputA] = useState("252");
  const [inputB, setInputB] = useState("105");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((aStr: string, bStr: string) => {
    const a = parseInt(aStr, 10);
    const b = parseInt(bStr, 10);
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) return;
    setSteps(generateSteps(a, b));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputA, inputB);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 800);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, steps.length]);

  // Keyboard shortcuts
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
            value={inputA}
            onChange={(e) => setInputA(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputA, inputB);
            }}
            placeholder="a"
            className="font-mono max-w-[120px]"
          />
          <Input
            value={inputB}
            onChange={(e) => setInputB(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputA, inputB);
            }}
            placeholder="b"
            className="font-mono max-w-[120px]"
          />
          <Button onClick={() => run(inputA, inputB)} variant="outline">
            実行
          </Button>
        </div>

        {/* Current values */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            現在の値
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">a</div>
              <div
                className={`w-20 h-12 flex items-center justify-center border-2 text-lg font-mono font-bold transition-colors ${
                  step.type === "done"
                    ? "bg-emerald-100 border-emerald-500"
                    : "bg-blue-100 border-blue-400"
                }`}
              >
                {step.a}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">b</div>
              <div
                className={`w-20 h-12 flex items-center justify-center border-2 text-lg font-mono font-bold transition-colors ${
                  step.type === "done"
                    ? "bg-white border-gray-200"
                    : "bg-amber-50 border-amber-400"
                }`}
              >
                {step.b}
              </div>
            </div>
            {step.type === "divide" && step.q !== undefined && (
              <>
                <div className="text-muted-foreground">=</div>
                <div className="flex flex-col items-center gap-1">
                  <div className="text-xs text-muted-foreground">商 q</div>
                  <div className="w-16 h-12 flex items-center justify-center border-2 bg-white border-gray-200 text-lg font-mono">
                    {step.q}
                  </div>
                </div>
                <div className="text-muted-foreground">...</div>
                <div className="flex flex-col items-center gap-1">
                  <div className="text-xs text-muted-foreground">余り r</div>
                  <div
                    className={`w-16 h-12 flex items-center justify-center border-2 text-lg font-mono ${
                      step.r === 0
                        ? "bg-emerald-100 border-emerald-500"
                        : "bg-red-100 border-red-500"
                    }`}
                  >
                    {step.r}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* History table */}
        {step.history.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              計算履歴
            </div>
            <table className="text-sm font-mono border-collapse">
              <thead>
                <tr>
                  <th className="px-3 py-1 border border-border text-left">ステップ</th>
                  <th className="px-3 py-1 border border-border text-right">a</th>
                  <th className="px-3 py-1 border border-border text-right">b</th>
                  <th className="px-3 py-1 border border-border text-right">q</th>
                  <th className="px-3 py-1 border border-border text-right">r</th>
                  <th className="px-3 py-1 border border-border text-left">式</th>
                </tr>
              </thead>
              <tbody>
                {step.history.map((h, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-1 border border-border">{idx + 1}</td>
                    <td className="px-3 py-1 border border-border text-right">{h.a}</td>
                    <td className="px-3 py-1 border border-border text-right">{h.b}</td>
                    <td className="px-3 py-1 border border-border text-right">{h.q}</td>
                    <td className="px-3 py-1 border border-border text-right">{h.r}</td>
                    <td className="px-3 py-1 border border-border">
                      {h.a} = {h.b} × {h.q} + {h.r}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <span>現在の a</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>現在の b</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>GCD 確定</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>余り ≠ 0</span>
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
    </>
  );
}
