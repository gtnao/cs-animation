"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type TransformMode = "zeta_super" | "mobius_super" | "zeta_sub" | "mobius_sub";

type StepType = "init" | "process_bit" | "update" | "done";

interface Step {
  type: StepType;
  array: number[];
  n: number;
  bit: number;
  totalBits: number;
  i?: number;
  j?: number;
  mode: TransformMode;
  description: string;
}

// --- Helpers ---

function binaryStr(x: number, bits: number): string {
  return x.toString(2).padStart(bits, "0");
}

// --- Algorithm step generation ---

function generateSteps(values: number[], mode: TransformMode): Step[] {
  const steps: Step[] = [];
  const n = values.length;
  const bits = Math.round(Math.log2(n));

  if ((1 << bits) !== n) {
    steps.push({
      type: "init",
      array: [...values],
      n,
      bit: 0,
      totalBits: 0,
      mode,
      description: `配列の長さは 2^n の形でなければなりません (現在: ${n})`,
    });
    return steps;
  }

  const modeNames: Record<TransformMode, string> = {
    zeta_super: "上位集合ゼータ変換",
    mobius_super: "上位集合メビウス変換",
    zeta_sub: "下位集合ゼータ変換",
    mobius_sub: "下位集合メビウス変換",
  };

  const a = [...values];

  steps.push({
    type: "init",
    array: [...a],
    n,
    bit: 0,
    totalBits: bits,
    mode,
    description: `${modeNames[mode]}: f = [${a.join(", ")}], ${bits}ビット`,
  });

  for (let bit = 0; bit < bits; bit++) {
    steps.push({
      type: "process_bit",
      array: [...a],
      n,
      bit,
      totalBits: bits,
      mode,
      description: `ビット ${bit} を処理中 (2^${bit} = ${1 << bit})`,
    });

    for (let i = 0; i < n; i++) {
      if (i & (1 << bit)) continue; // only process where bit is 0
      const j = i | (1 << bit);

      if (mode === "zeta_super") {
        // f[S] += f[S | {bit}]
        a[i] += a[j];
      } else if (mode === "mobius_super") {
        a[i] -= a[j];
      } else if (mode === "zeta_sub") {
        // f[S | {bit}] += f[S]
        a[j] += a[i];
      } else {
        // mobius_sub
        a[j] -= a[i];
      }

      steps.push({
        type: "update",
        array: [...a],
        n,
        bit,
        totalBits: bits,
        i,
        j,
        mode,
        description:
          mode === "zeta_super"
            ? `f[${binaryStr(i, bits)}] += f[${binaryStr(j, bits)}] → f[${binaryStr(i, bits)}] = ${a[i]}`
            : mode === "mobius_super"
              ? `f[${binaryStr(i, bits)}] -= f[${binaryStr(j, bits)}] → f[${binaryStr(i, bits)}] = ${a[i]}`
              : mode === "zeta_sub"
                ? `f[${binaryStr(j, bits)}] += f[${binaryStr(i, bits)}] → f[${binaryStr(j, bits)}] = ${a[j]}`
                : `f[${binaryStr(j, bits)}] -= f[${binaryStr(i, bits)}] → f[${binaryStr(j, bits)}] = ${a[j]}`,
      });
    }
  }

  steps.push({
    type: "done",
    array: [...a],
    n,
    bit: bits,
    totalBits: bits,
    mode,
    description: `${modeNames[mode]}完了: [${a.join(", ")}]`,
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(idx: number, step: Step): string {
  const base =
    "min-w-[3rem] h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors px-1";

  if (step.type === "update") {
    if (idx === step.i || idx === step.j) {
      return `${base} bg-blue-100 border-blue-400`;
    }
    // Highlight cells in current bit group
    if (step.bit !== undefined) {
      const bitMask = 1 << step.bit;
      if (!(idx & bitMask) || idx === step.j) {
        return `${base} bg-amber-50 border-amber-400`;
      }
    }
  }

  if (step.type === "done") {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function ZetaMobiusTransformAnimationPage() {
  const [input, setInput] = useState("1,2,3,4,5,6,7,8");
  const [mode, setMode] = useState<TransformMode>("zeta_sub");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string, m: TransformMode) => {
    const vals = s
      .split(",")
      .map((x) => parseInt(x.trim(), 10))
      .filter((x) => !isNaN(x));
    if (vals.length === 0) return;
    // Pad to next power of 2
    let len = 1;
    while (len < vals.length) len <<= 1;
    while (vals.length < len) vals.push(0);
    setSteps(generateSteps(vals, m));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(input, mode);
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
    }, 500);
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

  const modeLabels: Record<TransformMode, string> = {
    zeta_super: "上位集合ゼータ",
    mobius_super: "上位集合メビウス",
    zeta_sub: "下位集合ゼータ",
    mobius_sub: "下位集合メビウス",
  };

  return (
    <>
<div className="flex flex-wrap gap-2 mb-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input, mode);
            }}
            placeholder="値 (2^n 個)"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(input, mode)} variant="outline">
            実行
          </Button>
        </div>

        <div className="flex flex-wrap gap-1 mb-8">
          {(
            [
              "zeta_sub",
              "mobius_sub",
              "zeta_super",
              "mobius_super",
            ] as TransformMode[]
          ).map((m) => (
            <Button
              key={m}
              variant={mode === m ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMode(m);
                run(input, m);
              }}
            >
              {modeLabels[m]}
            </Button>
          ))}
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            配列 (ビット {step.bit}/{step.totalBits})
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.array.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step)}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {binaryStr(idx, step.totalBits)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            ビット{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.bit}/{step.totalBits}
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
            <span>更新対象ペア</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>現在のビットグループ</span>
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
