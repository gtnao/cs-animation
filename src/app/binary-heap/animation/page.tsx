"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type OperationType = "insert" | "extract_min" | "peek_min";

interface Operation {
  type: OperationType;
  value?: number;
}

type StepType =
  | "init"
  | "insert_add"
  | "insert_swap"
  | "insert_done"
  | "extract_swap_root"
  | "extract_siftdown"
  | "extract_done"
  | "extract_empty"
  | "peek_min"
  | "peek_empty"
  | "done";

interface Step {
  type: StepType;
  heap: number[];
  highlightIndices: number[];
  swapIndices: number[];
  operation: string;
  description: string;
}

// --- Helper functions ---

function parentIndex(i: number): number {
  return Math.floor((i - 1) / 2);
}
function leftChild(i: number): number {
  return 2 * i + 1;
}
function rightChild(i: number): number {
  return 2 * i + 2;
}

// --- Step generation ---

function generateSteps(operations: Operation[]): Step[] {
  const steps: Step[] = [];
  const heap: number[] = [];

  steps.push({
    type: "init",
    heap: [],
    highlightIndices: [],
    swapIndices: [],
    operation: "",
    description: "空の最小ヒープを初期化",
  });

  for (const op of operations) {
    switch (op.type) {
      case "insert": {
        const val = op.value!;
        heap.push(val);
        let idx = heap.length - 1;

        steps.push({
          type: "insert_add",
          heap: [...heap],
          highlightIndices: [idx],
          swapIndices: [],
          operation: `insert(${val})`,
          description: `${val} を末尾 (インデックス ${idx}) に追加`,
        });

        // Sift up
        while (idx > 0 && heap[parentIndex(idx)] > heap[idx]) {
          const pi = parentIndex(idx);
          [heap[pi], heap[idx]] = [heap[idx], heap[pi]];
          steps.push({
            type: "insert_swap",
            heap: [...heap],
            highlightIndices: [pi],
            swapIndices: [pi, idx],
            operation: `insert(${val})`,
            description: `親 (${heap[idx]}, index=${pi}) > 子 (${heap[pi]}, index=${idx}) なのでスワップ`,
          });
          idx = pi;
        }

        steps.push({
          type: "insert_done",
          heap: [...heap],
          highlightIndices: [idx],
          swapIndices: [],
          operation: `insert(${val})`,
          description: `${val} の挿入完了。ヒープ条件を満たしている`,
        });
        break;
      }
      case "extract_min": {
        if (heap.length === 0) {
          steps.push({
            type: "extract_empty",
            heap: [],
            highlightIndices: [],
            swapIndices: [],
            operation: "extract_min()",
            description: "ヒープが空のため取り出せない",
          });
          break;
        }

        const minVal = heap[0];
        const lastVal = heap.pop()!;

        if (heap.length === 0) {
          steps.push({
            type: "extract_done",
            heap: [],
            highlightIndices: [],
            swapIndices: [],
            operation: `extract_min() → ${minVal}`,
            description: `最小値 ${minVal} を取り出した。ヒープは空になった`,
          });
          break;
        }

        heap[0] = lastVal;
        steps.push({
          type: "extract_swap_root",
          heap: [...heap],
          highlightIndices: [0],
          swapIndices: [],
          operation: `extract_min() → ${minVal}`,
          description: `最小値 ${minVal} を取り出し、末尾の ${lastVal} を根に移動`,
        });

        // Sift down
        let idx = 0;
        while (true) {
          let smallest = idx;
          const l = leftChild(idx);
          const r = rightChild(idx);
          if (l < heap.length && heap[l] < heap[smallest]) smallest = l;
          if (r < heap.length && heap[r] < heap[smallest]) smallest = r;

          if (smallest === idx) break;

          [heap[idx], heap[smallest]] = [heap[smallest], heap[idx]];
          steps.push({
            type: "extract_siftdown",
            heap: [...heap],
            highlightIndices: [smallest],
            swapIndices: [idx, smallest],
            operation: `extract_min() → ${minVal}`,
            description: `親 (${heap[smallest]}, index=${idx}) > 子 (${heap[idx]}, index=${smallest}) なのでスワップ`,
          });
          idx = smallest;
        }

        steps.push({
          type: "extract_done",
          heap: [...heap],
          highlightIndices: [idx],
          swapIndices: [],
          operation: `extract_min() → ${minVal}`,
          description: `extract_min 完了。ヒープ条件を回復した`,
        });
        break;
      }
      case "peek_min": {
        if (heap.length === 0) {
          steps.push({
            type: "peek_empty",
            heap: [],
            highlightIndices: [],
            swapIndices: [],
            operation: "peek_min()",
            description: "ヒープが空のため参照できない",
          });
        } else {
          steps.push({
            type: "peek_min",
            heap: [...heap],
            highlightIndices: [0],
            swapIndices: [],
            operation: `peek_min() → ${heap[0]}`,
            description: `最小値は ${heap[0]}。ヒープは変化しない`,
          });
        }
        break;
      }
    }
  }

  steps.push({
    type: "done",
    heap: [...heap],
    highlightIndices: [],
    swapIndices: [],
    operation: "",
    description: "全操作完了",
  });

  return steps;
}

// --- Default operations ---

const defaultOperations: Operation[] = [
  { type: "insert", value: 5 },
  { type: "insert", value: 3 },
  { type: "insert", value: 8 },
  { type: "insert", value: 1 },
  { type: "insert", value: 4 },
  { type: "peek_min" },
  { type: "extract_min" },
  { type: "extract_min" },
  { type: "insert", value: 2 },
  { type: "extract_min" },
];

// --- Tree visualization helper ---

function getTreeLayout(size: number) {
  if (size === 0) return { positions: [], depth: 0 };
  const depth = Math.floor(Math.log2(size)) + 1;
  const positions: { x: number; y: number; level: number }[] = [];

  for (let i = 0; i < size; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const posInLevel = i - (Math.pow(2, level) - 1);
    const nodesInLevel = Math.pow(2, level);
    const totalWidth = Math.pow(2, depth) * 40;
    const spacing = totalWidth / nodesInLevel;
    const x = spacing * (posInLevel + 0.5);
    const y = level * 60 + 20;
    positions.push({ x, y, level });
  }

  return { positions, depth };
}

// --- Component ---

export default function BinaryHeapAnimationPage() {
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
    if (type === "insert") {
      const val = parseInt(inputValue);
      if (isNaN(val)) return;
      setOperations((prev) => [...prev, { type: "insert", value: val }]);
      setInputValue("");
    } else {
      setOperations((prev) => [...prev, { type }]);
    }
  };

  const step = steps[currentStep];
  if (!step) return null;

  const { positions, depth } = getTreeLayout(step.heap.length);
  const treeWidth = Math.pow(2, depth) * 40;
  const treeHeight = depth * 60 + 40;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Binary Heap</h1>
        <p className="text-sm text-muted-foreground mb-6">
          最小値を効率的に取り出せる完全二分木ベースのデータ構造
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
                  if (e.key === "Enter") addOperation("insert");
                }}
                placeholder="値"
                className="font-mono w-20"
              />
              <Button
                onClick={() => addOperation("insert")}
                variant="outline"
                size="sm"
              >
                Insert
              </Button>
            </div>
            <Button
              onClick={() => addOperation("extract_min")}
              variant="outline"
              size="sm"
            >
              ExtractMin
            </Button>
            <Button
              onClick={() => addOperation("peek_min")}
              variant="outline"
              size="sm"
            >
              PeekMin
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
                  ? `insert(${op.value})`
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

        {/* Tree visualization */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            ヒープ (ツリー表示)
          </div>
          {step.heap.length === 0 ? (
            <div className="text-sm text-muted-foreground italic min-h-[60px] flex items-center">
              (空)
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <svg
                width={Math.max(treeWidth, 200)}
                height={treeHeight}
                className="mx-auto"
              >
                {/* Edges */}
                {step.heap.map((_, idx) => {
                  if (idx === 0) return null;
                  const pi = parentIndex(idx);
                  const from = positions[pi];
                  const to = positions[idx];
                  if (!from || !to) return null;
                  return (
                    <line
                      key={`edge-${idx}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="#d1d5db"
                      strokeWidth={2}
                    />
                  );
                })}
                {/* Nodes */}
                {step.heap.map((val, idx) => {
                  const pos = positions[idx];
                  if (!pos) return null;
                  const isHighlighted = step.highlightIndices.includes(idx);
                  const isSwap = step.swapIndices.includes(idx);

                  let fill = "white";
                  let stroke = "#e5e7eb";
                  if (isSwap) {
                    fill = "#fef3c7";
                    stroke = "#f59e0b";
                  } else if (isHighlighted) {
                    if (
                      step.type === "insert_add" ||
                      step.type === "insert_done"
                    ) {
                      fill = "#dcfce7";
                      stroke = "#22c55e";
                    } else if (step.type === "peek_min") {
                      fill = "#dbeafe";
                      stroke = "#60a5fa";
                    } else {
                      fill = "#dbeafe";
                      stroke = "#60a5fa";
                    }
                  }

                  return (
                    <g key={`node-${idx}`}>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={18}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={2}
                      />
                      <text
                        x={pos.x}
                        y={pos.y + 5}
                        textAnchor="middle"
                        className="text-sm font-mono"
                        fill="currentColor"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Array representation */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            配列表現
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.heap.map((val, idx) => {
              const isHighlighted = step.highlightIndices.includes(idx);
              const isSwap = step.swapIndices.includes(idx);
              let cls =
                "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              if (isSwap) {
                cls += " bg-amber-50 border-amber-400";
              } else if (isHighlighted) {
                cls += " bg-blue-100 border-blue-400";
              } else {
                cls += " bg-white border-gray-200";
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{val}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {idx}
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
            サイズ:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.heap.length}
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
            <span>挿入/確定</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>スワップ</span>
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
