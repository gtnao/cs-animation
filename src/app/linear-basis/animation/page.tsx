"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "process_value"
  | "check_bit"
  | "xor_with_basis"
  | "insert_basis"
  | "value_redundant"
  | "query_max"
  | "done";

interface Step {
  type: StepType;
  valueIndex: number;
  currentValue: number;
  bit: number;
  basis: number[];
  maxBits: number;
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(values: number[]): Step[] {
  const steps: Step[] = [];
  const maxBits = Math.max(1, ...values.map((v) => (v > 0 ? Math.floor(Math.log2(v)) + 1 : 1)));
  const basis: number[] = new Array(maxBits).fill(0);

  steps.push({
    type: "init",
    valueIndex: -1,
    currentValue: 0,
    bit: -1,
    basis: [...basis],
    maxBits,
    description: `${values.length} 個の値から線形基底を構築。最大ビット幅: ${maxBits}`,
  });

  for (let idx = 0; idx < values.length; idx++) {
    let cur = values[idx];

    steps.push({
      type: "process_value",
      valueIndex: idx,
      currentValue: cur,
      bit: -1,
      basis: [...basis],
      maxBits,
      description: `値 ${values[idx]} (二進: ${values[idx].toString(2)}) を基底に挿入`,
    });

    let inserted = false;
    for (let bit = maxBits - 1; bit >= 0; bit--) {
      if (!((cur >> bit) & 1)) continue;

      steps.push({
        type: "check_bit",
        valueIndex: idx,
        currentValue: cur,
        bit,
        basis: [...basis],
        maxBits,
        description: `ビット ${bit} が立っている。basis[${bit}] を確認`,
      });

      if (basis[bit] === 0) {
        basis[bit] = cur;
        steps.push({
          type: "insert_basis",
          valueIndex: idx,
          currentValue: cur,
          bit,
          basis: [...basis],
          maxBits,
          description: `basis[${bit}] が空。${cur} (二進: ${cur.toString(2)}) を挿入`,
        });
        inserted = true;
        break;
      }

      cur ^= basis[bit];
      steps.push({
        type: "xor_with_basis",
        valueIndex: idx,
        currentValue: cur,
        bit,
        basis: [...basis],
        maxBits,
        description: `basis[${bit}] = ${basis[bit]} で XOR。cur = ${cur} (二進: ${cur.toString(2)})`,
      });
    }

    if (!inserted) {
      steps.push({
        type: "value_redundant",
        valueIndex: idx,
        currentValue: cur,
        bit: -1,
        basis: [...basis],
        maxBits,
        description: `値 ${values[idx]} は既存の基底で表現可能 (線形従属)`,
      });
    }
  }

  // Compute max XOR
  let maxXor = 0;
  for (let bit = maxBits - 1; bit >= 0; bit--) {
    if (basis[bit] !== 0) {
      maxXor = Math.max(maxXor, maxXor ^ basis[bit]);
    }
  }

  steps.push({
    type: "query_max",
    valueIndex: -1,
    currentValue: maxXor,
    bit: -1,
    basis: [...basis],
    maxBits,
    description: `基底構築完了。最大 XOR 値 = ${maxXor} (二進: ${maxXor.toString(2)})`,
  });

  steps.push({
    type: "done",
    valueIndex: -1,
    currentValue: maxXor,
    bit: -1,
    basis: [...basis],
    maxBits,
    description: `完了。基底サイズ = ${basis.filter((b) => b !== 0).length}、最大 XOR = ${maxXor}`,
  });

  return steps;
}

// --- Cell styling ---

function getBasisCellClass(
  bit: number,
  step: Step
): string {
  const base =
    "w-20 h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors";

  if (step.type === "insert_basis" && bit === step.bit) {
    return `${base} bg-emerald-100 border-emerald-500 font-bold`;
  }
  if (step.type === "check_bit" && bit === step.bit) {
    return `${base} bg-amber-50 border-amber-400`;
  }
  if (step.type === "xor_with_basis" && bit === step.bit) {
    return `${base} bg-blue-100 border-blue-400`;
  }
  if (step.basis[bit] !== 0) {
    return `${base} bg-white border-gray-300`;
  }
  return `${base} bg-gray-50 border-gray-200 text-muted-foreground`;
}

// --- Bit display ---

function toBinaryStr(val: number, bits: number): string {
  return val.toString(2).padStart(bits, "0");
}

// --- Component ---

export default function LinearBasisAnimationPage() {
  const defaultInput = "5 3 7 2 6";
  const [input, setInput] = useState(defaultInput);
  const [values, setValues] = useState<number[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const vals = s
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((v) => !isNaN(v) && v >= 0);
    if (vals.length === 0) return;
    setValues(vals);
    setSteps(generateSteps(vals));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(defaultInput);
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
    }, 700);
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">線形基底 Linear Basis / XOR Basis</h1>
        <p className="text-sm text-muted-foreground mb-6">
          XOR 演算における線形基底の構築と操作
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground">
              非負整数列 (スペース区切り)
            </label>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") run(input);
              }}
              placeholder="5 3 7 2 6"
              className="font-mono"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => run(input)} variant="outline">
              実行
            </Button>
          </div>
        </div>

        {/* Values */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            入力値
          </div>
          <div className="flex gap-1 flex-wrap">
            {values.map((val, idx) => {
              const base =
                "px-3 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              const isActive = step.valueIndex === idx;
              const isProcessed =
                step.type === "done" ||
                step.type === "query_max" ||
                (step.valueIndex >= 0 && idx < step.valueIndex) ||
                (idx === step.valueIndex && (step.type === "insert_basis" || step.type === "value_redundant"));
              const cls = isActive
                ? `${base} bg-blue-100 border-blue-400 font-bold`
                : isProcessed
                ? `${base} bg-gray-100 border-gray-300`
                : `${base} bg-white border-gray-200`;
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{val}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {toBinaryStr(val, step.maxBits)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current value */}
        {step.valueIndex >= 0 && step.type !== "value_redundant" && step.type !== "insert_basis" && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              現在の値 (XOR 操作後)
            </div>
            <div className="inline-flex px-3 h-10 items-center justify-center border-2 text-sm font-mono bg-amber-50 border-amber-400 font-bold">
              {step.currentValue} ({toBinaryStr(step.currentValue, step.maxBits)})
            </div>
          </div>
        )}

        {/* Basis */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            基底配列 (上位ビットから)
          </div>
          <div className="flex flex-col gap-1">
            {Array.from({ length: step.maxBits }, (_, i) => step.maxBits - 1 - i).map(
              (bit) => (
                <div key={bit} className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground font-mono w-16">
                    bit {bit}:
                  </div>
                  <div className={getBasisCellClass(bit, step)}>
                    {step.basis[bit] !== 0
                      ? `${step.basis[bit]} (${toBinaryStr(step.basis[bit], step.maxBits)})`
                      : "---"}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            基底サイズ: <span className="font-mono font-semibold text-foreground">
              {step.basis.filter((b) => b !== 0).length}
            </span>
          </span>
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
            <span>処理中の値</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>確認中のビット/現在値</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>基底に挿入</span>
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
              setCurrentStep((prev) =>
                Math.min(steps.length - 1, prev + 1)
              );
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
