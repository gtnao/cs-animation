"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type OperationType = "union" | "find" | "same";

interface Operation {
  type: OperationType;
  x: number;
  y?: number;
}

type StepType =
  | "init"
  | "find_root"
  | "find_result"
  | "union_find_roots"
  | "union_same"
  | "union_merge"
  | "same_result"
  | "done";

interface Step {
  type: StepType;
  parent: number[];
  rank: number[];
  highlightNodes: number[];
  mergeEdge: [number, number] | null;
  operation: string;
  description: string;
}

// --- Step generation ---

function generateSteps(n: number, operations: Operation[]): Step[] {
  const steps: Step[] = [];
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);

  steps.push({
    type: "init",
    parent: [...parent],
    rank: [...rank],
    highlightNodes: [],
    mergeEdge: null,
    operation: "",
    description: `${n} 個の要素で初期化。各要素が独立した集合`,
  });

  function findRoot(x: number): number {
    const path: number[] = [];
    let cur = x;
    while (parent[cur] !== cur) {
      path.push(cur);
      cur = parent[cur];
    }
    // Path compression
    for (const node of path) {
      parent[node] = cur;
    }
    return cur;
  }

  for (const op of operations) {
    switch (op.type) {
      case "find": {
        const root = findRoot(op.x);
        steps.push({
          type: "find_root",
          parent: [...parent],
          rank: [...rank],
          highlightNodes: [op.x, root],
          mergeEdge: null,
          operation: `find(${op.x})`,
          description: `find(${op.x}): 根を辿って root = ${root} を発見`,
        });
        steps.push({
          type: "find_result",
          parent: [...parent],
          rank: [...rank],
          highlightNodes: [root],
          mergeEdge: null,
          operation: `find(${op.x}) → ${root}`,
          description: `find(${op.x}) = ${root} (経路圧縮適用済み)`,
        });
        break;
      }
      case "union": {
        const y = op.y!;
        const rx = findRoot(op.x);
        const ry = findRoot(y);

        steps.push({
          type: "union_find_roots",
          parent: [...parent],
          rank: [...rank],
          highlightNodes: [op.x, y, rx, ry],
          mergeEdge: null,
          operation: `union(${op.x}, ${y})`,
          description: `find(${op.x}) = ${rx}, find(${y}) = ${ry}`,
        });

        if (rx === ry) {
          steps.push({
            type: "union_same",
            parent: [...parent],
            rank: [...rank],
            highlightNodes: [rx],
            mergeEdge: null,
            operation: `union(${op.x}, ${y})`,
            description: `${op.x} と ${y} は同じ集合に属している (root = ${rx})`,
          });
        } else {
          // Union by rank
          if (rank[rx] < rank[ry]) {
            parent[rx] = ry;
            steps.push({
              type: "union_merge",
              parent: [...parent],
              rank: [...rank],
              highlightNodes: [rx, ry],
              mergeEdge: [rx, ry],
              operation: `union(${op.x}, ${y})`,
              description: `rank[${rx}]=${rank[rx]} < rank[${ry}]=${rank[ry]} なので ${rx} を ${ry} の下に接続`,
            });
          } else if (rank[rx] > rank[ry]) {
            parent[ry] = rx;
            steps.push({
              type: "union_merge",
              parent: [...parent],
              rank: [...rank],
              highlightNodes: [rx, ry],
              mergeEdge: [ry, rx],
              operation: `union(${op.x}, ${y})`,
              description: `rank[${rx}]=${rank[rx]} > rank[${ry}]=${rank[ry]} なので ${ry} を ${rx} の下に接続`,
            });
          } else {
            parent[ry] = rx;
            rank[rx]++;
            steps.push({
              type: "union_merge",
              parent: [...parent],
              rank: [...rank],
              highlightNodes: [rx, ry],
              mergeEdge: [ry, rx],
              operation: `union(${op.x}, ${y})`,
              description: `rank が同じなので ${ry} を ${rx} の下に接続し、rank[${rx}] を ${rank[rx]} に増加`,
            });
          }
        }
        break;
      }
      case "same": {
        const y = op.y!;
        const rx = findRoot(op.x);
        const ry = findRoot(y);
        const isSame = rx === ry;

        steps.push({
          type: "same_result",
          parent: [...parent],
          rank: [...rank],
          highlightNodes: [op.x, y, rx, ry],
          mergeEdge: null,
          operation: `same(${op.x}, ${y}) → ${isSame}`,
          description: `find(${op.x})=${rx}, find(${y})=${ry} → ${isSame ? "同じ集合" : "異なる集合"}`,
        });
        break;
      }
    }
  }

  steps.push({
    type: "done",
    parent: [...parent],
    rank: [...rank],
    highlightNodes: [],
    mergeEdge: null,
    operation: "",
    description: "全操作完了",
  });

  return steps;
}

// --- Default ---

const DEFAULT_N = 8;
const defaultOperations: Operation[] = [
  { type: "union", x: 0, y: 1 },
  { type: "union", x: 2, y: 3 },
  { type: "union", x: 0, y: 2 },
  { type: "find", x: 3 },
  { type: "union", x: 4, y: 5 },
  { type: "union", x: 6, y: 7 },
  { type: "union", x: 4, y: 6 },
  { type: "same", x: 0, y: 5 },
  { type: "union", x: 0, y: 4 },
  { type: "same", x: 3, y: 7 },
];

// --- Tree layout ---

function computeForest(parent: number[]) {
  const n = parent.length;
  const children: number[][] = Array.from({ length: n }, () => []);
  const roots: number[] = [];
  for (let i = 0; i < n; i++) {
    if (parent[i] === i) {
      roots.push(i);
    } else {
      children[parent[i]].push(i);
    }
  }
  return { roots, children };
}

// --- Component ---

export default function UnionFindAnimationPage() {
  const [inputX, setInputX] = useState("");
  const [inputY, setInputY] = useState("");
  const [nodeCount] = useState(DEFAULT_N);
  const [operations, setOperations] = useState<Operation[]>([
    ...defaultOperations,
  ]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(
    (ops: Operation[]) => {
      setSteps(generateSteps(nodeCount, ops));
      setCurrentStep(0);
      setIsPlaying(false);
    },
    [nodeCount]
  );

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
    }, 700);
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
    const x = parseInt(inputX);
    if (isNaN(x) || x < 0 || x >= nodeCount) return;
    if (type === "find") {
      setOperations((prev) => [...prev, { type, x }]);
      setInputX("");
    } else {
      const y = parseInt(inputY);
      if (isNaN(y) || y < 0 || y >= nodeCount) return;
      setOperations((prev) => [...prev, { type, x, y }]);
      setInputX("");
      setInputY("");
    }
  };

  const step = steps[currentStep];
  if (!step) return null;

  const { roots, children } = computeForest(step.parent);

  // Simple tree layout for each tree in the forest
  function renderTree(
    root: number,
    childrenMap: number[][],
    xOffset: number
  ): { nodes: { id: number; x: number; y: number }[]; width: number } {
    const nodes: { id: number; x: number; y: number }[] = [];
    const nodeWidth = 50;

    function layout(node: number, depth: number, x: number): number {
      const ch = childrenMap[node];
      if (ch.length === 0) {
        nodes.push({ id: node, x: x + nodeWidth / 2, y: depth * 55 + 25 });
        return nodeWidth;
      }
      let totalWidth = 0;
      const childPositions: { id: number; x: number }[] = [];
      for (const c of ch) {
        const w = layout(c, depth + 1, x + totalWidth);
        childPositions.push({
          id: c,
          x: x + totalWidth + w / 2,
        });
        totalWidth += w;
      }
      const myX =
        (childPositions[0].x + childPositions[childPositions.length - 1].x) / 2;
      nodes.push({ id: node, x: myX, y: depth * 55 + 25 });
      return Math.max(totalWidth, nodeWidth);
    }

    const width = layout(root, 0, xOffset);
    return { nodes, width };
  }

  let totalOffset = 0;
  const allNodes: { id: number; x: number; y: number }[] = [];
  for (const root of roots) {
    const { nodes, width } = renderTree(root, children, totalOffset);
    allNodes.push(...nodes);
    totalOffset += width + 20;
  }

  const svgWidth = Math.max(totalOffset, 200);
  const maxDepth =
    allNodes.length > 0 ? Math.max(...allNodes.map((n) => n.y)) : 25;
  const svgHeight = maxDepth + 45;

  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Union-Find</h1>
        <p className="text-sm text-muted-foreground mb-6">
          素集合を効率的に管理するデータ構造 (経路圧縮 + rank による union)
        </p>

        {/* Operation builder */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            操作を追加 (要素: 0 ~ {nodeCount - 1})
          </div>
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">x</label>
              <Input
                value={inputX}
                onChange={(e) => setInputX(e.target.value)}
                placeholder="x"
                className="font-mono w-16"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">y</label>
              <Input
                value={inputY}
                onChange={(e) => setInputY(e.target.value)}
                placeholder="y"
                className="font-mono w-16"
              />
            </div>
            <Button
              onClick={() => addOperation("union")}
              variant="outline"
              size="sm"
            >
              Union
            </Button>
            <Button
              onClick={() => addOperation("find")}
              variant="outline"
              size="sm"
            >
              Find
            </Button>
            <Button
              onClick={() => addOperation("same")}
              variant="outline"
              size="sm"
            >
              Same
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
                {op.type === "find"
                  ? `find(${op.x})`
                  : `${op.type}(${op.x}, ${op.y})`}
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

        {/* Forest visualization */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            森 (各木は1つの集合)
          </div>
          <div className="overflow-x-auto pb-2">
            <svg width={svgWidth} height={svgHeight}>
              {/* Edges */}
              {step.parent.map((p, i) => {
                if (p === i) return null;
                const from = nodeMap.get(i);
                const to = nodeMap.get(p);
                if (!from || !to) return null;
                const isNewEdge =
                  step.mergeEdge &&
                  step.mergeEdge[0] === i &&
                  step.mergeEdge[1] === p;
                return (
                  <line
                    key={`edge-${i}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={isNewEdge ? "#22c55e" : "#d1d5db"}
                    strokeWidth={isNewEdge ? 3 : 2}
                  />
                );
              })}
              {/* Nodes */}
              {allNodes.map(({ id, x, y }) => {
                const isHighlighted = step.highlightNodes.includes(id);
                const isRoot = step.parent[id] === id;

                let fill = "white";
                let stroke = "#e5e7eb";
                if (isHighlighted) {
                  if (step.type === "union_merge") {
                    fill = "#dcfce7";
                    stroke = "#22c55e";
                  } else if (step.type === "same_result") {
                    fill = "#dbeafe";
                    stroke = "#60a5fa";
                  } else {
                    fill = "#dbeafe";
                    stroke = "#60a5fa";
                  }
                } else if (isRoot) {
                  fill = "#f9fafb";
                  stroke = "#9ca3af";
                }

                return (
                  <g key={`node-${id}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r={18}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={2}
                    />
                    <text
                      x={x}
                      y={y + 5}
                      textAnchor="middle"
                      className="text-sm font-mono"
                      fill="currentColor"
                    >
                      {id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Parent array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            parent 配列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.parent.map((p, i) => {
              const isHighlighted = step.highlightNodes.includes(i);
              let cls =
                "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              if (isHighlighted) {
                cls += " bg-blue-100 border-blue-400";
              } else {
                cls += " bg-white border-gray-200";
              }
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {i}
                  </div>
                  <div className={cls}>{p}</div>
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
            集合数:{" "}
            <span className="font-mono font-semibold text-foreground">
              {roots.length}
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>処理中のノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>マージ</span>
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
