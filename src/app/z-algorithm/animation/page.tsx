"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "copy_from_zbox"
  | "compare_match"
  | "compare_mismatch"
  | "update_zbox"
  | "complete_index"
  | "done";

interface Step {
  type: StepType;
  i: number;
  l: number;
  r: number;
  z: number[];
  compareIndices?: [number, number];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(s: string): Step[] {
  const n = s.length;
  if (n === 0) return [];

  const steps: Step[] = [];
  const z = new Array(n).fill(0);
  z[0] = n;
  let l = 0;
  let r = 0;

  steps.push({
    type: "init",
    i: -1,
    l,
    r,
    z: [...z],
    description: `Z配列を初期化。Z[0] = ${n}（文字列全体の長さ）`,
  });

  for (let i = 1; i < n; i++) {
    if (i < r) {
      const k = i - l;
      z[i] = Math.min(r - i, z[k]);
      steps.push({
        type: "copy_from_zbox",
        i,
        l,
        r,
        z: [...z],
        description: `i=${i} はZ-box [${l}, ${r}) 内。k = i−l = ${k}, Z[${i}] = min(r−i, Z[k]) = min(${r - i}, ${z[k]}) = ${z[i]}`,
      });
    }

    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) {
      steps.push({
        type: "compare_match",
        i,
        l,
        r,
        z: [...z],
        compareIndices: [z[i], i + z[i]],
        description: `s[${z[i]}] = '${s[z[i]]}' と s[${i + z[i]}] = '${s[i + z[i]]}' を比較 → 一致`,
      });
      z[i]++;
    }

    if (i + z[i] < n) {
      steps.push({
        type: "compare_mismatch",
        i,
        l,
        r,
        z: [...z],
        compareIndices: [z[i], i + z[i]],
        description: `s[${z[i]}] = '${s[z[i]]}' と s[${i + z[i]}] = '${s[i + z[i]]}' を比較 → 不一致`,
      });
    }

    if (i + z[i] > r) {
      l = i;
      r = i + z[i];
      steps.push({
        type: "update_zbox",
        i,
        l,
        r,
        z: [...z],
        description: `Z-box を [${l}, ${r}) に更新`,
      });
    }

    steps.push({
      type: "complete_index",
      i,
      l,
      r,
      z: [...z],
      description: `Z[${i}] = ${z[i]} 確定`,
    });
  }

  steps.push({
    type: "done",
    i: n,
    l,
    r,
    z: [...z],
    description: "アルゴリズム完了",
  });

  return steps;
}

// --- Cell styling ---

function getCharCellClass(idx: number, step: Step): string {
  const base =
    "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (step.compareIndices) {
    const [a, b] = step.compareIndices;
    if (idx === a || idx === b) {
      if (step.type === "compare_match") {
        return `${base} bg-emerald-100 border-emerald-500`;
      }
      if (step.type === "compare_mismatch") {
        return `${base} bg-red-100 border-red-500`;
      }
    }
  }

  if (idx === step.i && step.i >= 1 && step.type !== "done") {
    return `${base} bg-blue-100 border-blue-400`;
  }

  if (step.r > step.l && idx >= step.l && idx < step.r) {
    return `${base} bg-amber-50 border-amber-400`;
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function ZAlgorithmPage() {
  const [input, setInput] = useState("aabxaab");
  const [text, setText] = useState("aabxaab");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const trimmed = s.trim();
    if (trimmed.length === 0) return;
    setText(trimmed);
    setSteps(generateSteps(trimmed));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(input);
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
    }, 500);
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

  const n = text.length;

  return (
    <>
        {/* Input */}
        <div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="文字列を入力"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* String */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            文字列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {text.split("").map((c, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCharCellClass(idx, step)}>{c}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {idx}
                </div>
              </div>
            ))}
          </div>
          {/* Z-box bar */}
          {step.r > step.l && (
            <div className="flex gap-1 mt-1">
              {Array.from({ length: n }, (_, idx) => (
                <div
                  key={idx}
                  className={`w-10 h-1 ${
                    idx >= step.l && idx < step.r
                      ? "bg-amber-400"
                      : "bg-transparent"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Z-array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Z配列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.z.map((val, idx) => {
              const computed =
                idx === 0 ||
                step.type === "done" ||
                (step.i >= 1 && idx < step.i) ||
                (idx === step.i && step.type === "complete_index");
              const active =
                idx === step.i && step.type === "complete_index";

              let cls =
                "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              if (active) {
                cls += " bg-blue-100 border-blue-400 font-bold";
              } else if (computed) {
                cls += " bg-white border-gray-300";
              } else {
                cls += " bg-gray-50 border-gray-200 text-muted-foreground";
              }

              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{computed ? val : "–"}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {idx}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.i >= 1 && step.type !== "done" && (
            <>
              <span>
                i = <span className="font-mono font-semibold text-foreground">{step.i}</span>
              </span>
              <span>
                Z-box ={" "}
                <span className="font-mono font-semibold text-foreground">
                  [{step.l}, {step.r})
                </span>
              </span>
            </>
          )}
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
            <span>現在のi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>Z-box</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>一致</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>不一致</span>
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
    </>
  );
}
