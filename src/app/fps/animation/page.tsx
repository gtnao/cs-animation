"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type OpType = "add" | "sub" | "mul" | "derivative" | "integral";

type StepType =
  | "init"
  | "compute"
  | "result"
  | "done";

interface Step {
  type: StepType;
  arrayA: number[];
  arrayB: number[];
  result: number[];
  op: OpType;
  highlightIdx?: number;
  description: string;
}

// --- Helpers ---

function polyAdd(a: number[], b: number[]): number[] {
  const n = Math.max(a.length, b.length);
  const c = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    c[i] = (i < a.length ? a[i] : 0) + (i < b.length ? b[i] : 0);
  }
  return c;
}

function polySub(a: number[], b: number[]): number[] {
  const n = Math.max(a.length, b.length);
  const c = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    c[i] = (i < a.length ? a[i] : 0) - (i < b.length ? b[i] : 0);
  }
  return c;
}

function polyMul(a: number[], b: number[]): number[] {
  if (a.length === 0 || b.length === 0) return [0];
  const n = a.length + b.length - 1;
  const c = new Array(n).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      c[i + j] += a[i] * b[j];
    }
  }
  return c;
}

function polyDerivative(a: number[]): number[] {
  if (a.length <= 1) return [0];
  const c = new Array(a.length - 1).fill(0);
  for (let i = 1; i < a.length; i++) {
    c[i - 1] = a[i] * i;
  }
  return c;
}

function polyIntegral(a: number[]): number[] {
  const c = new Array(a.length + 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    c[i + 1] = a[i] / (i + 1);
  }
  return c;
}

// --- Algorithm step generation ---

function generateSteps(
  aCoeffs: number[],
  bCoeffs: number[],
  op: OpType
): Step[] {
  const steps: Step[] = [];
  const a = [...aCoeffs];
  const b = [...bCoeffs];

  const opNames: Record<OpType, string> = {
    add: "加算",
    sub: "減算",
    mul: "乗算",
    derivative: "微分",
    integral: "積分",
  };

  steps.push({
    type: "init",
    arrayA: [...a],
    arrayB: [...b],
    result: [],
    op,
    description: `FPS ${opNames[op]}: A = [${a.join(", ")}]${op !== "derivative" && op !== "integral" ? `, B = [${b.join(", ")}]` : ""}`,
  });

  let result: number[];

  if (op === "add") {
    const n = Math.max(a.length, b.length);
    const partial = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      partial[i] = (i < a.length ? a[i] : 0) + (i < b.length ? b[i] : 0);
      steps.push({
        type: "compute",
        arrayA: [...a],
        arrayB: [...b],
        result: [...partial],
        op,
        highlightIdx: i,
        description: `c[${i}] = a[${i}] + b[${i}] = ${i < a.length ? a[i] : 0} + ${i < b.length ? b[i] : 0} = ${partial[i]}`,
      });
    }
    result = polyAdd(a, b);
  } else if (op === "sub") {
    const n = Math.max(a.length, b.length);
    const partial = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      partial[i] = (i < a.length ? a[i] : 0) - (i < b.length ? b[i] : 0);
      steps.push({
        type: "compute",
        arrayA: [...a],
        arrayB: [...b],
        result: [...partial],
        op,
        highlightIdx: i,
        description: `c[${i}] = a[${i}] - b[${i}] = ${i < a.length ? a[i] : 0} - ${i < b.length ? b[i] : 0} = ${partial[i]}`,
      });
    }
    result = polySub(a, b);
  } else if (op === "mul") {
    const n = a.length + b.length - 1;
    const partial = new Array(n).fill(0);
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        partial[i + j] += a[i] * b[j];
      }
      steps.push({
        type: "compute",
        arrayA: [...a],
        arrayB: [...b],
        result: [...partial],
        op,
        highlightIdx: i,
        description: `a[${i}] = ${a[i]} を b の各項と掛けて加算`,
      });
    }
    result = polyMul(a, b);
  } else if (op === "derivative") {
    result = polyDerivative(a);
    for (let i = 0; i < result.length; i++) {
      const partial = new Array(result.length).fill(0);
      for (let j = 0; j <= i; j++) partial[j] = result[j];
      steps.push({
        type: "compute",
        arrayA: [...a],
        arrayB: [],
        result: [...partial],
        op,
        highlightIdx: i,
        description: `c[${i}] = a[${i + 1}] * ${i + 1} = ${a[i + 1]} * ${i + 1} = ${result[i]}`,
      });
    }
  } else {
    result = polyIntegral(a);
    for (let i = 1; i < result.length; i++) {
      const partial = new Array(result.length).fill(0);
      for (let j = 0; j <= i; j++) partial[j] = result[j];
      steps.push({
        type: "compute",
        arrayA: [...a],
        arrayB: [],
        result: [...partial],
        op,
        highlightIdx: i,
        description: `c[${i}] = a[${i - 1}] / ${i} = ${a[i - 1]} / ${i} = ${result[i].toFixed(4)}`,
      });
    }
  }

  steps.push({
    type: "done",
    arrayA: [...a],
    arrayB: [...b],
    result: result.map((x) => Math.round(x * 10000) / 10000),
    op,
    description: `${opNames[op]}完了: [${result.map((x) => Math.round(x * 10000) / 10000).join(", ")}]`,
  });

  return steps;
}

// --- Cell styling ---

function getCellClass(
  idx: number,
  step: Step,
  target: "a" | "b" | "result"
): string {
  const base =
    "min-w-[3.5rem] h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors px-1";

  if (target === "result") {
    if (step.type === "done") {
      return `${base} bg-emerald-100 border-emerald-500`;
    }
    if (step.type === "compute" && idx === step.highlightIdx) {
      return `${base} bg-blue-100 border-blue-400`;
    }
    if (
      step.type === "compute" &&
      step.highlightIdx !== undefined &&
      idx < step.highlightIdx
    ) {
      return `${base} bg-amber-50 border-amber-400`;
    }
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function FPSAnimationPage() {
  const [inputA, setInputA] = useState("1,2,3,4");
  const [inputB, setInputB] = useState("5,6,7,8");
  const [op, setOp] = useState<OpType>("mul");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((sA: string, sB: string, operation: OpType) => {
    const a = sA
      .split(",")
      .map((x) => parseFloat(x.trim()))
      .filter((x) => !isNaN(x));
    const b = sB
      .split(",")
      .map((x) => parseFloat(x.trim()))
      .filter((x) => !isNaN(x));
    if (a.length === 0) return;
    setSteps(generateSteps(a, b.length > 0 ? b : [0], operation));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputA, inputB, op);
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

  const opLabels: Record<OpType, string> = {
    add: "加算",
    sub: "減算",
    mul: "乗算",
    derivative: "微分",
    integral: "積分",
  };

  return (
    <>
<div className="flex flex-wrap gap-2 mb-4">
          <Input
            value={inputA}
            onChange={(e) => setInputA(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputA, inputB, op);
            }}
            placeholder="A の係数"
            className="font-mono max-w-[12rem]"
          />
          {op !== "derivative" && op !== "integral" && (
            <Input
              value={inputB}
              onChange={(e) => setInputB(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") run(inputA, inputB, op);
              }}
              placeholder="B の係数"
              className="font-mono max-w-[12rem]"
            />
          )}
          <Button onClick={() => run(inputA, inputB, op)} variant="outline">
            実行
          </Button>
        </div>

        <div className="flex flex-wrap gap-1 mb-8">
          {(["add", "sub", "mul", "derivative", "integral"] as OpType[]).map(
            (o) => (
              <Button
                key={o}
                variant={op === o ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setOp(o);
                  run(inputA, inputB, o);
                }}
              >
                {opLabels[o]}
              </Button>
            )
          )}
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            A(x)
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.arrayA.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx, step, "a")}>{val}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  x^{idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        {step.op !== "derivative" && step.op !== "integral" && (
          <div className="mb-4">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              B(x)
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {step.arrayB.map((val, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={getCellClass(idx, step, "b")}>{val}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    x^{idx}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            結果
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.result.length > 0 ? (
              step.result.map((val, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={getCellClass(idx, step, "result")}>
                    {Number.isInteger(val) ? val : val.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    x^{idx}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                (まだ計算されていません)
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
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
            <span>現在計算中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>計算済み</span>
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
