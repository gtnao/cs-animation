"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface TreeNode {
  id: number;
  val: number;
  left: number | null;
  right: number | null;
}

type StepType =
  | "init"
  | "build_leaf"
  | "build_merge"
  | "update_start"
  | "update_copy"
  | "update_new_leaf"
  | "update_new_node"
  | "done";

interface Step {
  type: StepType;
  nodes: TreeNode[];
  roots: number[];
  n: number;
  highlightNodes: number[];
  currentVersion: number;
  description: string;
}

// --- Algorithm ---

let nodeCounter = 0;

function generateSteps(arr: number[]): {
  buildSteps: Step[];
  nodes: TreeNode[];
  roots: number[];
} {
  const n = arr.length;
  const nodes: TreeNode[] = [];
  const roots: number[] = [];
  const steps: Step[] = [];
  nodeCounter = 0;

  function newNode(val: number, left: number | null, right: number | null): number {
    const id = nodeCounter++;
    nodes.push({ id, val, left, right });
    return id;
  }

  function build(start: number, end: number): number {
    if (start === end) {
      const id = newNode(arr[start], null, null);
      steps.push({
        type: "build_leaf",
        nodes: nodes.map((nd) => ({ ...nd })),
        roots: [...roots],
        n,
        highlightNodes: [id],
        currentVersion: 0,
        description: `葉ノード ${id}: 値 = ${arr[start]} (位置 ${start})`,
      });
      return id;
    }
    const mid = Math.floor((start + end) / 2);
    const l = build(start, mid);
    const r = build(mid + 1, end);
    const id = newNode(nodes[l].val + nodes[r].val, l, r);
    steps.push({
      type: "build_merge",
      nodes: nodes.map((nd) => ({ ...nd })),
      roots: [...roots],
      n,
      highlightNodes: [id],
      currentVersion: 0,
      description: `ノード ${id}: ${nodes[l].val} + ${nodes[r].val} = ${nodes[id].val}`,
    });
    return id;
  }

  steps.push({
    type: "init",
    nodes: [],
    roots: [],
    n,
    highlightNodes: [],
    currentVersion: 0,
    description: `配列 [${arr.join(", ")}] から永続セグメント木を構築する`,
  });

  const root0 = build(0, n - 1);
  roots.push(root0);

  return { buildSteps: steps, nodes, roots };
}

function updateSteps(
  prevNodes: TreeNode[],
  prevRoots: number[],
  n: number,
  pos: number,
  val: number
): { steps: Step[]; nodes: TreeNode[]; roots: number[] } {
  const nodes = prevNodes.map((nd) => ({ ...nd }));
  const roots = [...prevRoots];
  const steps: Step[] = [];
  const version = roots.length;
  nodeCounter = nodes.length;

  function newNode(v: number, left: number | null, right: number | null): number {
    const id = nodeCounter++;
    nodes.push({ id, val: v, left, right });
    return id;
  }

  steps.push({
    type: "update_start",
    nodes: nodes.map((nd) => ({ ...nd })),
    roots: [...roots],
    n,
    highlightNodes: [],
    currentVersion: version,
    description: `バージョン ${version}: 位置 ${pos} を ${val} に更新`,
  });

  function update(prev: number, start: number, end: number, idx: number, v: number): number {
    if (start === end) {
      const id = newNode(v, null, null);
      steps.push({
        type: "update_new_leaf",
        nodes: nodes.map((nd) => ({ ...nd })),
        roots: [...roots],
        n,
        highlightNodes: [id],
        currentVersion: version,
        description: `新しい葉ノード ${id}: 値 = ${v}`,
      });
      return id;
    }
    const mid = Math.floor((start + end) / 2);
    let l = nodes[prev].left!;
    let r = nodes[prev].right!;
    if (idx <= mid) {
      steps.push({
        type: "update_copy",
        nodes: nodes.map((nd) => ({ ...nd })),
        roots: [...roots],
        n,
        highlightNodes: [r],
        currentVersion: version,
        description: `右の子ノード ${r} を再利用 (変更なし)`,
      });
      l = update(l, start, mid, idx, v);
    } else {
      steps.push({
        type: "update_copy",
        nodes: nodes.map((nd) => ({ ...nd })),
        roots: [...roots],
        n,
        highlightNodes: [l],
        currentVersion: version,
        description: `左の子ノード ${l} を再利用 (変更なし)`,
      });
      r = update(r, mid + 1, end, idx, v);
    }
    const newVal = nodes[l].val + nodes[r].val;
    const id = newNode(newVal, l, r);
    steps.push({
      type: "update_new_node",
      nodes: nodes.map((nd) => ({ ...nd })),
      roots: [...roots],
      n,
      highlightNodes: [id],
      currentVersion: version,
      description: `新しいノード ${id}: ${nodes[l].val} + ${nodes[r].val} = ${newVal}`,
    });
    return id;
  }

  const newRoot = update(roots[roots.length - 1], 0, n - 1, pos, val);
  roots.push(newRoot);

  steps.push({
    type: "done",
    nodes: nodes.map((nd) => ({ ...nd })),
    roots: [...roots],
    n,
    highlightNodes: [newRoot],
    currentVersion: version,
    description: `バージョン ${version} の根 = ノード ${newRoot} (全 ${roots.length} バージョン)`,
  });

  return { steps, nodes, roots };
}

// --- Visualization ---

function TreeVisualization({
  step,
  displayVersion,
}: {
  step: Step;
  displayVersion: number;
}) {
  const { nodes, roots } = step;
  if (roots.length === 0 || displayVersion >= roots.length) return null;

  const rootId = roots[displayVersion];
  const levels: { id: number; start: number; end: number }[][] = [];
  const n = step.n;

  function traverse(nodeId: number, start: number, end: number, level: number) {
    if (level >= levels.length) levels.push([]);
    levels[level].push({ id: nodeId, start, end });
    if (start === end) return;
    const mid = Math.floor((start + end) / 2);
    const nd = nodes[nodeId];
    if (nd.left !== null) traverse(nd.left, start, mid, level + 1);
    if (nd.right !== null) traverse(nd.right, mid + 1, end, level + 1);
  }

  traverse(rootId, 0, n - 1, 0);

  return (
    <div className="overflow-x-auto pb-2">
      {levels.map((level, li) => (
        <div key={li} className="flex justify-center gap-1 mb-1">
          {level.map(({ id, start, end }) => {
            const isHighlighted = step.highlightNodes.includes(id);
            const color = isHighlighted
              ? "bg-blue-100 border-blue-400"
              : "bg-white border-gray-200";
            return (
              <div key={`${li}-${id}`} className="flex flex-col items-center">
                <div
                  className={`min-w-[3rem] h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors rounded ${color}`}
                >
                  {nodes[id].val}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  #{id} [{start},{end}]
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// --- Component ---

export default function PersistentSegmentTreeAnimationPage() {
  const [input, setInput] = useState("1 2 3 4");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [updatePos, setUpdatePos] = useState("1");
  const [updateVal, setUpdateVal] = useState("10");
  const [displayVersion, setDisplayVersion] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesRef = useRef<TreeNode[]>([]);
  const rootsRef = useRef<number[]>([]);
  const arrRef = useRef<number[]>([]);

  const runBuild = useCallback((s: string) => {
    const arr = s.trim().split(/\s+/).map(Number).filter((x) => !isNaN(x));
    if (arr.length === 0) return;
    arrRef.current = arr;
    const { buildSteps, nodes, roots } = generateSteps(arr);
    nodesRef.current = nodes;
    rootsRef.current = roots;
    setSteps(buildSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    setDisplayVersion(0);
  }, []);

  const runUpdate = useCallback(() => {
    const pos = parseInt(updatePos);
    const val = parseInt(updateVal);
    const n = arrRef.current.length;
    if (isNaN(pos) || isNaN(val) || pos < 0 || pos >= n) return;
    const result = updateSteps(nodesRef.current, rootsRef.current, n, pos, val);
    nodesRef.current = result.nodes;
    rootsRef.current = result.roots;
    setSteps(result.steps);
    setCurrentStep(0);
    setIsPlaying(false);
    setDisplayVersion(result.roots.length - 1);
  }, [updatePos, updateVal]);

  useEffect(() => {
    runBuild(input);
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
        if (currentStep < steps.length - 1) setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  const versionCount = step.roots.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">永続セグメント木</h1>
        <p className="text-sm text-muted-foreground mb-6">
          過去のバージョンを保持しながら更新・クエリを行うセグメント木
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runBuild(input); }}
            placeholder="配列を空白区切りで入力"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => runBuild(input)} variant="outline">構築</Button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <Input value={updatePos} onChange={(e) => setUpdatePos(e.target.value)} placeholder="位置" className="font-mono w-16" />
          <Input value={updateVal} onChange={(e) => setUpdateVal(e.target.value)} placeholder="値" className="font-mono w-16" />
          <Button onClick={runUpdate} variant="outline">更新 (新バージョン)</Button>
        </div>

        <div className="flex gap-2 mb-8 items-center">
          <span className="text-sm text-muted-foreground">表示バージョン:</span>
          {Array.from({ length: versionCount }, (_, v) => (
            <Button
              key={v}
              variant={displayVersion === v ? "default" : "outline"}
              size="sm"
              onClick={() => setDisplayVersion(v)}
            >
              v{v}
            </Button>
          ))}
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            永続セグメント木 (バージョン {displayVersion})
          </div>
          <TreeVisualization step={step} displayVersion={displayVersion} />
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>バージョン数: <span className="font-mono font-semibold text-foreground">{versionCount}</span></span>
          <span>ノード数: <span className="font-mono font-semibold text-foreground">{step.nodes.length}</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>処理中 / 新規作成ノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>再利用ノード</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((p) => !p)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
      </div>
    </div>
  );
}
