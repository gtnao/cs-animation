"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "check_bit" | "multiply" | "square" | "done";

interface Step {
  type: StepType;
  base: number;
  exp: number;
  mod: number;
  result: number;
  currentBase: number;
  currentExp: number;
  bitIndex: number;
  bits: number[];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(base: number, exp: number, mod: number): Step[] {
  const steps: Step[] = [];

  // Get binary representation
  const bits: number[] = [];
  let tmp = exp;
  while (tmp > 0) {
    bits.push(tmp & 1);
    tmp >>= 1;
  }
  // bits[0] = LSB

  steps.push({
    type: "init",
    base,
    exp,
    mod,
    result: 1,
    currentBase: base % mod,
    currentExp: exp,
    bitIndex: -1,
    bits,
    description: `${base}^${exp} mod ${mod} を計算。指数の二進展開: ${bits.slice().reverse().map(String).join("")}`,
  });

  let result = 1;
  let curBase = base % mod;

  for (let i = 0; i < bits.length; i++) {
    steps.push({
      type: "check_bit",
      base,
      exp,
      mod,
      result,
      currentBase: curBase,
      currentExp: exp,
      bitIndex: i,
      bits,
      description: `ビット ${i} (2^${i} の桁) = ${bits[i]}`,
    });

    if (bits[i] === 1) {
      result = (result * curBase) % mod;
      steps.push({
        type: "multiply",
        base,
        exp,
        mod,
        result,
        currentBase: curBase,
        currentExp: exp,
        bitIndex: i,
        bits,
        description: `ビットが 1 → result = result × ${curBase} mod ${mod} = ${result}`,
      });
    }

    if (i < bits.length - 1) {
      curBase = (curBase * curBase) % mod;
      steps.push({
        type: "square",
        base,
        exp,
        mod,
        result,
        currentBase: curBase,
        currentExp: exp,
        bitIndex: i,
        bits,
        description: `base を二乗: base = ${Math.round(Math.sqrt(curBase))}^2 mod ${mod} = ${curBase}`,
      });
    }
  }

  steps.push({
    type: "done",
    base,
    exp,
    mod,
    result,
    currentBase: curBase,
    currentExp: 0,
    bitIndex: bits.length,
    bits,
    description: `完了: ${base}^${exp} mod ${mod} = ${result}`,
  });

  return steps;
}

// --- Component ---

export default function FastPowAnimationPage() {
  const [inputBase, setInputBase] = useState("3");
  const [inputExp, setInputExp] = useState("13");
  const [inputMod, setInputMod] = useState("1000");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((bStr: string, eStr: string, mStr: string) => {
    const b = parseInt(bStr, 10);
    const e = parseInt(eStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(b) || isNaN(e) || isNaN(m) || b < 0 || e < 0 || m < 1) return;
    if (e > 10000) return;
    setSteps(generateSteps(b, e, m));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputBase, inputExp, inputMod);
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
          <Input
            value={inputBase}
            onChange={(e) => setInputBase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputBase, inputExp, inputMod);
            }}
            placeholder="base"
            className="font-mono max-w-[100px]"
          />
          <span className="flex items-center text-muted-foreground">^</span>
          <Input
            value={inputExp}
            onChange={(e) => setInputExp(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputBase, inputExp, inputMod);
            }}
            placeholder="exp"
            className="font-mono max-w-[100px]"
          />
          <span className="flex items-center text-muted-foreground">mod</span>
          <Input
            value={inputMod}
            onChange={(e) => setInputMod(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputBase, inputExp, inputMod);
            }}
            placeholder="mod"
            className="font-mono max-w-[100px]"
          />
          <Button onClick={() => run(inputBase, inputExp, inputMod)} variant="outline">
            実行
          </Button>
        </div>

        {/* Binary representation */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            指数の二進展開 (LSB → MSB)
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.bits.map((bit, idx) => {
              let cls =
                "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono font-bold transition-colors";
              if (idx === step.bitIndex) {
                cls += bit === 1
                  ? " bg-emerald-100 border-emerald-500"
                  : " bg-amber-50 border-amber-400";
              } else if (idx < step.bitIndex || step.type === "done") {
                cls += " bg-gray-100 border-gray-300";
              } else {
                cls += " bg-white border-gray-200";
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{bit}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    2^{idx}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current values */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            現在の値
          </div>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">result</div>
              <div
                className={`px-4 h-12 flex items-center justify-center border-2 text-lg font-mono font-bold ${
                  step.type === "done"
                    ? "bg-emerald-100 border-emerald-500"
                    : "bg-blue-100 border-blue-400"
                }`}
              >
                {step.result}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">base</div>
              <div className="px-4 h-12 flex items-center justify-center border-2 bg-amber-50 border-amber-400 text-lg font-mono font-bold">
                {step.currentBase}
              </div>
            </div>
          </div>
        </div>

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
            <span>result</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>base</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>ビット 1 (乗算実行)</span>
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
