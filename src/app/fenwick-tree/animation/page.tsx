"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "build"
  | "add_visit"
  | "add_update"
  | "sum_visit"
  | "sum_add"
  | "sum_result"
  | "done";

interface Step {
  type: StepType;
  bit: number[];
  arr: number[];
  n: number;
  highlightIndices: number[];
  description: string;
}

// --- Algorithm ---

function buildSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const n = arr.length;
  const bit = new Array(n + 1).fill(0);

  steps.push({
    type: "init",
    bit: [...bit],
    arr: [...arr],
    n,
    highlightIndices: [],
    description: `配列 [${arr.join(", ")}] から BIT を構築する (1-indexed)`,
  });

  for (let i = 0; i < n; i++) {
    let idx = i + 1;
    while (idx <= n) {
      bit[idx] += arr[i];
      idx += idx & (-idx);
    }
  }

  steps.push({
    type: "build",
    bit: [...bit],
    arr: [...arr],
    n,
    highlightIndices: [],
    description: `構築完了: BIT = [${bit.slice(1).join(", ")}]`,
  });

  return steps;
}

function addSteps(
  baseBit: number[],
  arr: number[],
  n: number,
  pos: number,
  val: number
): Step[] {
  const steps: Step[] = [];
  const bit = [...baseBit];
  const newArr = [...arr];
  newArr[pos] += val;

  steps.push({
    type: "add_visit",
    bit: [...bit],
    arr: [...newArr],
    n,
    highlightIndices: [pos],
    description: `位置 ${pos} に ${val} を加算する (1-indexed: ${pos + 1})`,
  });

  let idx = pos + 1;
  while (idx <= n) {
    bit[idx] += val;
    steps.push({
      type: "add_update",
      bit: [...bit],
      arr: [...newArr],
      n,
      highlightIndices: [idx],
      description: `BIT[${idx}] に ${val} を加算 → ${bit[idx]}。次のインデックス: ${idx + (idx & (-idx))}`,
    });
    idx += idx & (-idx);
  }

  steps.push({
    type: "done",
    bit: [...bit],
    arr: [...newArr],
    n,
    highlightIndices: [],
    description: `加算完了`,
  });

  return steps;
}

function sumSteps(
  baseBit: number[],
  arr: number[],
  n: number,
  pos: number
): Step[] {
  const steps: Step[] = [];
  const bit = [...baseBit];

  steps.push({
    type: "sum_visit",
    bit: [...bit],
    arr: [...arr],
    n,
    highlightIndices: [],
    description: `prefix sum [0, ${pos}] を求める (1-indexed: ${pos + 1})`,
  });

  let sum = 0;
  let idx = pos + 1;
  while (idx > 0) {
    sum += bit[idx];
    steps.push({
      type: "sum_add",
      bit: [...bit],
      arr: [...arr],
      n,
      highlightIndices: [idx],
      description: `BIT[${idx}] = ${bit[idx]} を加算。累積和 = ${sum}。次のインデックス: ${idx - (idx & (-idx))}`,
    });
    idx -= idx & (-idx);
  }

  steps.push({
    type: "sum_result",
    bit: [...bit],
    arr: [...arr],
    n,
    highlightIndices: [],
    description: `prefix sum [0, ${pos}] = ${sum}`,
  });

  return steps;
}

// --- Component ---

export default function FenwickTreeAnimationPage() {
  const [input, setInput] = useState("3 1 4 1 5 9 2 6");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [addPos, setAddPos] = useState("2");
  const [addVal, setAddVal] = useState("3");
  const [sumPos, setSumPos] = useState("4");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bitRef = useRef<number[]>([]);
  const arrRef = useRef<number[]>([]);

  const runBuild = useCallback((s: string) => {
    const arr = s.trim().split(/\s+/).map(Number).filter((x) => !isNaN(x));
    if (arr.length === 0) return;
    arrRef.current = arr;
    const st = buildSteps(arr);
    bitRef.current = st[st.length - 1].bit;
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const runAdd = useCallback(() => {
    const pos = parseInt(addPos);
    const val = parseInt(addVal);
    const n = arrRef.current.length;
    if (isNaN(pos) || isNaN(val) || pos < 0 || pos >= n) return;
    const st = addSteps(bitRef.current, arrRef.current, n, pos, val);
    const last = st[st.length - 1];
    bitRef.current = last.bit;
    arrRef.current = last.arr;
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [addPos, addVal]);

  const runSum = useCallback(() => {
    const pos = parseInt(sumPos);
    const n = arrRef.current.length;
    if (isNaN(pos) || pos < 0 || pos >= n) return;
    const st = sumSteps(bitRef.current, arrRef.current, n, pos);
    setSteps(st);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [sumPos]);

  useEffect(() => {
    runBuild(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">BIT / Fenwick Tree</h1>
        <p className="text-sm text-muted-foreground mb-6">
          累積和の計算と一点加算を O(log n) で行うデータ構造
        </p>

        <div className="flex gap-2 mb-4">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runBuild(input); }} placeholder="配列を空白区切りで入力" className="font-mono max-w-xs" />
          <Button onClick={() => runBuild(input)} variant="outline">構築</Button>
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Input value={addPos} onChange={(e) => setAddPos(e.target.value)} placeholder="位置" className="font-mono w-16" />
          <Input value={addVal} onChange={(e) => setAddVal(e.target.value)} placeholder="加算値" className="font-mono w-20" />
          <Button onClick={runAdd} variant="outline">加算</Button>
          <Input value={sumPos} onChange={(e) => setSumPos(e.target.value)} placeholder="位置" className="font-mono w-16" />
          <Button onClick={runSum} variant="outline">累積和 [0, pos]</Button>
        </div>

        {/* Array */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">元の配列 (0-indexed)</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.arr.map((v, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 flex items-center justify-center border-2 text-sm font-mono ${step.highlightIndices.includes(idx) && step.type === "add_visit" ? "bg-blue-100 border-blue-400" : "bg-white border-gray-200"}`}>{v}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
              </div>
            ))}
          </div>
        </div>

        {/* BIT array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">BIT 配列 (1-indexed)</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.bit.slice(1).map((v, idx) => {
              const bitIdx = idx + 1;
              const isHighlighted = step.highlightIndices.includes(bitIdx);
              let color = "bg-white border-gray-200";
              if (isHighlighted) {
                if (step.type === "add_update") color = "bg-blue-100 border-blue-400";
                else if (step.type === "sum_add") color = "bg-emerald-100 border-emerald-500";
                else color = "bg-blue-100 border-blue-400";
              }
              // Show responsibility range
              const lowbit = bitIdx & (-bitIdx);
              const rangeStart = bitIdx - lowbit + 1;
              return (
                <div key={bitIdx} className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors ${color}`}>{v}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{bitIdx}</div>
                  <div className="text-[9px] text-muted-foreground font-mono">[{rangeStart},{bitIdx}]</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>更新中</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>累積和に加算</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((p) => !p)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
      </div>
    </div>
  );
}
