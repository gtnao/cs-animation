"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "dfs" | "compute_sdom" | "compute_idom" | "link" | "done";

interface Step {
  type: StepType;
  n: number;
  edges: [number, number][];
  root: number;
  dfsOrder: number[];
  dfsNum: number[];
  sdom: number[];
  idom: number[];
  currentNode: number;
  description: string;
}

function generateSteps(n: number, edges: [number, number][], root: number): Step[] {
  const steps: Step[] = [];
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
  }

  steps.push({
    type: "init",
    n,
    edges: edges.map(([u, v]) => [u, v] as [number, number]),
    root,
    dfsOrder: [],
    dfsNum: new Array(n).fill(-1),
    sdom: new Array(n).fill(-1),
    idom: new Array(n).fill(-1),
    currentNode: root,
    description: `${n}頂点, ${edges.length}辺の有向グラフ。根=${root}からDominator Treeを構築`,
  });

  // DFS
  const dfsOrder: number[] = [];
  const dfsNum = new Array(n).fill(-1);
  const parent = new Array(n).fill(-1);
  let cnt = 0;

  function dfs(v: number) {
    dfsNum[v] = cnt++;
    dfsOrder.push(v);
    for (const u of adj[v]) {
      if (dfsNum[u] === -1) {
        parent[u] = v;
        dfs(u);
      }
    }
  }
  dfs(root);

  for (let i = 0; i < dfsOrder.length; i++) {
    steps.push({
      type: "dfs",
      n,
      edges: edges.map(([u, v]) => [u, v] as [number, number]),
      root,
      dfsOrder: dfsOrder.slice(0, i + 1),
      dfsNum: [...dfsNum],
      sdom: new Array(n).fill(-1),
      idom: new Array(n).fill(-1),
      currentNode: dfsOrder[i],
      description: `DFS: 頂点${dfsOrder[i]} を訪問 (DFS番号=${dfsNum[dfsOrder[i]]})`,
    });
  }

  // Simplified dominator computation
  const idom = new Array(n).fill(-1);
  idom[root] = root;

  // For each node in reverse DFS order, compute immediate dominator
  const rpo = [...dfsOrder];
  for (let i = 1; i < rpo.length; i++) {
    const v = rpo[i];
    // Find predecessors
    const preds = edges.filter(([, to]) => to === v).map(([from]) => from);
    let newIdom = -1;
    for (const p of preds) {
      if (idom[p] !== -1 || p === root) {
        if (newIdom === -1) {
          newIdom = p;
        } else {
          // Intersect
          let a = newIdom, b = p;
          while (a !== b) {
            while (dfsNum[a] > dfsNum[b]) a = idom[a] !== -1 ? idom[a] : root;
            while (dfsNum[b] > dfsNum[a]) b = idom[b] !== -1 ? idom[b] : root;
          }
          newIdom = a;
        }
      }
    }
    if (newIdom !== -1) {
      idom[v] = newIdom;
    } else {
      idom[v] = parent[v] >= 0 ? parent[v] : root;
    }

    steps.push({
      type: "compute_idom",
      n,
      edges: edges.map(([u, v]) => [u, v] as [number, number]),
      root,
      dfsOrder: [...dfsOrder],
      dfsNum: [...dfsNum],
      sdom: new Array(n).fill(-1),
      idom: [...idom],
      currentNode: v,
      description: `idom[${v}] = ${idom[v]} (${v}への全パスで最後の共通支配者)`,
    });
  }

  steps.push({
    type: "done",
    n,
    edges: edges.map(([u, v]) => [u, v] as [number, number]),
    root,
    dfsOrder: [...dfsOrder],
    dfsNum: [...dfsNum],
    sdom: new Array(n).fill(-1),
    idom: [...idom],
    currentNode: -1,
    description: `Dominator Tree構築完了。idom = [${idom.join(", ")}]`,
  });

  return steps;
}

function getNodeClass(idx: number, step: Step): string {
  const base = "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono rounded-full transition-colors";
  if (idx === step.root) return `${base} bg-emerald-100 border-emerald-500`;
  if (idx === step.currentNode) return `${base} bg-blue-100 border-blue-400`;
  if (step.dfsOrder.includes(idx)) return `${base} bg-amber-50 border-amber-400`;
  return `${base} bg-white border-gray-200`;
}

export default function DominatorTreeAnimationPage() {
  const [inputN, setInputN] = useState("6");
  const [inputEdges, setInputEdges] = useState("0-1,0-2,1-3,2-3,2-4,3-5,4-5");
  const [inputRoot, setInputRoot] = useState("0");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((nStr: string, edgesStr: string, rootStr: string) => {
    const n = parseInt(nStr);
    const root = parseInt(rootStr);
    if (isNaN(n) || isNaN(root)) return;
    const edges: [number, number][] = edgesStr.trim().split(",").map((s) => {
      const parts = s.split("-").map(Number);
      return [parts[0], parts[1]] as [number, number];
    }).filter(([u, v]) => !isNaN(u) && !isNaN(v));
    if (edges.length === 0) return;
    setSteps(generateSteps(n, edges, root));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(inputN, inputEdges, inputRoot); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 700);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((prev) => !prev); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Dominator Tree</h1>
        <p className="text-sm text-muted-foreground mb-6">有向グラフの支配木を構築</p>

        <div className="flex gap-2 mb-8 flex-wrap">
          <Input value={inputN} onChange={(e) => setInputN(e.target.value)} placeholder="頂点数" className="font-mono w-20" />
          <Input value={inputEdges} onChange={(e) => setInputEdges(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputN, inputEdges, inputRoot); }} placeholder="u-v,..." className="font-mono max-w-sm" />
          <Input value={inputRoot} onChange={(e) => setInputRoot(e.target.value)} placeholder="根" className="font-mono w-16" />
          <Button onClick={() => run(inputN, inputEdges, inputRoot)} variant="outline">実行</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">頂点</div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {Array.from({ length: step.n }, (_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getNodeClass(idx, step)}>{idx}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {step.dfsNum[idx] >= 0 ? `d=${step.dfsNum[idx]}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">辺</div>
          <div className="flex gap-2 flex-wrap">
            {step.edges.map(([u, v], idx) => (
              <div key={idx} className="px-2 py-1 border-2 bg-white border-gray-200 rounded text-xs font-mono">{u}→{v}</div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">即時支配者 (idom)</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.idom.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={`w-12 h-10 flex items-center justify-center border-2 text-sm font-mono ${val >= 0 ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200 text-muted-foreground"}`}>
                  {val >= 0 ? val : "–"}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" /><span>処理中</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" /><span>根</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" /><span>DFS訪問済み</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
      </div>
    </div>
  );
}
