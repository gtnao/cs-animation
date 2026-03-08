"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "baby_step" | "giant_step" | "found" | "not_found" | "done";

interface Step {
  type: StepType;
  babySteps: Map<number, number>;
  babyStepEntries: [number, number][];
  giantJ?: number;
  giantVal?: number;
  m: number;
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(a: number, b: number, p: number): Step[] {
  const steps: Step[] = [];
  const m = Math.ceil(Math.sqrt(p));

  steps.push({
    type: "init",
    babySteps: new Map(),
    babyStepEntries: [],
    m,
    description: `a^x ≡ ${b} (mod ${p}) を解く。m = ceil(sqrt(${p})) = ${m}`,
  });

  // Baby steps: compute a^j mod p for j = 0, 1, ..., m-1
  const babySteps = new Map<number, number>();
  const entries: [number, number][] = [];
  let val = 1;
  for (let j = 0; j < m; j++) {
    babySteps.set(val, j);
    entries.push([val, j]);

    steps.push({
      type: "baby_step",
      babySteps: new Map(babySteps),
      babyStepEntries: [...entries],
      m,
      description: `Baby step: a^${j} mod ${p} = ${val} をテーブルに格納`,
    });

    val = (val * a) % p;
  }

  // Giant step factor: a^(-m) mod p
  // Use Fermat's little theorem: a^(-m) = a^(p-1-m) mod p
  let aInvM = 1;
  let base = a;
  let exp = p - 1 - m;
  while (exp > 0) {
    if (exp & 1) aInvM = (aInvM * base) % p;
    base = (base * base) % p;
    exp >>= 1;
  }

  // Giant steps
  let gamma = b;
  for (let i = 0; i < m; i++) {
    steps.push({
      type: "giant_step",
      babySteps: new Map(babySteps),
      babyStepEntries: entries,
      giantJ: i,
      giantVal: gamma,
      m,
      description: `Giant step: i=${i}, b × a^(-${m}×${i}) mod ${p} = ${gamma}。テーブルを検索...`,
    });

    if (babySteps.has(gamma)) {
      const j = babySteps.get(gamma)!;
      const x = i * m + j;
      steps.push({
        type: "found",
        babySteps: new Map(babySteps),
        babyStepEntries: entries,
        giantJ: i,
        giantVal: gamma,
        m,
        description: `一致! x = ${i} × ${m} + ${j} = ${x}。a^${x} ≡ ${b} (mod ${p})`,
      });
      return steps;
    }

    gamma = (gamma * aInvM) % p;
  }

  steps.push({
    type: "not_found",
    babySteps: new Map(babySteps),
    babyStepEntries: entries,
    m,
    description: `解が見つかりません`,
  });

  return steps;
}

// --- Component ---

export default function BSGSAnimationPage() {
  const [inputA, setInputA] = useState("3");
  const [inputB, setInputB] = useState("13");
  const [inputP, setInputP] = useState("17");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((aStr: string, bStr: string, pStr: string) => {
    const a = parseInt(aStr, 10);
    const b = parseInt(bStr, 10);
    const p = parseInt(pStr, 10);
    if (isNaN(a) || isNaN(b) || isNaN(p) || p < 2 || a < 1) return;
    setSteps(generateSteps(a, b, p));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputA, inputB, inputP);
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
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input value={inputA} onChange={(e) => setInputA(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputA, inputB, inputP); }} placeholder="a" className="font-mono max-w-[80px]" />
          <span className="flex items-center text-muted-foreground">^x ≡</span>
          <Input value={inputB} onChange={(e) => setInputB(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputA, inputB, inputP); }} placeholder="b" className="font-mono max-w-[80px]" />
          <span className="flex items-center text-muted-foreground">(mod</span>
          <Input value={inputP} onChange={(e) => setInputP(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputA, inputB, inputP); }} placeholder="p" className="font-mono max-w-[80px]" />
          <span className="flex items-center text-muted-foreground">)</span>
          <Button onClick={() => run(inputA, inputB, inputP)} variant="outline">
            実行
          </Button>
        </div>

        {/* Baby step table */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Baby step テーブル (a^j mod p → j)
          </div>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {step.babyStepEntries.map(([val, j], idx) => (
              <div
                key={idx}
                className={`px-2 py-1 border-2 text-xs font-mono rounded transition-colors ${
                  step.type === "found" && step.giantVal === val
                    ? "bg-emerald-100 border-emerald-500 font-bold"
                    : step.type === "giant_step" && step.giantVal === val
                    ? "bg-blue-100 border-blue-400"
                    : "bg-white border-gray-200"
                }`}
              >
                {val}→{j}
              </div>
            ))}
          </div>
        </div>

        {/* Giant step current */}
        {(step.type === "giant_step" || step.type === "found") && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Giant step 現在値
            </div>
            <div
              className={`inline-block px-4 py-2 border-2 font-mono text-lg font-bold rounded ${
                step.type === "found"
                  ? "bg-emerald-100 border-emerald-500"
                  : "bg-amber-50 border-amber-400"
              }`}
            >
              i={step.giantJ}: γ={step.giantVal}
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
            <span>検索中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>Giant step 現在値</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>一致</span>
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
