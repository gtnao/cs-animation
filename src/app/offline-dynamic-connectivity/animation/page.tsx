"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "add_edge" | "remove_edge" | "query" | "process_segment" | "done";

interface Edge {
  u: number;
  v: number;
  addTime: number;
  removeTime: number;
}

interface Step {
  type: StepType;
  n: number;
  edges: Edge[];
  timeline: number;
  totalTime: number;
  activeEdges: [number, number][];
  parent: number[];
  queryResult: string;
  description: string;
}

function generateSteps(n: number, events: { type: string; u: number; v: number; time: number }[]): Step[] {
  const steps: Step[] = [];
  const totalTime = events.length;

  steps.push({
    type: "init",
    n,
    edges: [],
    timeline: -1,
    totalTime,
    activeEdges: [],
    parent: Array.from({ length: n }, (_, i) => i),
    queryResult: "",
    description: `${n}頂点のグラフ。${totalTime}個のイベントをオフラインで処理`,
  });

  const edgeMap = new Map<string, { u: number; v: number; addTime: number }>();
  const completedEdges: Edge[] = [];
  const parent = Array.from({ length: n }, (_, i) => i);

  function find(x: number): number {
    while (parent[x] !== x) x = parent[x];
    return x;
  }

  for (let t = 0; t < events.length; t++) {
    const ev = events[t];
    const key = `${Math.min(ev.u, ev.v)}-${Math.max(ev.u, ev.v)}`;

    if (ev.type === "add") {
      edgeMap.set(key, { u: ev.u, v: ev.v, addTime: t });
      const activeEdges: [number, number][] = [];
      edgeMap.forEach((e) => activeEdges.push([e.u, e.v]));

      steps.push({
        type: "add_edge",
        n,
        edges: [...completedEdges],
        timeline: t,
        totalTime,
        activeEdges,
        parent: [...parent],
        queryResult: "",
        description: `時刻${t}: 辺 (${ev.u}, ${ev.v}) を追加`,
      });

      // Union
      const ru = find(ev.u);
      const rv = find(ev.v);
      if (ru !== rv) parent[ru] = rv;
    } else if (ev.type === "remove") {
      const edge = edgeMap.get(key);
      if (edge) {
        completedEdges.push({ ...edge, removeTime: t });
        edgeMap.delete(key);
      }
      const activeEdges: [number, number][] = [];
      edgeMap.forEach((e) => activeEdges.push([e.u, e.v]));

      // Rebuild UF
      for (let i = 0; i < n; i++) parent[i] = i;
      for (const [eu, ev] of activeEdges) {
        const ru = find(eu);
        const rv = find(ev);
        if (ru !== rv) parent[ru] = rv;
      }

      steps.push({
        type: "remove_edge",
        n,
        edges: [...completedEdges],
        timeline: t,
        totalTime,
        activeEdges,
        parent: [...parent],
        queryResult: "",
        description: `時刻${t}: 辺 (${ev.u}, ${ev.v}) を削除。UF再構築`,
      });
    } else if (ev.type === "query") {
      const ru = find(ev.u);
      const rv = find(ev.v);
      const connected = ru === rv;
      const activeEdges: [number, number][] = [];
      edgeMap.forEach((e) => activeEdges.push([e.u, e.v]));

      steps.push({
        type: "query",
        n,
        edges: [...completedEdges],
        timeline: t,
        totalTime,
        activeEdges,
        parent: [...parent],
        queryResult: connected ? "連結" : "非連結",
        description: `時刻${t}: query(${ev.u}, ${ev.v}) → ${connected ? "連結" : "非連結"}`,
      });
    }
  }

  steps.push({
    type: "done",
    n,
    edges: [...completedEdges],
    timeline: totalTime,
    totalTime,
    activeEdges: [],
    parent: [...parent],
    queryResult: "",
    description: "全イベント処理完了",
  });

  return steps;
}

function getNodeClass(idx: number, step: Step): string {
  const base = "w-12 h-12 flex items-center justify-center border-2 text-sm font-mono rounded-full transition-colors";
  if (step.type === "query" || step.type === "add_edge" || step.type === "remove_edge") {
    const isActive = step.activeEdges.some(([u, v]) => u === idx || v === idx);
    if (isActive) return `${base} bg-amber-50 border-amber-400`;
  }
  return `${base} bg-white border-gray-200`;
}

export default function OfflineDynamicConnectivityAnimationPage() {
  const [inputN, setInputN] = useState("5");
  const [inputEvents, setInputEvents] = useState("a0-1,a1-2,q0-2,r0-1,q0-2,a3-4,q1-4");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((nStr: string, evStr: string) => {
    const n = parseInt(nStr);
    if (isNaN(n) || n <= 0) return;
    const events = evStr.trim().split(/[\s,]+/).map((s, i) => {
      const typeChar = s[0];
      const parts = s.slice(1).split("-").map(Number);
      const type = typeChar === "a" ? "add" : typeChar === "r" ? "remove" : "query";
      return { type, u: parts[0], v: parts[1], time: i };
    }).filter((e) => !isNaN(e.u) && !isNaN(e.v));
    if (events.length === 0) return;
    setSteps(generateSteps(n, events));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(inputN, inputEvents); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

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
        <h1 className="text-2xl font-bold mb-1">オフライン削除 (Offline Dynamic Connectivity)</h1>
        <p className="text-sm text-muted-foreground mb-6">辺の追加・削除をオフラインで処理し連結性を判定</p>

        <div className="flex gap-2 mb-8 flex-wrap">
          <Input value={inputN} onChange={(e) => setInputN(e.target.value)} placeholder="頂点数" className="font-mono w-24" />
          <Input value={inputEvents} onChange={(e) => setInputEvents(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputN, inputEvents); }} placeholder="a0-1,r0-1,q0-2,..." className="font-mono max-w-sm" />
          <Button onClick={() => run(inputN, inputEvents)} variant="outline">実行</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">頂点</div>
          <div className="flex gap-3 overflow-x-auto pb-1 flex-wrap">
            {Array.from({ length: step.n }, (_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getNodeClass(idx, step)}>{idx}</div>
                <div className="text-[10px] text-muted-foreground font-mono">p={step.parent[idx]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">アクティブな辺</div>
          <div className="flex gap-2 flex-wrap">
            {step.activeEdges.length > 0 ? step.activeEdges.map(([u, v], idx) => (
              <div key={idx} className="px-3 py-1 border-2 bg-amber-50 border-amber-400 text-sm font-mono rounded">({u},{v})</div>
            )) : <div className="text-sm text-muted-foreground">（なし）</div>}
          </div>
        </div>

        {step.queryResult && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">クエリ結果</div>
            <div className={`inline-block px-3 py-1 border-2 text-sm font-mono rounded ${step.queryResult === "連結" ? "bg-emerald-100 border-emerald-500" : "bg-red-100 border-red-500"}`}>
              {step.queryResult}
            </div>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>時刻 = <span className="font-mono font-semibold text-foreground">{step.timeline}</span></span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" /><span>辺あり</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>連結</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>非連結</span></div>
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
