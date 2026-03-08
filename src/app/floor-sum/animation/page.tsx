"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "reduce" | "recurse" | "done";

interface Step {
  type: StepType;
  n: number;
  a: number;
  b: number;
  m: number;
  currentResult: number;
  callStack: { n: number; a: number; b: number; m: number }[];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(n: number, a: number, b: number, m: number): Step[] {
  const steps: Step[] = [];

  steps.push({
    type: "init", n, a, b, m, currentResult: 0,
    callStack: [{ n, a, b, m }],
    description: `floor_sum(${n}, ${a}, ${b}, ${m}) = sum_{i=0}^{${n - 1}} floor((${a}*i + ${b}) / ${m})`,
  });

  // Compute naive result for visualization
  let naiveResult = 0;
  for (let i = 0; i < n; i++) {
    naiveResult += Math.floor((a * i + b) / m);
  }

  // Show the iterative computation steps
  const callStack: { n: number; a: number; b: number; m: number }[] = [];
  let result = floorSumWithSteps(n, a, b, m, steps, callStack, 0);

  steps.push({
    type: "done", n, a, b, m, currentResult: result,
    callStack: [],
    description: `完了: floor_sum(${n}, ${a}, ${b}, ${m}) = ${result}`,
  });

  return steps;
}

function floorSumWithSteps(
  n: number, a: number, b: number, m: number,
  steps: Step[],
  callStack: { n: number; a: number; b: number; m: number }[],
  depth: number
): number {
  callStack.push({ n, a, b, m });

  if (a === 0) {
    const result = Math.floor(b / m) * n;
    steps.push({
      type: "reduce", n, a, b, m, currentResult: result,
      callStack: [...callStack],
      description: `a = 0: floor(${b}/${m}) × ${n} = ${result}`,
    });
    callStack.pop();
    return result;
  }

  if (a >= m || b >= m) {
    const a2 = a % m;
    const b2 = b % m;
    const extra = Math.floor(a / m) * n * (n - 1) / 2 + Math.floor(b / m) * n;

    steps.push({
      type: "reduce", n, a, b, m, currentResult: 0,
      callStack: [...callStack],
      description: `a >= m または b >= m: floor(a/m)=${Math.floor(a / m)}, floor(b/m)=${Math.floor(b / m)} を分離。追加分 = ${extra}`,
    });

    const sub = floorSumWithSteps(n, a2, b2, m, steps, callStack, depth + 1);
    callStack.pop();
    return extra + sub;
  }

  // a < m and b < m
  const yMax = Math.floor((a * n + b) / m);
  const xMax = yMax * m - b;

  steps.push({
    type: "recurse", n, a, b, m, currentResult: 0,
    callStack: [...callStack],
    description: `反転: floor_sum(${n}, ${a}, ${b}, ${m}) → 格子点計数の反転。y_max = floor((${a}*${n}+${b})/${m}) = ${yMax}`,
  });

  const sub = floorSumWithSteps(yMax, m, m - b - 1 + a, a, steps, callStack, depth + 1);
  const result = (n - 1) * yMax - sub;

  steps.push({
    type: "reduce", n, a, b, m, currentResult: result,
    callStack: [...callStack],
    description: `反転結果: (${n}-1)×${yMax} - ${sub} = ${result}`,
  });

  callStack.pop();
  return result;
}

// --- Component ---

export default function FloorSumAnimationPage() {
  const [inputN, setInputN] = useState("6");
  const [inputA, setInputA] = useState("4");
  const [inputB, setInputB] = useState("3");
  const [inputM, setInputM] = useState("5");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((nS: string, aS: string, bS: string, mS: string) => {
    const n = parseInt(nS, 10);
    const a = parseInt(aS, 10);
    const b = parseInt(bS, 10);
    const m = parseInt(mS, 10);
    if (isNaN(n) || isNaN(a) || isNaN(b) || isNaN(m)) return;
    if (n < 0 || a < 0 || b < 0 || m < 1 || n > 100) return;
    setSteps(generateSteps(n, a, b, m));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputN, inputA, inputB, inputM);
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
    }, 800);
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

  // Compute each term for visualization
  const terms: number[] = [];
  for (let i = 0; i < step.n; i++) {
    terms.push(Math.floor((step.a * i + step.b) / step.m));
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">フロアサム (Floor Sum)</h1>
        <p className="text-sm text-muted-foreground mb-6">
          床関数の和を高速に計算する
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input value={inputN} onChange={(e) => setInputN(e.target.value)} placeholder="n" className="font-mono max-w-[80px]" />
          <Input value={inputA} onChange={(e) => setInputA(e.target.value)} placeholder="a" className="font-mono max-w-[80px]" />
          <Input value={inputB} onChange={(e) => setInputB(e.target.value)} placeholder="b" className="font-mono max-w-[80px]" />
          <Input value={inputM} onChange={(e) => setInputM(e.target.value)} placeholder="m" className="font-mono max-w-[80px]" />
          <Button onClick={() => run(inputN, inputA, inputB, inputM)} variant="outline">
            計算
          </Button>
        </div>

        {/* Terms visualization */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            各項 floor(({step.a}*i + {step.b}) / {step.m})
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {terms.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 flex items-center justify-center border-2 bg-amber-50 border-amber-400 text-sm font-mono">
                  {val}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  i={idx}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm font-mono text-muted-foreground">
            合計: {terms.reduce((a, b) => a + b, 0)}
          </div>
        </div>

        {/* Call stack */}
        {step.callStack.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              再帰呼び出し
            </div>
            <div className="space-y-1">
              {step.callStack.map((call, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1 border-2 text-xs font-mono rounded ${
                    idx === step.callStack.length - 1
                      ? "bg-blue-100 border-blue-400"
                      : "bg-white border-gray-200"
                  }`}
                  style={{ marginLeft: `${idx * 16}px` }}
                >
                  floor_sum({call.n}, {call.a}, {call.b}, {call.m})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {step.type === "done" && (
          <div className="mb-6">
            <div
              className="inline-block px-6 py-3 border-2 rounded font-mono text-lg font-bold bg-emerald-100 border-emerald-500"
            >
              結果 = {step.currentResult}
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
            <span>現在の呼び出し</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>各項の値</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>結果</span>
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
