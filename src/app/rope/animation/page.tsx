"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface RopeNode {
  id: number;
  text: string | null; // null for internal nodes
  weight: number;
  left: number | null;
  right: number | null;
}

type StepType =
  | "init"
  | "build"
  | "index_start"
  | "index_go_left"
  | "index_go_right"
  | "index_found"
  | "concat"
  | "split_start"
  | "split_at"
  | "split_done"
  | "insert_start"
  | "insert_done"
  | "delete_start"
  | "delete_done"
  | "done";

interface Step {
  type: StepType;
  nodes: RopeNode[];
  rootId: number | null;
  highlightIds: number[];
  fullText: string;
  description: string;
}

// --- Algorithm ---

let nextId = 0;

function cloneNodes(nodes: RopeNode[]): RopeNode[] {
  return nodes.map((n) => ({ ...n }));
}

function findNode(nodes: RopeNode[], id: number | null): RopeNode | null {
  if (id === null) return null;
  return nodes.find((n) => n.id === id) || null;
}

function calcWeight(nodes: RopeNode[], id: number | null): number {
  if (id === null) return 0;
  const node = findNode(nodes, id)!;
  if (node.text !== null) return node.text.length;
  return node.weight;
}

function totalLength(nodes: RopeNode[], id: number | null): number {
  if (id === null) return 0;
  const node = findNode(nodes, id)!;
  if (node.text !== null) return node.text.length;
  return totalLength(nodes, node.left) + totalLength(nodes, node.right);
}

function collectText(nodes: RopeNode[], id: number | null): string {
  if (id === null) return "";
  const node = findNode(nodes, id)!;
  if (node.text !== null) return node.text;
  return collectText(nodes, node.left) + collectText(nodes, node.right);
}

function buildRope(
  nodes: RopeNode[],
  text: string,
  chunkSize: number
): number | null {
  if (text.length === 0) return null;
  if (text.length <= chunkSize) {
    const id = nextId++;
    nodes.push({ id, text, weight: text.length, left: null, right: null });
    return id;
  }
  const mid = Math.floor(text.length / 2);
  const leftId = buildRope(nodes, text.substring(0, mid), chunkSize);
  const rightId = buildRope(nodes, text.substring(mid), chunkSize);
  const id = nextId++;
  const w = totalLength(nodes, leftId);
  nodes.push({ id, text: null, weight: w, left: leftId, right: rightId });
  return id;
}

function concatRope(
  nodes: RopeNode[],
  r1: number | null,
  r2: number | null
): number | null {
  if (r1 === null) return r2;
  if (r2 === null) return r1;
  const id = nextId++;
  const w = totalLength(nodes, r1);
  nodes.push({ id, text: null, weight: w, left: r1, right: r2 });
  return id;
}

function splitRope(
  nodes: RopeNode[],
  nodeId: number | null,
  i: number
): [number | null, number | null] {
  if (nodeId === null) return [null, null];
  const node = findNode(nodes, nodeId)!;

  if (node.text !== null) {
    if (i <= 0) return [null, nodeId];
    if (i >= node.text.length) return [nodeId, null];
    const leftId = nextId++;
    const rightId = nextId++;
    nodes.push({
      id: leftId,
      text: node.text.substring(0, i),
      weight: i,
      left: null,
      right: null,
    });
    nodes.push({
      id: rightId,
      text: node.text.substring(i),
      weight: node.text.length - i,
      left: null,
      right: null,
    });
    return [leftId, rightId];
  }

  if (i < node.weight) {
    const [ll, lr] = splitRope(nodes, node.left, i);
    const right = concatRope(nodes, lr, node.right);
    return [ll, right];
  } else if (i > node.weight) {
    const [rl, rr] = splitRope(nodes, node.right, i - node.weight);
    const left = concatRope(nodes, node.left, rl);
    return [left, rr];
  } else {
    return [node.left, node.right];
  }
}

function generateSteps(operations: string): Step[] {
  nextId = 0;
  const steps: Step[] = [];
  let nodes: RopeNode[] = [];
  let rootId: number | null = null;

  steps.push({
    type: "init",
    nodes: [],
    rootId: null,
    highlightIds: [],
    fullText: "",
    description: "Rope を初期化",
  });

  const ops = operations
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const op of ops) {
    if (op.startsWith("b")) {
      // Build from string
      const text = op.substring(1).trim();
      if (!text) continue;
      rootId = buildRope(nodes, text, 3);
      const fullText = collectText(nodes, rootId);

      steps.push({
        type: "build",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: rootId !== null ? [rootId] : [],
        fullText,
        description: `Build("${text}"): Rope を構築`,
      });
    } else if (op.startsWith("i")) {
      // Insert: i[pos,text]
      const match = op.match(/i\[?(\d+),([\w\s]+)\]?/);
      if (!match) continue;
      const pos = parseInt(match[1]);
      const text = match[2];

      const beforeText = collectText(nodes, rootId);
      steps.push({
        type: "insert_start",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [],
        fullText: beforeText,
        description: `Insert(pos=${pos}, "${text}"): 位置 ${pos} に挿入`,
      });

      // Split at pos
      const [left, right] = splitRope(nodes, rootId, pos);

      steps.push({
        type: "split_done",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [left, right].filter((id) => id !== null) as number[],
        fullText: beforeText,
        description: `Split: 位置 ${pos} で分割`,
      });

      // Build new leaf
      const newLeafId = nextId++;
      nodes.push({
        id: newLeafId,
        text,
        weight: text.length,
        left: null,
        right: null,
      });

      // Concat: left + newLeaf + right
      const mid = concatRope(nodes, left, newLeafId);
      rootId = concatRope(nodes, mid, right);
      const afterText = collectText(nodes, rootId);

      steps.push({
        type: "insert_done",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [newLeafId],
        fullText: afterText,
        description: `Insert 完了: "${afterText}"`,
      });
    } else if (op.startsWith("d")) {
      // Delete: d[start,end]
      const match = op.match(/d\[?(\d+),(\d+)\]?/);
      if (!match) continue;
      const start = parseInt(match[1]);
      const end = parseInt(match[2]);

      const beforeText = collectText(nodes, rootId);
      steps.push({
        type: "delete_start",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [],
        fullText: beforeText,
        description: `Delete(${start}, ${end}): 位置 [${start},${end}) を削除`,
      });

      const [left, rest] = splitRope(nodes, rootId, start);
      const [, right] = splitRope(nodes, rest, end - start);
      rootId = concatRope(nodes, left, right);
      const afterText = collectText(nodes, rootId);

      steps.push({
        type: "delete_done",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: rootId !== null ? [rootId] : [],
        fullText: afterText,
        description: `Delete 完了: "${afterText}"`,
      });
    } else if (op.startsWith("x")) {
      // Index: x[pos]
      const match = op.match(/x\[?(\d+)\]?/);
      if (!match) continue;
      const pos = parseInt(match[1]);

      steps.push({
        type: "index_start",
        nodes: cloneNodes(nodes),
        rootId,
        highlightIds: [],
        fullText: collectText(nodes, rootId),
        description: `Index(${pos}): 位置 ${pos} の文字を取得`,
      });

      let curId = rootId;
      let remaining = pos;
      while (curId !== null) {
        const cur = findNode(nodes, curId)!;
        if (cur.text !== null) {
          steps.push({
            type: "index_found",
            nodes: cloneNodes(nodes),
            rootId,
            highlightIds: [curId],
            fullText: collectText(nodes, rootId),
            description: `Index(${pos}) = '${cur.text[remaining]}' (葉ノード "${cur.text}" の位置 ${remaining})`,
          });
          break;
        }

        if (remaining < cur.weight) {
          steps.push({
            type: "index_go_left",
            nodes: cloneNodes(nodes),
            rootId,
            highlightIds: [curId],
            fullText: collectText(nodes, rootId),
            description: `weight=${cur.weight}: ${remaining} < ${cur.weight} → 左へ`,
          });
          curId = cur.left;
        } else {
          steps.push({
            type: "index_go_right",
            nodes: cloneNodes(nodes),
            rootId,
            highlightIds: [curId],
            fullText: collectText(nodes, rootId),
            description: `weight=${cur.weight}: ${remaining} >= ${cur.weight} → 右へ (残り ${remaining - cur.weight})`,
          });
          remaining -= cur.weight;
          curId = cur.right;
        }
      }
    }
  }

  steps.push({
    type: "done",
    nodes: cloneNodes(nodes),
    rootId,
    highlightIds: [],
    fullText: collectText(nodes, rootId),
    description: "全操作完了",
  });

  return steps;
}

// --- Tree rendering ---

function TreeNodeView({
  nodeId,
  allNodes,
  step,
}: {
  nodeId: number | null;
  allNodes: RopeNode[];
  step: Step;
}) {
  if (nodeId === null) return null;
  const node = allNodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const isHighlighted = step.highlightIds.includes(node.id);
  const isLeaf = node.text !== null;

  let bgClass = "bg-white";
  let borderClass = "border-gray-200";

  if (isHighlighted) {
    bgClass = "bg-blue-100";
    borderClass = "border-blue-400";
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={`px-2 py-1 flex flex-col items-center border-2 rounded text-xs font-mono ${bgClass} ${borderClass}`}
      >
        {isLeaf ? (
          <span>&quot;{node.text}&quot;</span>
        ) : (
          <span>w={node.weight}</span>
        )}
      </div>
      {!isLeaf && (
        <div className="flex gap-2 mt-1">
          <TreeNodeView nodeId={node.left} allNodes={allNodes} step={step} />
          <TreeNodeView nodeId={node.right} allNodes={allNodes} step={step} />
        </div>
      )}
    </div>
  );
}

// --- Component ---

export default function RopeAnimationPage() {
  const [input, setInput] = useState(
    "bHello World;x[4];i[5, Beautiful];d[5,15]"
  );
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const trimmed = s.trim();
    if (trimmed.length === 0) return;
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
    }, 700);
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
        <h1 className="text-2xl font-bold mb-1">Rope</h1>
        <p className="text-sm text-muted-foreground mb-6">
          文字列の効率的な編集のためのデータ構造
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="bHello;i[5,World];d[3,5]"
            className="font-mono max-w-lg"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          b[文字列]=構築, i[pos,text]=挿入, d[start,end]=削除,
          x[pos]=インデックス (セミコロン区切り)
        </p>

        {/* Current string */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            現在の文字列
          </div>
          <div className="p-2 bg-muted border border-border rounded font-mono text-sm">
            {step.fullText || "(空)"}
          </div>
        </div>

        {/* Tree */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Rope 木構造
          </div>
          <div className="flex justify-center overflow-x-auto pb-2 min-h-[80px] border border-border rounded p-3">
            {step.rootId !== null ? (
              <TreeNodeView
                nodeId={step.rootId}
                allNodes={step.nodes}
                step={step}
              />
            ) : (
              <div className="text-sm text-muted-foreground">空</div>
            )}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            文字列長:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.fullText.length}
            </span>
          </span>
          <span>
            ノード数:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.nodes.length}
            </span>
          </span>
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded" />
            <span>処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200 rounded" />
            <span>デフォルト</span>
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
      </div>
    </div>
  );
}
