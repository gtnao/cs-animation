"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type OperationType =
  | "push_front"
  | "push_back"
  | "pop_front"
  | "insert_at"
  | "delete_at"
  | "search";

interface Operation {
  type: OperationType;
  value?: number;
  index?: number;
}

type StepType =
  | "init"
  | "push_front"
  | "push_back"
  | "pop_front"
  | "pop_front_empty"
  | "insert_at"
  | "delete_at"
  | "search_step"
  | "search_found"
  | "search_not_found"
  | "done";

interface Step {
  type: StepType;
  list: number[];
  highlightIndex: number;
  searchIndex: number;
  operation: string;
  description: string;
}

// --- Step generation ---

function generateSteps(operations: Operation[]): Step[] {
  const steps: Step[] = [];
  const list: number[] = [];

  steps.push({
    type: "init",
    list: [],
    highlightIndex: -1,
    searchIndex: -1,
    operation: "",
    description: "空の連結リストを初期化",
  });

  for (const op of operations) {
    switch (op.type) {
      case "push_front": {
        const val = op.value!;
        list.unshift(val);
        steps.push({
          type: "push_front",
          list: [...list],
          highlightIndex: 0,
          searchIndex: -1,
          operation: `push_front(${val})`,
          description: `${val} を先頭に挿入。サイズ: ${list.length}`,
        });
        break;
      }
      case "push_back": {
        const val = op.value!;
        list.push(val);
        steps.push({
          type: "push_back",
          list: [...list],
          highlightIndex: list.length - 1,
          searchIndex: -1,
          operation: `push_back(${val})`,
          description: `${val} を末尾に挿入。サイズ: ${list.length}`,
        });
        break;
      }
      case "pop_front": {
        if (list.length === 0) {
          steps.push({
            type: "pop_front_empty",
            list: [],
            highlightIndex: -1,
            searchIndex: -1,
            operation: "pop_front()",
            description: "リストが空のため削除できない",
          });
        } else {
          const val = list.shift()!;
          steps.push({
            type: "pop_front",
            list: [...list],
            highlightIndex: -1,
            searchIndex: -1,
            operation: `pop_front() → ${val}`,
            description: `先頭の ${val} を削除。サイズ: ${list.length}`,
          });
        }
        break;
      }
      case "insert_at": {
        const val = op.value!;
        const idx = Math.min(op.index!, list.length);
        list.splice(idx, 0, val);
        steps.push({
          type: "insert_at",
          list: [...list],
          highlightIndex: idx,
          searchIndex: -1,
          operation: `insert(${idx}, ${val})`,
          description: `インデックス ${idx} に ${val} を挿入。サイズ: ${list.length}`,
        });
        break;
      }
      case "delete_at": {
        const idx = op.index!;
        if (idx >= list.length) {
          steps.push({
            type: "delete_at",
            list: [...list],
            highlightIndex: -1,
            searchIndex: -1,
            operation: `delete(${idx})`,
            description: `インデックス ${idx} は範囲外`,
          });
        } else {
          const val = list.splice(idx, 1)[0];
          steps.push({
            type: "delete_at",
            list: [...list],
            highlightIndex: -1,
            searchIndex: -1,
            operation: `delete(${idx}) → ${val}`,
            description: `インデックス ${idx} の ${val} を削除。サイズ: ${list.length}`,
          });
        }
        break;
      }
      case "search": {
        const val = op.value!;
        let found = false;
        for (let i = 0; i < list.length; i++) {
          steps.push({
            type: "search_step",
            list: [...list],
            highlightIndex: -1,
            searchIndex: i,
            operation: `search(${val})`,
            description: `インデックス ${i} を確認: ${list[i]} ${list[i] === val ? "= " + val + " → 発見!" : "≠ " + val}`,
          });
          if (list[i] === val) {
            steps.push({
              type: "search_found",
              list: [...list],
              highlightIndex: i,
              searchIndex: i,
              operation: `search(${val}) → index ${i}`,
              description: `${val} をインデックス ${i} で発見`,
            });
            found = true;
            break;
          }
        }
        if (!found) {
          steps.push({
            type: "search_not_found",
            list: [...list],
            highlightIndex: -1,
            searchIndex: -1,
            operation: `search(${val}) → not found`,
            description: `${val} はリストに存在しない`,
          });
        }
        break;
      }
    }
  }

  steps.push({
    type: "done",
    list: [...list],
    highlightIndex: -1,
    searchIndex: -1,
    operation: "",
    description: "全操作完了",
  });

  return steps;
}

// --- Default operations ---

const defaultOperations: Operation[] = [
  { type: "push_back", value: 3 },
  { type: "push_back", value: 7 },
  { type: "push_back", value: 1 },
  { type: "push_front", value: 9 },
  { type: "insert_at", value: 5, index: 2 },
  { type: "search", value: 7 },
  { type: "delete_at", index: 1 },
  { type: "pop_front" },
];

// --- Component ---

export default function LinkedListAnimationPage() {
  const [inputValue, setInputValue] = useState("");
  const [inputIndex, setInputIndex] = useState("");
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
    if (type === "push_front" || type === "push_back" || type === "search") {
      const val = parseInt(inputValue);
      if (isNaN(val)) return;
      setOperations((prev) => [...prev, { type, value: val }]);
      setInputValue("");
    } else if (type === "insert_at") {
      const val = parseInt(inputValue);
      const idx = parseInt(inputIndex);
      if (isNaN(val) || isNaN(idx)) return;
      setOperations((prev) => [...prev, { type, value: val, index: idx }]);
      setInputValue("");
      setInputIndex("");
    } else if (type === "delete_at") {
      const idx = parseInt(inputIndex);
      if (isNaN(idx)) return;
      setOperations((prev) => [...prev, { type, index: idx }]);
      setInputIndex("");
    } else {
      setOperations((prev) => [...prev, { type }]);
    }
  };

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Linked List</h1>
        <p className="text-sm text-muted-foreground mb-6">
          ポインタで要素を連結するデータ構造
        </p>

        {/* Operation builder */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            操作を追加
          </div>
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">値</label>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="値"
                className="font-mono w-20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">
                インデックス
              </label>
              <Input
                value={inputIndex}
                onChange={(e) => setInputIndex(e.target.value)}
                placeholder="idx"
                className="font-mono w-20"
              />
            </div>
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
            <Button
              onClick={() => addOperation("pop_front")}
              variant="outline"
              size="sm"
            >
              PopFront
            </Button>
            <Button
              onClick={() => addOperation("insert_at")}
              variant="outline"
              size="sm"
            >
              InsertAt
            </Button>
            <Button
              onClick={() => addOperation("delete_at")}
              variant="outline"
              size="sm"
            >
              DeleteAt
            </Button>
            <Button
              onClick={() => addOperation("search")}
              variant="outline"
              size="sm"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Operation list */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            操作列
          </div>
          <div className="flex gap-1 flex-wrap">
            {operations.map((op, i) => {
              let label = "";
              if (op.type === "push_front" || op.type === "push_back") {
                label = `${op.type}(${op.value})`;
              } else if (op.type === "insert_at") {
                label = `insert(${op.index}, ${op.value})`;
              } else if (op.type === "delete_at") {
                label = `delete(${op.index})`;
              } else if (op.type === "search") {
                label = `search(${op.value})`;
              } else {
                label = `${op.type}()`;
              }
              return (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs font-mono border border-border rounded bg-muted"
                >
                  {label}
                </span>
              );
            })}
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

        {/* Linked list visualization */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            連結リスト
          </div>
          <div className="flex items-center gap-0 min-h-[60px] overflow-x-auto pb-1">
            {step.list.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">
                (空)
              </div>
            ) : (
              <>
                <span className="text-xs text-muted-foreground mr-2">
                  head →
                </span>
                {step.list.map((val, idx) => {
                  let cls =
                    "w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
                  if (idx === step.highlightIndex) {
                    if (
                      step.type === "push_front" ||
                      step.type === "push_back" ||
                      step.type === "insert_at"
                    ) {
                      cls += " bg-emerald-100 border-emerald-500";
                    } else if (step.type === "search_found") {
                      cls += " bg-emerald-100 border-emerald-500";
                    } else {
                      cls += " bg-blue-100 border-blue-400";
                    }
                  } else if (idx === step.searchIndex) {
                    cls += " bg-amber-50 border-amber-400";
                  } else {
                    cls += " bg-white border-gray-200";
                  }
                  return (
                    <div key={idx} className="flex items-center">
                      <div className={cls}>{val}</div>
                      {idx < step.list.length - 1 && (
                        <div className="text-muted-foreground mx-0.5">→</div>
                      )}
                    </div>
                  );
                })}
                <span className="text-xs text-muted-foreground ml-2">
                  → null
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
              {step.list.length}
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
            <span>挿入/発見</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>探索中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>処理中</span>
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
