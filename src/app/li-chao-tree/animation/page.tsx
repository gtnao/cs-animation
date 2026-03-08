"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "add_line" | "compare" | "replace" | "recurse_left" | "recurse_right" | "query" | "done";

interface Line {
  a: number;
  b: number;
}

interface TreeNode {
  line: Line | null;
  left: number;
  right: number;
}

interface Step {
  type: StepType;
  lines: Line[];
  nodes: TreeNode[];
  currentNode: number;
  queryX: number;
  queryResult: number | null;
  newLine: Line | null;
  description: string;
}

function evalLine(line: Line, x: number): number {
  return line.a * x + line.b;
}

function generateSteps(operations: ({ type: "add"; a: number; b: number } | { type: "query"; x: number })[]): Step[] {
  const steps: Step[] = [];
  const L = 0, R = 16;
  const SIZE = 64;
  const nodes: (Line | null)[] = new Array(SIZE).fill(null);
  const lines: Line[] = [];

  steps.push({
    type: "init",
    lines: [],
    nodes: Array.from({ length: Math.min(SIZE, 16) }, (_, i) => ({
      line: null,
      left: L,
      right: R,
    })),
    currentNode: -1,
    queryX: -1,
    queryResult: null,
    newLine: null,
    description: `Li Chao Tree を初期化。x 範囲 [${L}, ${R}]`,
  });

  function addLine(node: number, lo: number, hi: number, line: Line) {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);

    if (nodes[node] === null) {
      nodes[node] = { ...line };
      steps.push({
        type: "add_line",
        lines: [...lines],
        nodes: Array.from({ length: Math.min(SIZE, 16) }, (_, i) => ({
          line: nodes[i] ? { ...nodes[i]! } : null,
          left: lo,
          right: hi,
        })),
        currentNode: node,
        queryX: -1,
        queryResult: null,
        newLine: { ...line },
        description: `ノード${node} ([${lo},${hi})): 空なので直線 y=${line.a}x+${line.b} を配置`,
      });
      return;
    }

    const cur = nodes[node]!;
    const leftBetter = evalLine(line, lo) < evalLine(cur, lo);
    const midBetter = evalLine(line, mid) < evalLine(cur, mid);

    steps.push({
      type: "compare",
      lines: [...lines],
      nodes: Array.from({ length: Math.min(SIZE, 16) }, (_, i) => ({
        line: nodes[i] ? { ...nodes[i]! } : null,
        left: lo,
        right: hi,
      })),
      currentNode: node,
      queryX: mid,
      queryResult: null,
      newLine: { ...line },
      description: `ノード${node}: 中点x=${mid}で比較。既存=${evalLine(cur, mid)}, 新規=${evalLine(line, mid)}`,
    });

    if (midBetter) {
      nodes[node] = { ...line };
      steps.push({
        type: "replace",
        lines: [...lines],
        nodes: Array.from({ length: Math.min(SIZE, 16) }, (_, i) => ({
          line: nodes[i] ? { ...nodes[i]! } : null,
          left: lo,
          right: hi,
        })),
        currentNode: node,
        queryX: -1,
        queryResult: null,
        newLine: { ...line },
        description: `新直線の方が中点で小さい。ノード${node}の直線を置換`,
      });

      if (leftBetter) {
        if (2 * node + 2 < SIZE) addLine(2 * node + 2, mid, hi, cur);
      } else {
        if (2 * node + 1 < SIZE) addLine(2 * node + 1, lo, mid, cur);
      }
    } else {
      if (leftBetter) {
        if (2 * node + 1 < SIZE) addLine(2 * node + 1, lo, mid, line);
      } else {
        if (2 * node + 2 < SIZE) addLine(2 * node + 2, mid, hi, line);
      }
    }
  }

  function query(node: number, lo: number, hi: number, x: number): number {
    if (lo >= hi || node >= SIZE) return Infinity;
    const mid = Math.floor((lo + hi) / 2);
    let val = nodes[node] ? evalLine(nodes[node]!, x) : Infinity;

    steps.push({
      type: "query",
      lines: [...lines],
      nodes: Array.from({ length: Math.min(SIZE, 16) }, (_, i) => ({
        line: nodes[i] ? { ...nodes[i]! } : null,
        left: lo,
        right: hi,
      })),
      currentNode: node,
      queryX: x,
      queryResult: val === Infinity ? null : val,
      newLine: null,
      description: `クエリ x=${x}: ノード${node}の値=${val === Infinity ? "∞" : val}`,
    });

    if (x < mid) {
      val = Math.min(val, query(2 * node + 1, lo, mid, x));
    } else {
      val = Math.min(val, query(2 * node + 2, mid, hi, x));
    }
    return val;
  }

  for (const op of operations) {
    if (op.type === "add") {
      const line = { a: op.a, b: op.b };
      lines.push({ ...line });
      addLine(0, L, R, line);
    } else {
      const result = query(0, L, R, op.x);
      steps.push({
        type: "query",
        lines: [...lines],
        nodes: Array.from({ length: Math.min(SIZE, 16) }, (_, i) => ({
          line: nodes[i] ? { ...nodes[i]! } : null,
          left: L,
          right: R,
        })),
        currentNode: -1,
        queryX: op.x,
        queryResult: result === Infinity ? null : result,
        newLine: null,
        description: `クエリ結果: x=${op.x} での最小値 = ${result === Infinity ? "∞" : result}`,
      });
    }
  }

  steps.push({
    type: "done",
    lines: [...lines],
    nodes: Array.from({ length: Math.min(SIZE, 16) }, (_, i) => ({
      line: nodes[i] ? { ...nodes[i]! } : null,
      left: L,
      right: R,
    })),
    currentNode: -1,
    queryX: -1,
    queryResult: null,
    newLine: null,
    description: `全操作完了。${lines.length}本の直線を管理`,
  });

  return steps;
}

export default function LiChaoTreeAnimationPage() {
  const [inputOps, setInputOps] = useState("a1,2 a-1,10 a0,5 q3 q5 q8");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((opsStr: string) => {
    const ops = opsStr.trim().split(/\s+/).map((s) => {
      if (s.startsWith("a")) {
        const parts = s.slice(1).split(",").map(Number);
        return { type: "add" as const, a: parts[0], b: parts[1] };
      } else if (s.startsWith("q")) {
        return { type: "query" as const, x: parseInt(s.slice(1)) };
      }
      return null;
    }).filter((x): x is { type: "add"; a: number; b: number } | { type: "query"; x: number } => x !== null);
    if (ops.length === 0) return;
    setSteps(generateSteps(ops));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(inputOps); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

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
    <>
<div className="flex gap-2 mb-8">
          <Input value={inputOps} onChange={(e) => setInputOps(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputOps); }} placeholder="a傾き,切片 q位置 ..." className="font-mono max-w-md" />
          <Button onClick={() => run(inputOps)} variant="outline">実行</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">登録済み直線</div>
          <div className="flex gap-2 flex-wrap">
            {step.lines.length > 0 ? step.lines.map((l, idx) => (
              <div key={idx} className={`px-3 py-1 border-2 rounded text-sm font-mono ${step.newLine && l.a === step.newLine.a && l.b === step.newLine.b && idx === step.lines.length - 1 ? "bg-blue-100 border-blue-400" : "bg-white border-gray-200"}`}>
                y={l.a}x{l.b >= 0 ? "+" : ""}{l.b}
              </div>
            )) : <div className="text-sm text-muted-foreground">（なし）</div>}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">木ノード (一部)</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.nodes.slice(0, 15).map((node, idx) => (
              <div key={idx} className={`w-20 h-10 flex items-center justify-center border-2 text-xs font-mono transition-colors ${idx === step.currentNode ? "bg-amber-50 border-amber-400" : node.line ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200 text-muted-foreground"}`}>
                {node.line ? `${node.line.a}x+${node.line.b}` : "空"}
              </div>
            ))}
          </div>
        </div>

        {step.queryResult !== null && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">クエリ結果</div>
            <div className="inline-block px-3 py-1 border-2 bg-emerald-100 border-emerald-500 text-sm font-mono rounded">
              f({step.queryX}) = {step.queryResult}
            </div>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>新規直線</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>処理中ノード</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>クエリ結果</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
    </>
  );
}
