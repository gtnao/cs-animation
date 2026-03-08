"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type OperationType =
  | "push_front"
  | "push_back"
  | "pop_front"
  | "pop_back"
  | "peek_front"
  | "peek_back";

interface Operation {
  type: OperationType;
  value?: number;
}

type StepType =
  | "init"
  | "push_front"
  | "push_back"
  | "pop_front"
  | "pop_back"
  | "pop_empty"
  | "peek_front"
  | "peek_back"
  | "peek_empty"
  | "done";

interface Step {
  type: StepType;
  deque: number[];
  highlightIndex: number;
  operation: string;
  description: string;
}

// --- Step generation ---

function generateSteps(operations: Operation[]): Step[] {
  const steps: Step[] = [];
  const deque: number[] = [];

  steps.push({
    type: "init",
    deque: [],
    highlightIndex: -1,
    operation: "",
    description: "空の両端キューを初期化",
  });

  for (const op of operations) {
    switch (op.type) {
      case "push_front": {
        const val = op.value!;
        deque.unshift(val);
        steps.push({
          type: "push_front",
          deque: [...deque],
          highlightIndex: 0,
          operation: `push_front(${val})`,
          description: `${val} を先頭に追加。サイズ: ${deque.length}`,
        });
        break;
      }
      case "push_back": {
        const val = op.value!;
        deque.push(val);
        steps.push({
          type: "push_back",
          deque: [...deque],
          highlightIndex: deque.length - 1,
          operation: `push_back(${val})`,
          description: `${val} を末尾に追加。サイズ: ${deque.length}`,
        });
        break;
      }
      case "pop_front": {
        if (deque.length === 0) {
          steps.push({
            type: "pop_empty",
            deque: [],
            highlightIndex: -1,
            operation: "pop_front()",
            description: "Deque が空のため pop できない",
          });
        } else {
          const val = deque.shift()!;
          steps.push({
            type: "pop_front",
            deque: [...deque],
            highlightIndex: -1,
            operation: `pop_front() → ${val}`,
            description: `先頭の ${val} を取り出した。サイズ: ${deque.length}`,
          });
        }
        break;
      }
      case "pop_back": {
        if (deque.length === 0) {
          steps.push({
            type: "pop_empty",
            deque: [],
            highlightIndex: -1,
            operation: "pop_back()",
            description: "Deque が空のため pop できない",
          });
        } else {
          const val = deque.pop()!;
          steps.push({
            type: "pop_back",
            deque: [...deque],
            highlightIndex: -1,
            operation: `pop_back() → ${val}`,
            description: `末尾の ${val} を取り出した。サイズ: ${deque.length}`,
          });
        }
        break;
      }
      case "peek_front": {
        if (deque.length === 0) {
          steps.push({
            type: "peek_empty",
            deque: [],
            highlightIndex: -1,
            operation: "peek_front()",
            description: "Deque が空のため peek できない",
          });
        } else {
          steps.push({
            type: "peek_front",
            deque: [...deque],
            highlightIndex: 0,
            operation: `peek_front() → ${deque[0]}`,
            description: `先頭の要素は ${deque[0]}。Deque は変化しない`,
          });
        }
        break;
      }
      case "peek_back": {
        if (deque.length === 0) {
          steps.push({
            type: "peek_empty",
            deque: [],
            highlightIndex: -1,
            operation: "peek_back()",
            description: "Deque が空のため peek できない",
          });
        } else {
          steps.push({
            type: "peek_back",
            deque: [...deque],
            highlightIndex: deque.length - 1,
            operation: `peek_back() → ${deque[deque.length - 1]}`,
            description: `末尾の要素は ${deque[deque.length - 1]}。Deque は変化しない`,
          });
        }
        break;
      }
    }
  }

  steps.push({
    type: "done",
    deque: [...deque],
    highlightIndex: -1,
    operation: "",
    description: "全操作完了",
  });

  return steps;
}

// --- Default operations ---

const defaultOperations: Operation[] = [
  { type: "push_back", value: 3 },
  { type: "push_back", value: 7 },
  { type: "push_front", value: 1 },
  { type: "push_front", value: 9 },
  { type: "peek_front" },
  { type: "pop_front" },
  { type: "pop_back" },
  { type: "push_back", value: 5 },
  { type: "peek_back" },
];

// --- Component ---

export default function DequeAnimationPage() {
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
    if (type === "push_front" || type === "push_back") {
      const val = parseInt(inputValue);
      if (isNaN(val)) return;
      setOperations((prev) => [...prev, { type, value: val }]);
      setInputValue("");
    } else {
      setOperations((prev) => [...prev, { type }]);
    }
  };

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <>
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
                  if (e.key === "Enter") addOperation("push_back");
                }}
                placeholder="値"
                className="font-mono w-20"
              />
              <Button
                onClick={() => addOperation("push_front")}
                variant="outline"
                size="sm"
              >
                PushFront
              </Button>
              <Button
                onClick={() => addOperation("push_back")}
                variant="outline"
                size="sm"
              >
                PushBack
              </Button>
            </div>
            <Button
              onClick={() => addOperation("pop_front")}
              variant="outline"
              size="sm"
            >
              PopFront
            </Button>
            <Button
              onClick={() => addOperation("pop_back")}
              variant="outline"
              size="sm"
            >
              PopBack
            </Button>
            <Button
              onClick={() => addOperation("peek_front")}
              variant="outline"
              size="sm"
            >
              PeekFront
            </Button>
            <Button
              onClick={() => addOperation("peek_back")}
              variant="outline"
              size="sm"
            >
              PeekBack
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
                {op.type === "push_front" || op.type === "push_back"
                  ? `${op.type}(${op.value})`
                  : `${op.type}()`}
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => run(operations)} variant="outline" size="sm">
              実行
            </Button>
            <Button
              onClick={() => setOperations([])}
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

        {/* Deque visualization */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Deque (左が先頭)
          </div>
          <div className="flex items-center gap-1 min-h-[60px] overflow-x-auto pb-1">
            {step.deque.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">
                (空)
              </div>
            ) : (
              <>
                <span className="text-xs text-muted-foreground mr-1">
                  front →
                </span>
                {step.deque.map((val, idx) => {
                  let cls =
                    "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
                  if (idx === step.highlightIndex) {
                    if (
                      step.type === "push_front" ||
                      step.type === "push_back"
                    ) {
                      cls += " bg-emerald-100 border-emerald-500";
                    } else {
                      cls += " bg-blue-100 border-blue-400";
                    }
                  } else {
                    cls += " bg-white border-gray-200";
                  }
                  return (
                    <div key={idx} className={cls}>
                      {val}
                    </div>
                  );
                })}
                <span className="text-xs text-muted-foreground ml-1">
                  ← back
                </span>
              </>
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
              {step.deque.length}
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
    </>
  );
}
