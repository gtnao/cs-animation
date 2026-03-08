"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type OperationType = "insert" | "search" | "delete";

interface Operation {
  type: OperationType;
  key: number;
  value?: number;
}

type StepType =
  | "init"
  | "hash_compute"
  | "insert_done"
  | "insert_collision"
  | "search_check"
  | "search_found"
  | "search_not_found"
  | "delete_done"
  | "delete_not_found"
  | "done";

interface BucketEntry {
  key: number;
  value: number;
}

interface Step {
  type: StepType;
  buckets: BucketEntry[][];
  bucketCount: number;
  highlightBucket: number;
  highlightEntry: number;
  operation: string;
  description: string;
}

// --- Hash function ---

function hashFn(key: number, size: number): number {
  return ((key % size) + size) % size;
}

// --- Step generation ---

function generateSteps(operations: Operation[], bucketCount: number): Step[] {
  const steps: Step[] = [];
  const buckets: BucketEntry[][] = Array.from(
    { length: bucketCount },
    () => []
  );

  const cloneBuckets = () => buckets.map((b) => [...b]);

  steps.push({
    type: "init",
    buckets: cloneBuckets(),
    bucketCount,
    highlightBucket: -1,
    highlightEntry: -1,
    operation: "",
    description: `サイズ ${bucketCount} のハッシュテーブルを初期化 (チェイン法)`,
  });

  for (const op of operations) {
    const h = hashFn(op.key, bucketCount);

    switch (op.type) {
      case "insert": {
        const val = op.value!;
        steps.push({
          type: "hash_compute",
          buckets: cloneBuckets(),
          bucketCount,
          highlightBucket: h,
          highlightEntry: -1,
          operation: `insert(${op.key}, ${val})`,
          description: `hash(${op.key}) = ${op.key} mod ${bucketCount} = ${h}`,
        });

        // Check for existing key
        const existingIdx = buckets[h].findIndex((e) => e.key === op.key);
        if (existingIdx >= 0) {
          buckets[h][existingIdx].value = val;
          steps.push({
            type: "insert_done",
            buckets: cloneBuckets(),
            bucketCount,
            highlightBucket: h,
            highlightEntry: existingIdx,
            operation: `insert(${op.key}, ${val})`,
            description: `キー ${op.key} は既に存在。値を ${val} に更新`,
          });
        } else {
          const hasCollision = buckets[h].length > 0;
          buckets[h].push({ key: op.key, value: val });
          if (hasCollision) {
            steps.push({
              type: "insert_collision",
              buckets: cloneBuckets(),
              bucketCount,
              highlightBucket: h,
              highlightEntry: buckets[h].length - 1,
              operation: `insert(${op.key}, ${val})`,
              description: `バケット ${h} で衝突発生。チェインの末尾に追加`,
            });
          } else {
            steps.push({
              type: "insert_done",
              buckets: cloneBuckets(),
              bucketCount,
              highlightBucket: h,
              highlightEntry: buckets[h].length - 1,
              operation: `insert(${op.key}, ${val})`,
              description: `バケット ${h} に (${op.key}, ${val}) を挿入`,
            });
          }
        }
        break;
      }
      case "search": {
        steps.push({
          type: "hash_compute",
          buckets: cloneBuckets(),
          bucketCount,
          highlightBucket: h,
          highlightEntry: -1,
          operation: `search(${op.key})`,
          description: `hash(${op.key}) = ${op.key} mod ${bucketCount} = ${h}`,
        });

        let found = false;
        for (let i = 0; i < buckets[h].length; i++) {
          steps.push({
            type: "search_check",
            buckets: cloneBuckets(),
            bucketCount,
            highlightBucket: h,
            highlightEntry: i,
            operation: `search(${op.key})`,
            description: `バケット ${h} のエントリ ${i} を確認: key=${buckets[h][i].key} ${buckets[h][i].key === op.key ? "= " + op.key + " → 発見!" : "≠ " + op.key}`,
          });
          if (buckets[h][i].key === op.key) {
            steps.push({
              type: "search_found",
              buckets: cloneBuckets(),
              bucketCount,
              highlightBucket: h,
              highlightEntry: i,
              operation: `search(${op.key}) → ${buckets[h][i].value}`,
              description: `キー ${op.key} の値は ${buckets[h][i].value}`,
            });
            found = true;
            break;
          }
        }
        if (!found) {
          steps.push({
            type: "search_not_found",
            buckets: cloneBuckets(),
            bucketCount,
            highlightBucket: h,
            highlightEntry: -1,
            operation: `search(${op.key}) → not found`,
            description: `キー ${op.key} はテーブルに存在しない`,
          });
        }
        break;
      }
      case "delete": {
        steps.push({
          type: "hash_compute",
          buckets: cloneBuckets(),
          bucketCount,
          highlightBucket: h,
          highlightEntry: -1,
          operation: `delete(${op.key})`,
          description: `hash(${op.key}) = ${op.key} mod ${bucketCount} = ${h}`,
        });

        const idx = buckets[h].findIndex((e) => e.key === op.key);
        if (idx >= 0) {
          buckets[h].splice(idx, 1);
          steps.push({
            type: "delete_done",
            buckets: cloneBuckets(),
            bucketCount,
            highlightBucket: h,
            highlightEntry: -1,
            operation: `delete(${op.key})`,
            description: `キー ${op.key} をバケット ${h} から削除`,
          });
        } else {
          steps.push({
            type: "delete_not_found",
            buckets: cloneBuckets(),
            bucketCount,
            highlightBucket: h,
            highlightEntry: -1,
            operation: `delete(${op.key})`,
            description: `キー ${op.key} はテーブルに存在しない`,
          });
        }
        break;
      }
    }
  }

  steps.push({
    type: "done",
    buckets: cloneBuckets(),
    bucketCount,
    highlightBucket: -1,
    highlightEntry: -1,
    operation: "",
    description: "全操作完了",
  });

  return steps;
}

// --- Default operations ---

const BUCKET_COUNT = 7;

const defaultOperations: Operation[] = [
  { type: "insert", key: 5, value: 50 },
  { type: "insert", key: 12, value: 120 },
  { type: "insert", key: 3, value: 30 },
  { type: "insert", key: 19, value: 190 },
  { type: "insert", key: 10, value: 100 },
  { type: "search", key: 12 },
  { type: "search", key: 7 },
  { type: "delete", key: 5 },
  { type: "insert", key: 26, value: 260 },
];

// --- Component ---

export default function HashTableAnimationPage() {
  const [inputKey, setInputKey] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [operations, setOperations] = useState<Operation[]>([
    ...defaultOperations,
  ]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((ops: Operation[]) => {
    setSteps(generateSteps(ops, BUCKET_COUNT));
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
    const key = parseInt(inputKey);
    if (isNaN(key)) return;
    if (type === "insert") {
      const val = parseInt(inputVal);
      if (isNaN(val)) return;
      setOperations((prev) => [...prev, { type, key, value: val }]);
      setInputKey("");
      setInputVal("");
    } else {
      setOperations((prev) => [...prev, { type, key }]);
      setInputKey("");
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
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">キー</label>
              <Input
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="key"
                className="font-mono w-20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">値</label>
              <Input
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="value"
                className="font-mono w-20"
              />
            </div>
            <Button
              onClick={() => addOperation("insert")}
              variant="outline"
              size="sm"
            >
              Insert
            </Button>
            <Button
              onClick={() => addOperation("search")}
              variant="outline"
              size="sm"
            >
              Search
            </Button>
            <Button
              onClick={() => addOperation("delete")}
              variant="outline"
              size="sm"
            >
              Delete
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
                {op.type === "insert"
                  ? `insert(${op.key}, ${op.value})`
                  : `${op.type}(${op.key})`}
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

        {/* Hash table visualization */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            ハッシュテーブル (hash = key mod {BUCKET_COUNT})
          </div>
          <div className="space-y-1">
            {step.buckets.map((bucket, bIdx) => {
              const isBucketHighlighted = bIdx === step.highlightBucket;
              return (
                <div key={bIdx} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 flex items-center justify-center text-xs font-mono border-2 transition-colors ${
                      isBucketHighlighted
                        ? "bg-blue-100 border-blue-400 font-bold"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    {bIdx}
                  </div>
                  <span className="text-muted-foreground text-xs">→</span>
                  <div className="flex gap-1 items-center">
                    {bucket.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">
                        null
                      </span>
                    ) : (
                      bucket.map((entry, eIdx) => {
                        const isEntryHighlighted =
                          isBucketHighlighted && eIdx === step.highlightEntry;
                        let cls =
                          "px-2 py-1 border-2 text-xs font-mono transition-colors";
                        if (isEntryHighlighted) {
                          if (
                            step.type === "insert_done" ||
                            step.type === "insert_collision" ||
                            step.type === "search_found"
                          ) {
                            cls += " bg-emerald-100 border-emerald-500";
                          } else if (step.type === "search_check") {
                            cls += " bg-amber-50 border-amber-400";
                          } else {
                            cls += " bg-blue-100 border-blue-400";
                          }
                        } else {
                          cls += " bg-white border-gray-200";
                        }
                        return (
                          <div key={eIdx} className="flex items-center gap-1">
                            <div className={cls}>
                              ({entry.key}, {entry.value})
                            </div>
                            {eIdx < bucket.length - 1 && (
                              <span className="text-muted-foreground text-xs">
                                →
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
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
            <span>対象バケット</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>挿入/発見</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>探索中</span>
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
