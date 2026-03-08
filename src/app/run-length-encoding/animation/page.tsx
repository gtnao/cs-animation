"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "scan" | "extend" | "emit" | "done";

interface RLEPair {
  char: string;
  count: number;
}

interface Step {
  type: StepType;
  input: string;
  currentIndex: number;
  runStart: number;
  runChar: string;
  runLength: number;
  result: RLEPair[];
  description: string;
}

function generateSteps(s: string): Step[] {
  const steps: Step[] = [];
  if (s.length === 0) return [];

  const result: RLEPair[] = [];

  steps.push({
    type: "init",
    input: s,
    currentIndex: -1,
    runStart: 0,
    runChar: s[0],
    runLength: 0,
    result: [],
    description: `入力文字列: "${s}"。ランレングス圧縮を開始`,
  });

  let runStart = 0;
  let runChar = s[0];
  let runLength = 1;

  steps.push({
    type: "scan",
    input: s,
    currentIndex: 0,
    runStart: 0,
    runChar,
    runLength: 1,
    result: [...result],
    description: `i=0: 文字 '${s[0]}' からランを開始。長さ=1`,
  });

  for (let i = 1; i < s.length; i++) {
    if (s[i] === runChar) {
      runLength++;
      steps.push({
        type: "extend",
        input: s,
        currentIndex: i,
        runStart,
        runChar,
        runLength,
        result: [...result],
        description: `i=${i}: '${s[i]}' は現在のラン '${runChar}' と一致。長さ=${runLength}`,
      });
    } else {
      result.push({ char: runChar, count: runLength });
      steps.push({
        type: "emit",
        input: s,
        currentIndex: i,
        runStart,
        runChar,
        runLength,
        result: [...result],
        description: `i=${i}: '${s[i]}' は '${runChar}' と不一致。ラン ('${runChar}', ${runLength}) を出力`,
      });
      runStart = i;
      runChar = s[i];
      runLength = 1;
      steps.push({
        type: "scan",
        input: s,
        currentIndex: i,
        runStart: i,
        runChar,
        runLength: 1,
        result: [...result],
        description: `i=${i}: 新しいラン '${runChar}' を開始。長さ=1`,
      });
    }
  }

  result.push({ char: runChar, count: runLength });
  steps.push({
    type: "emit",
    input: s,
    currentIndex: s.length - 1,
    runStart,
    runChar,
    runLength,
    result: [...result],
    description: `最後のラン ('${runChar}', ${runLength}) を出力`,
  });

  steps.push({
    type: "done",
    input: s,
    currentIndex: -1,
    runStart: -1,
    runChar: "",
    runLength: 0,
    result: [...result],
    description: `圧縮完了: ${result.map((p) => `(${p.char},${p.count})`).join(" ")}`,
  });

  return steps;
}

function getCharCellClass(idx: number, step: Step): string {
  const base =
    "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";

  if (step.type === "done") {
    return `${base} bg-white border-gray-200`;
  }

  if (idx === step.currentIndex) {
    if (step.type === "emit") {
      return `${base} bg-red-100 border-red-500`;
    }
    return `${base} bg-blue-100 border-blue-400`;
  }

  if (idx >= step.runStart && idx < step.currentIndex) {
    return `${base} bg-amber-50 border-amber-400`;
  }

  if (step.type === "extend" && idx >= step.runStart && idx <= step.currentIndex) {
    return `${base} bg-amber-50 border-amber-400`;
  }

  return `${base} bg-white border-gray-200`;
}

export default function RunLengthEncodingAnimationPage() {
  const [input, setInput] = useState("aaabbbccddddee");
  const [text, setText] = useState("aaabbbccddddee");
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">ランレングス圧縮</h1>
        <p className="text-sm text-muted-foreground mb-6">
          連続する同一文字をその文字と出現回数のペアに圧縮
        </p>

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

        {/* Input string */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            入力文字列
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
        </div>

        {/* Result */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            圧縮結果
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {step.result.map((pair, idx) => (
              <div
                key={idx}
                className="px-3 py-2 border-2 border-emerald-500 bg-emerald-100 rounded text-sm font-mono"
              >
                ({pair.char}, {pair.count})
              </div>
            ))}
            {step.result.length === 0 && (
              <div className="text-sm text-muted-foreground">（まだ出力なし）</div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.type !== "init" && step.type !== "done" && (
            <span>
              現在のラン: <span className="font-mono font-semibold text-foreground">&apos;{step.runChar}&apos; x {step.runLength}</span>
            </span>
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
            <span>現在のラン</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>出力済み</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>不一致</span>
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
      </div>
    </div>
  );
}
