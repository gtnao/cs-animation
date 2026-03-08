"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "build_match"
  | "build_mismatch"
  | "build_fallback"
  | "build_done"
  | "search_match"
  | "search_mismatch"
  | "search_fallback"
  | "search_found"
  | "done";

interface Step {
  type: StepType;
  phase: "build" | "search";
  pi: number[];
  i: number;
  j: number;
  textPos?: number;
  patternPos?: number;
  foundPositions: number[];
  description: string;
}

// --- Failure function (pi) build steps ---

function generateSteps(text: string, pattern: string): Step[] {
  const steps: Step[] = [];
  const n = text.length;
  const m = pattern.length;
  if (m === 0 || n === 0) return [];

  const pi = new Array(m).fill(0);

  steps.push({
    type: "init",
    phase: "build",
    pi: [...pi],
    i: 0,
    j: 0,
    foundPositions: [],
    description: `失敗関数 (π配列) を構築開始。パターン: "${pattern}"`,
  });

  // Build failure function
  let k = 0;
  for (let q = 1; q < m; q++) {
    while (k > 0 && pattern[k] !== pattern[q]) {
      steps.push({
        type: "build_mismatch",
        phase: "build",
        pi: [...pi],
        i: q,
        j: k,
        foundPositions: [],
        description: `P[${k}]='${pattern[k]}' と P[${q}]='${pattern[q]}' が不一致。k = π[${k - 1}] = ${pi[k - 1]} にフォールバック`,
      });
      k = pi[k - 1];
    }
    if (pattern[k] === pattern[q]) {
      steps.push({
        type: "build_match",
        phase: "build",
        pi: [...pi],
        i: q,
        j: k,
        foundPositions: [],
        description: `P[${k}]='${pattern[k]}' と P[${q}]='${pattern[q]}' が一致。k を ${k + 1} に増加`,
      });
      k++;
    } else {
      steps.push({
        type: "build_mismatch",
        phase: "build",
        pi: [...pi],
        i: q,
        j: k,
        foundPositions: [],
        description: `P[${k}]='${pattern[k]}' と P[${q}]='${pattern[q]}' が不一致。π[${q}] = 0`,
      });
    }
    pi[q] = k;
    steps.push({
      type: "build_fallback",
      phase: "build",
      pi: [...pi],
      i: q,
      j: k,
      foundPositions: [],
      description: `π[${q}] = ${k} 確定`,
    });
  }

  steps.push({
    type: "build_done",
    phase: "build",
    pi: [...pi],
    i: m - 1,
    j: k,
    foundPositions: [],
    description: `失敗関数の構築完了。検索を開始`,
  });

  // Search phase
  let j = 0;
  const foundPositions: number[] = [];

  for (let i = 0; i < n; i++) {
    while (j > 0 && pattern[j] !== text[i]) {
      steps.push({
        type: "search_mismatch",
        phase: "search",
        pi: [...pi],
        i: i,
        j: j,
        textPos: i,
        patternPos: j,
        foundPositions: [...foundPositions],
        description: `T[${i}]='${text[i]}' と P[${j}]='${pattern[j]}' が不一致。j = π[${j - 1}] = ${pi[j - 1]} にフォールバック`,
      });
      j = pi[j - 1];
    }

    if (pattern[j] === text[i]) {
      steps.push({
        type: "search_match",
        phase: "search",
        pi: [...pi],
        i: i,
        j: j,
        textPos: i,
        patternPos: j,
        foundPositions: [...foundPositions],
        description: `T[${i}]='${text[i]}' と P[${j}]='${pattern[j]}' が一致`,
      });
      j++;
    } else {
      steps.push({
        type: "search_mismatch",
        phase: "search",
        pi: [...pi],
        i: i,
        j: j,
        textPos: i,
        patternPos: j,
        foundPositions: [...foundPositions],
        description: `T[${i}]='${text[i]}' と P[${j}]='${pattern[j]}' が不一致`,
      });
    }

    if (j === m) {
      foundPositions.push(i - m + 1);
      steps.push({
        type: "search_found",
        phase: "search",
        pi: [...pi],
        i: i,
        j: j,
        textPos: i,
        patternPos: j,
        foundPositions: [...foundPositions],
        description: `パターンが位置 ${i - m + 1} で見つかった！ j = π[${j - 1}] = ${pi[j - 1]} にフォールバック`,
      });
      j = pi[j - 1];
    }
  }

  steps.push({
    type: "done",
    phase: "search",
    pi: [...pi],
    i: n,
    j: j,
    foundPositions: [...foundPositions],
    description: `検索完了。${foundPositions.length} 箇所で一致: [${foundPositions.join(", ")}]`,
  });

  return steps;
}

// --- Cell styling ---

function getTextCellClass(idx: number, step: Step): string {
  const base =
    "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (step.phase === "search") {
    if (step.type === "search_found") {
      const matchStart =
        step.textPos !== undefined ? step.textPos - step.j + 1 : -1;
      if (idx >= matchStart && idx <= (step.textPos ?? -1)) {
        return `${base} bg-emerald-100 border-emerald-500`;
      }
    }
    if (step.textPos !== undefined && idx === step.textPos) {
      if (step.type === "search_match") {
        return `${base} bg-emerald-100 border-emerald-500`;
      }
      if (step.type === "search_mismatch") {
        return `${base} bg-red-100 border-red-500`;
      }
      return `${base} bg-blue-100 border-blue-400`;
    }
    // Highlight pattern alignment window
    if (step.textPos !== undefined && step.j !== undefined) {
      const alignStart = step.textPos - (step.type === "search_match" ? step.j : Math.max(0, step.j - 1));
      if (idx >= alignStart && idx < alignStart + step.pi.length && idx < (step.textPos ?? 0)) {
        return `${base} bg-amber-50 border-amber-400`;
      }
    }
    // Found positions highlight
    if (step.type === "done") {
      for (const pos of step.foundPositions) {
        if (idx >= pos && idx < pos + step.pi.length) {
          return `${base} bg-emerald-100 border-emerald-500`;
        }
      }
    }
  }

  return `${base} bg-white border-gray-200`;
}

function getPatternCellClass(idx: number, step: Step): string {
  const base =
    "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (step.phase === "build") {
    if (idx === step.i) {
      if (step.type === "build_match") {
        return `${base} bg-emerald-100 border-emerald-500`;
      }
      if (step.type === "build_mismatch") {
        return `${base} bg-red-100 border-red-500`;
      }
      return `${base} bg-blue-100 border-blue-400`;
    }
    if (idx === step.j) {
      if (step.type === "build_match") {
        return `${base} bg-emerald-100 border-emerald-500`;
      }
      if (step.type === "build_mismatch") {
        return `${base} bg-red-100 border-red-500`;
      }
      return `${base} bg-amber-50 border-amber-400`;
    }
  }

  if (step.phase === "search" && step.patternPos !== undefined) {
    if (idx === step.patternPos) {
      if (step.type === "search_match") {
        return `${base} bg-emerald-100 border-emerald-500`;
      }
      if (step.type === "search_mismatch") {
        return `${base} bg-red-100 border-red-500`;
      }
    }
    if (step.type === "search_found" && idx < step.j) {
      return `${base} bg-emerald-100 border-emerald-500`;
    }
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function KMPAnimationPage() {
  const [textInput, setTextInput] = useState("ababcababababcabab");
  const [patternInput, setPatternInput] = useState("ababcabab");
  const [text, setText] = useState("ababcababababcabab");
  const [pattern, setPattern] = useState("ababcabab");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((t: string, p: string) => {
    const tt = t.trim();
    const pp = p.trim();
    if (tt.length === 0 || pp.length === 0) return;
    setText(tt);
    setPattern(pp);
    setSteps(generateSteps(tt, pp));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(textInput, patternInput);
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

  return (
    <>
{/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="テキスト"
            className="font-mono max-w-xs"
          />
          <Input
            value={patternInput}
            onChange={(e) => setPatternInput(e.target.value)}
            placeholder="パターン"
            className="font-mono max-w-xs"
          />
          <Button
            onClick={() => run(textInput, patternInput)}
            variant="outline"
          >
            実行
          </Button>
        </div>

        {/* Phase indicator */}
        <div className="mb-4">
          <span className="text-xs font-semibold px-2 py-1 rounded bg-muted border border-border">
            {step.phase === "build" ? "Phase 1: 失敗関数構築" : "Phase 2: テキスト検索"}
          </span>
        </div>

        {/* Text */}
        {step.phase === "search" && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              テキスト
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {text.split("").map((c, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={getTextCellClass(idx, step)}>{c}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {idx}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pattern */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            パターン
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {pattern.split("").map((c, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getPatternCellClass(idx, step)}>{c}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pi array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            失敗関数 π
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.pi.map((val, idx) => {
              const computed =
                step.phase === "search" ||
                step.type === "build_done" ||
                idx < step.i ||
                (idx === step.i && step.type === "build_fallback");
              const active = idx === step.i && step.type === "build_fallback";

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
          {step.phase === "build" && step.type !== "init" && (
            <>
              <span>
                q = <span className="font-mono font-semibold text-foreground">{step.i}</span>
              </span>
              <span>
                k = <span className="font-mono font-semibold text-foreground">{step.j}</span>
              </span>
            </>
          )}
          {step.phase === "search" && step.type !== "done" && (
            <>
              <span>
                i = <span className="font-mono font-semibold text-foreground">{step.i}</span>
              </span>
              <span>
                j = <span className="font-mono font-semibold text-foreground">{step.j}</span>
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
            <span>現在位置</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>比較対象</span>
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
