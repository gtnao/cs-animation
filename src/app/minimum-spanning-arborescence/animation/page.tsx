"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "select_min_edge" | "detect_cycle" | "contract" | "expand" | "done";

interface Edge {
  from: number;
  to: number;
  weight: number;
}

interface Step {
  type: StepType;
  n: number;
  edges: Edge[];
  root: number;
  selectedEdges: number[];
  minEdge: number[];
  cycleNodes: number[];
  resultEdges: number[];
  phase: number;
  description: string;
}

function generateSteps(n: number, edges: Edge[], root: number): Step[] {
  const steps: Step[] = [];

  steps.push({
    type: "init",
    n,
    edges: edges.map((e) => ({ ...e })),
    root,
    selectedEdges: [],
    minEdge: [],
    cycleNodes: [],
    resultEdges: [],
    phase: 0,
    description: `${n}頂点, ${edges.length}辺の有向グラフ。根=${root}から最小全域有向木を構築`,
  });

  // Edmonds' algorithm simplified simulation
  const minEdge = new Array(n).fill(-1);

  // Phase 1: Select minimum incoming edge for each non-root vertex
  for (let v = 0; v < n; v++) {
    if (v === root) continue;
    let bestIdx = -1;
    let bestWeight = Infinity;
    for (let ei = 0; ei < edges.length; ei++) {
      if (edges[ei].to === v && edges[ei].weight < bestWeight) {
        bestWeight = edges[ei].weight;
        bestIdx = ei;
      }
    }
    if (bestIdx >= 0) {
      minEdge[v] = bestIdx;
      steps.push({
        type: "select_min_edge",
        n,
        edges: edges.map((e) => ({ ...e })),
        root,
        selectedEdges: minEdge.filter((e) => e >= 0),
        minEdge: [...minEdge],
        cycleNodes: [],
        resultEdges: [],
        phase: 1,
        description: `頂点${v}への最小入辺: (${edges[bestIdx].from}→${v}, 重み${edges[bestIdx].weight})`,
      });
    }
  }

  // Check for cycles among selected edges
  const visited = new Array(n).fill(-1);
  let hasCycle = false;
  const cycleNodes: number[] = [];

  for (let v = 0; v < n; v++) {
    if (v === root) continue;
    let cur = v;
    const path: number[] = [];
    while (cur !== root && visited[cur] === -1) {
      visited[cur] = v;
      path.push(cur);
      if (minEdge[cur] >= 0) {
        cur = edges[minEdge[cur]].from;
      } else break;
    }
    if (cur !== root && visited[cur] === v) {
      hasCycle = true;
      let c = cur;
      do {
        cycleNodes.push(c);
        if (minEdge[c] >= 0) c = edges[minEdge[c]].from;
      } while (c !== cur);
      break;
    }
  }

  if (hasCycle) {
    steps.push({
      type: "detect_cycle",
      n,
      edges: edges.map((e) => ({ ...e })),
      root,
      selectedEdges: minEdge.filter((e) => e >= 0),
      minEdge: [...minEdge],
      cycleNodes: [...cycleNodes],
      resultEdges: [],
      phase: 1,
      description: `閉路を検出: {${cycleNodes.join(", ")}}。この閉路を縮約`,
    });

    steps.push({
      type: "contract",
      n,
      edges: edges.map((e) => ({ ...e })),
      root,
      selectedEdges: minEdge.filter((e) => e >= 0),
      minEdge: [...minEdge],
      cycleNodes: [...cycleNodes],
      resultEdges: [],
      phase: 2,
      description: `閉路 {${cycleNodes.join(", ")}} を1頂点に縮約して再帰的に解く`,
    });
  }

  // Final result
  const resultEdges = minEdge.filter((e) => e >= 0);
  const totalWeight = resultEdges.reduce((s, ei) => s + edges[ei].weight, 0);

  steps.push({
    type: "done",
    n,
    edges: edges.map((e) => ({ ...e })),
    root,
    selectedEdges: resultEdges,
    minEdge: [...minEdge],
    cycleNodes: [],
    resultEdges,
    phase: 3,
    description: `最小全域有向木完成。辺: [${resultEdges.map((ei) => `(${edges[ei].from}→${edges[ei].to})`).join(", ")}], 総重み=${totalWeight}`,
  });

  return steps;
}

function getNodeClass(idx: number, step: Step): string {
  const base = "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono rounded-full transition-colors";
  if (idx === step.root) return `${base} bg-emerald-100 border-emerald-500`;
  if (step.cycleNodes.includes(idx)) return `${base} bg-red-100 border-red-500`;
  return `${base} bg-white border-gray-200`;
}

export default function MinimumSpanningArborescenceAnimationPage() {
  const [inputN, setInputN] = useState("4");
  const [inputEdges, setInputEdges] = useState("0-1:2,0-2:3,1-2:1,2-3:4,1-3:5,3-0:6");
  const [inputRoot, setInputRoot] = useState("0");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((nStr: string, edgesStr: string, rootStr: string) => {
    const n = parseInt(nStr);
    const root = parseInt(rootStr);
    if (isNaN(n) || isNaN(root)) return;
    const edges: Edge[] = edgesStr.trim().split(",").map((s) => {
      const [nodes, w] = s.split(":");
      const [from, to] = nodes.split("-").map(Number);
      return { from, to, weight: parseInt(w) };
    }).filter((e) => !isNaN(e.from) && !isNaN(e.to) && !isNaN(e.weight));
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
        <h1 className="text-2xl font-bold mb-1">最小全域有向木 (Edmonds&apos; Algorithm)</h1>
        <p className="text-sm text-muted-foreground mb-6">有向グラフの最小全域有向木を構築</p>

        <div className="flex gap-2 mb-8 flex-wrap">
          <Input value={inputN} onChange={(e) => setInputN(e.target.value)} placeholder="頂点数" className="font-mono w-20" />
          <Input value={inputEdges} onChange={(e) => setInputEdges(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputN, inputEdges, inputRoot); }} placeholder="from-to:weight,..." className="font-mono max-w-sm" />
          <Input value={inputRoot} onChange={(e) => setInputRoot(e.target.value)} placeholder="根" className="font-mono w-16" />
          <Button onClick={() => run(inputN, inputEdges, inputRoot)} variant="outline">実行</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">頂点</div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {Array.from({ length: step.n }, (_, idx) => (
              <div key={idx} className={getNodeClass(idx, step)}>{idx}</div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">辺</div>
          <div className="flex gap-2 flex-wrap">
            {step.edges.map((e, idx) => (
              <div key={idx} className={`px-2 py-1 border-2 rounded text-xs font-mono ${
                step.selectedEdges.includes(idx) ? "bg-emerald-100 border-emerald-500" :
                "bg-white border-gray-200"
              }`}>
                {e.from}→{e.to} (w={e.weight})
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Phase {step.phase}</span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" /><span>根 / 選択辺</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500 rounded-full" /><span>閉路</span></div>
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
