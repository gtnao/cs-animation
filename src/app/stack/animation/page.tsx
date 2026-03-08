"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type OperationType = "push" | "pop" | "peek";

interface Operation {
  type: OperationType;
  value?: number;
}

type StepType =
  | "init"
  | "push"
  | "pop"
  | "pop_empty"
  | "peek"
  | "peek_empty"
  | "done";

interface Step {
  type: StepType;
  stack: number[];
  highlightIndex: number;
  operation: string;
  description: string;
}

// --- Step generation ---

function generateSteps(operations: Operation[]): Step[] {
  const steps: Step[] = [];
  const stack: number[] = [];

  steps.push({
    type: "init",
    stack: [],
    highlightIndex: -1,
    operation: "",
    description: "空のスタックを初期化",
  });

  for (const op of operations) {
    switch (op.type) {
      case "push": {
        const val = op.value!;
        stack.push(val);
        steps.push({
          type: "push",
          stack: [...stack],
          highlightIndex: stack.length - 1,
          operation: `push(${val})`,
          description: `${val} をスタックの先頭に追加。スタックサイズ: ${stack.length}`,
        });
        break;
      }
      case "pop": {
        if (stack.length === 0) {
          steps.push({
            type: "pop_empty",
            stack: [],
            highlightIndex: -1,
            operation: "pop()",
            description: "スタックが空のため pop できない",
          });
        } else {
          const val = stack.pop()!;
          steps.push({
            type: "pop",
            stack: [...stack],
            highlightIndex: -1,
            operation: `pop() → ${val}`,
            description: `先頭の ${val} を取り出した。スタックサイズ: ${stack.length}`,
          });
        }
        break;
      }
      case "peek": {
        if (stack.length === 0) {
          steps.push({
            type: "peek_empty",
            stack: [],
            highlightIndex: -1,
            operation: "peek()",
            description: "スタックが空のため peek できない",
          });
        } else {
          steps.push({
            type: "peek",
            stack: [...stack],
            highlightIndex: stack.length - 1,
            operation: `peek() → ${stack[stack.length - 1]}`,
            description: `先頭の要素は ${stack[stack.length - 1]}。スタックは変化しない`,
          });
        }
        break;
      }
    }
  }

  steps.push({
    type: "done",
    stack: [...stack],
    highlightIndex: -1,
    operation: "",
    description: "全操作完了",
  });

  return steps;
}

// --- Default operations ---

const defaultOperations: Operation[] = [
  { type: "push", value: 3 },
  { type: "push", value: 7 },
  { type: "push", value: 1 },
  { type: "peek" },
  { type: "pop" },
  { type: "push", value: 5 },
  { type: "pop" },
  { type: "pop" },
];

// --- Component ---

export default function StackAnimationPage() {
  const [inputValue, setInputValue] = useState("");
  const [operations, setOperations] = useState<Operation[]>([
    ...defaultOperations,
  ]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((ops: Operation[]) => {
    setSteps(generateSteps(ops));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(operations);
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
    }, 600);
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

  const addOperation = (type: OperationType) => {
    if (type === "push") {
      const val = parseInt(inputValue);
      if (isNaN(val)) return;
      setOperations((prev) => [...prev, { type: "push", value: val }]);
      setInputValue("");
    } else {
      setOperations((prev) => [...prev, { type }]);
    }
  };

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Stack</h1>
        <p className="text-sm text-muted-foreground mb-6">
          LIFO (Last In, First Out) の原則に基づくデータ構造
        </p>

        {/* Operation builder */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            操作を追加
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addOperation("push");
                }}
                placeholder="値"
                className="font-mono w-20"
              />
              <Button
                onClick={() => addOperation("push")}
                variant="outline"
                size="sm"
              >
                Push
              </Button>
            </div>
            <Button
              onClick={() => addOperation("pop")}
              variant="outline"
              size="sm"
            >
              Pop
            </Button>
            <Button
              onClick={() => addOperation("peek")}
              variant="outline"
              size="sm"
            >
              Peek
            </Button>
          </div>
        </div>

        {/* Operation list */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            操作列
          </div>
          <div className="flex gap-1 flex-wrap">
            {operations.map((op, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs font-mono border border-border rounded bg-muted"
              >
                {op.type === "push" ? `push(${op.value})` : `${op.type}()`}
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => run(operations)} variant="outline" size="sm">
              実行
            </Button>
            <Button
              onClick={() => {
                setOperations([]);
              }}
              variant="outline"
              size="sm"
            >
              クリア
            </Button>
            <Button
              onClick={() => {
                setOperations([...defaultOperations]);
                run([...defaultOperations]);
              }}
              variant="outline"
              size="sm"
            >
              デフォルトに戻す
            </Button>
          </div>
        </div>

        {/* Stack visualization */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            スタック (上が先頭)
          </div>
          <div className="flex flex-col-reverse items-center gap-1 min-h-[60px]">
            {step.stack.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">
                (空)
              </div>
            ) : (
              step.stack.map((val, idx) => {
                const isTop = idx === step.stack.length - 1;
                let cls =
                  "w-16 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
                if (idx === step.highlightIndex) {
                  if (step.type === "push") {
                    cls += " bg-emerald-100 border-emerald-500";
                  } else if (step.type === "peek") {
                    cls += " bg-blue-100 border-blue-400";
                  } else {
                    cls += " bg-blue-100 border-blue-400";
                  }
                } else {
                  cls += " bg-white border-gray-200";
                }
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={cls}>{val}</div>
                    {isTop && (
                      <span className="text-xs text-muted-foreground">
                        ← top
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Current operation */}
        {step.operation && (
          <div className="mb-3">
            <span className="text-sm font-mono font-semibold text-foreground">
              {step.operation}
            </span>
          </div>
        )}

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            サイズ:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.stack.length}
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
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>追加された要素</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>参照中の要素</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200" />
            <span>デフォルト</span>
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
