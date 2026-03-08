"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface PANode {
  id: number;
  value: number | null; // null for internal nodes
  left: number | null;
  right: number | null;
}

interface Version {
  rootId: number;
  label: string;
}

type StepType =
  | "init"
  | "build"
  | "get_start"
  | "get_traverse"
  | "get_found"
  | "set_start"
  | "set_copy"
  | "set_done"
  | "done";

interface Step {
  type: StepType;
  nodes: PANode[];
  versions: Version[];
  currentVersion: number;
  highlightIds: number[];
  description: string;
}

// --- Algorithm ---

let nextId = 0;

function cloneNodes(nodes: PANode[]): PANode[] {
  return nodes.map((n) => ({ ...n }));
}

function generateSteps(operations: string): Step[] {
  nextId = 0;
  const steps: Step[] = [];
  let nodes: PANode[] = [];
  const versions: Version[] = [];
  const depth = 3; // supports up to 8 elements
  const size = 1 << depth; // 8

  // Build initial tree
  function buildTree(arr: number[], lo: number, hi: number, d: number): number {
    const id = nextId++;
    if (d === 0) {
      nodes.push({ id, value: arr[lo] ?? 0, left: null, right: null });
      return id;
    }
    const mid = (lo + hi) >> 1;
    const leftId = buildTree(arr, lo, mid, d - 1);
    const rightId = buildTree(arr, mid, hi, d - 1);
    nodes.push({ id, value: null, left: leftId, right: rightId });
    return id;
  }

  steps.push({
    type: "init",
    nodes: [],
    versions: [],
    currentVersion: -1,
    highlightIds: [],
    description: "Persistent Array を初期化",
  });

  // Parse initial array
  const ops = operations.split(";").map((s) => s.trim()).filter((s) => s.length > 0);

  let initArr = [1, 2, 3, 4, 5, 6, 7, 8];
  if (ops.length > 0 && ops[0].startsWith("[")) {
    const match = ops[0].match(/\[([\d,\s]+)\]/);
    if (match) {
      initArr = match[1].split(",").map((s) => parseInt(s.trim()));
      while (initArr.length < size) initArr.push(0);
      ops.shift();
    }
  }

  const rootId = buildTree(initArr, 0, size, depth);
  versions.push({ rootId, label: "v0" });

  steps.push({
    type: "build",
    nodes: cloneNodes(nodes),
    versions: [...versions],
    currentVersion: 0,
    highlightIds: [rootId],
    description: `初期配列 [${initArr.slice(0, size).join(",")}] から木を構築 (Version 0)`,
  });

  // Process operations
  for (const op of ops) {
    if (op.startsWith("g")) {
      // Get: g[version,index]
      const match = op.match(/g\[?(\d+),(\d+)\]?/);
      if (!match) continue;
      const ver = parseInt(match[1]);
      const idx = parseInt(match[2]);

      if (ver >= versions.length || idx >= size) continue;

      steps.push({
        type: "get_start",
        nodes: cloneNodes(nodes),
        versions: [...versions],
        currentVersion: ver,
        highlightIds: [versions[ver].rootId],
        description: `Get(v${ver}, index=${idx}): Version ${ver} から読み取り`,
      });

      // Traverse
      let curId = versions[ver].rootId;
      for (let d = depth - 1; d >= 0; d--) {
        const cur = nodes.find((n) => n.id === curId)!;
        const bit = (idx >> d) & 1;

        steps.push({
          type: "get_traverse",
          nodes: cloneNodes(nodes),
          versions: [...versions],
          currentVersion: ver,
          highlightIds: [curId],
          description: `深さ ${depth - d}: index のビット${d} = ${bit} → ${bit === 0 ? "左" : "右"}へ`,
        });

        curId = bit === 0 ? cur.left! : cur.right!;
      }

      const leaf = nodes.find((n) => n.id === curId)!;
      steps.push({
        type: "get_found",
        nodes: cloneNodes(nodes),
        versions: [...versions],
        currentVersion: ver,
        highlightIds: [curId],
        description: `Get(v${ver}, ${idx}) = ${leaf.value}`,
      });
    } else if (op.startsWith("s")) {
      // Set: s[version,index,value]
      const match = op.match(/s\[?(\d+),(\d+),(\d+)\]?/);
      if (!match) continue;
      const ver = parseInt(match[1]);
      const idx = parseInt(match[2]);
      const val = parseInt(match[3]);

      if (ver >= versions.length || idx >= size) continue;

      steps.push({
        type: "set_start",
        nodes: cloneNodes(nodes),
        versions: [...versions],
        currentVersion: ver,
        highlightIds: [versions[ver].rootId],
        description: `Set(v${ver}, index=${idx}, value=${val}): パスコピー開始`,
      });

      // Path copy
      function pathCopy(nodeId: number, d: number): number {
        const orig = nodes.find((n) => n.id === nodeId)!;
        const newNodeId = nextId++;

        if (d === 0) {
          // Leaf: create new with updated value
          nodes.push({ id: newNodeId, value: val, left: null, right: null });
          steps.push({
            type: "set_copy",
            nodes: cloneNodes(nodes),
            versions: [...versions],
            currentVersion: ver,
            highlightIds: [newNodeId],
            description: `葉ノードをコピー: 値 ${orig.value} → ${val}`,
          });
          return newNodeId;
        }

        const bit = (idx >> (d - 1)) & 1;
        let newLeft = orig.left;
        let newRight = orig.right;

        if (bit === 0) {
          newLeft = pathCopy(orig.left!, d - 1);
        } else {
          newRight = pathCopy(orig.right!, d - 1);
        }

        nodes.push({ id: newNodeId, value: null, left: newLeft, right: newRight });

        steps.push({
          type: "set_copy",
          nodes: cloneNodes(nodes),
          versions: [...versions],
          currentVersion: ver,
          highlightIds: [newNodeId],
          description: `内部ノードをコピー (深さ ${depth - d})`,
        });

        return newNodeId;
      }

      const newRootId = pathCopy(versions[ver].rootId, depth);
      const newVer = versions.length;
      versions.push({ rootId: newRootId, label: `v${newVer}` });

      steps.push({
        type: "set_done",
        nodes: cloneNodes(nodes),
        versions: [...versions],
        currentVersion: newVer,
        highlightIds: [newRootId],
        description: `Set 完了: Version ${newVer} を作成 (${depth + 1}ノードをコピー)`,
      });
    }
  }

  steps.push({
    type: "done",
    nodes: cloneNodes(nodes),
    versions: [...versions],
    currentVersion: versions.length - 1,
    highlightIds: [],
    description: `全操作完了: ${versions.length} バージョン`,
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
  allNodes: PANode[];
  step: Step;
}) {
  if (nodeId === null) return null;
  const node = allNodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const isHighlighted = step.highlightIds.includes(node.id);
  const isLeaf = node.value !== null;

  let bgClass = "bg-white";
  let borderClass = "border-gray-200";

  if (isHighlighted) {
    bgClass = "bg-blue-100";
    borderClass = "border-blue-400";
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-8 h-8 flex items-center justify-center border-2 rounded text-xs font-mono ${bgClass} ${borderClass}`}
      >
        {isLeaf ? node.value : "o"}
      </div>
      {!isLeaf && (
        <div className="flex gap-1 mt-0.5">
          <TreeNodeView nodeId={node.left} allNodes={allNodes} step={step} />
          <TreeNodeView nodeId={node.right} allNodes={allNodes} step={step} />
        </div>
      )}
    </div>
  );
}

// --- Component ---

export default function PersistentArrayAnimationPage() {
  const [input, setInput] = useState(
    "[1,2,3,4,5,6,7,8];s[0,2,99];g[0,2];g[1,2];s[1,5,42]"
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
    <>
<div className="flex gap-2 mb-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="[1,2,3,4,5,6,7,8];s[0,2,99];g[1,2]"
            className="font-mono max-w-lg"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          [配列]=初期値, s[ver,idx,val]=set, g[ver,idx]=get (セミコロン区切り)
        </p>

        {/* Version trees */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            バージョン (現在: {step.currentVersion >= 0 ? `v${step.currentVersion}` : "-"})
          </div>
          <div className="flex gap-6 overflow-x-auto pb-2 border border-border rounded p-3 min-h-[120px]">
            {step.versions.map((ver, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`text-xs font-mono mb-1 px-2 py-0.5 rounded ${
                    i === step.currentVersion
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {ver.label}
                </div>
                <TreeNodeView
                  nodeId={ver.rootId}
                  allNodes={step.nodes}
                  step={step}
                />
              </div>
            ))}
            {step.versions.length === 0 && (
              <div className="text-sm text-muted-foreground">空</div>
            )}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            バージョン数:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.versions.length}
            </span>
          </span>
          <span>
            総ノード数:{" "}
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
            <span>処理中 / コピー</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200 rounded" />
            <span>共有ノード</span>
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
    </>
  );
}
