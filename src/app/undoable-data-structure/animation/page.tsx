"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "push" | "pop" | "undo" | "top" | "done";

interface Step {
  type: StepType;
  stack: number[];
  undoStack: { op: string; value?: number }[];
  currentOp: string;
  result: string;
  description: string;
}

interface Operation {
  type: "push" | "pop" | "undo" | "top";
  value?: number;
}

function generateSteps(ops: Operation[]): Step[] {
  const steps: Step[] = [];
  const stack: number[] = [];
  const undoStack: { op: string; value?: number }[] = [];

  steps.push({
    type: "init",
    stack: [],
    undoStack: [],
    currentOp: "",
    result: "",
    description: "Undo可能スタックを初期化",
  });

  for (const op of ops) {
    if (op.type === "push" && op.value !== undefined) {
      stack.push(op.value);
      undoStack.push({ op: "push", value: op.value });
      steps.push({
        type: "push",
        stack: [...stack],
        undoStack: undoStack.map((u) => ({ ...u })),
        currentOp: `push(${op.value})`,
        result: "",
        description: `push(${op.value}): スタックに追加。undo履歴に記録`,
      });
    } else if (op.type === "pop") {
      if (stack.length === 0) {
        steps.push({
          type: "pop",
          stack: [...stack],
          undoStack: undoStack.map((u) => ({ ...u })),
          currentOp: "pop()",
          result: "スタックが空",
          description: "pop(): スタックが空のため失敗",
        });
      } else {
        const val = stack.pop()!;
        undoStack.push({ op: "pop", value: val });
        steps.push({
          type: "pop",
          stack: [...stack],
          undoStack: undoStack.map((u) => ({ ...u })),
          currentOp: `pop() → ${val}`,
          result: String(val),
          description: `pop(): ${val} を取り出し。undo履歴に記録`,
        });
      }
    } else if (op.type === "undo") {
      if (undoStack.length === 0) {
        steps.push({
          type: "undo",
          stack: [...stack],
          undoStack: undoStack.map((u) => ({ ...u })),
          currentOp: "undo()",
          result: "履歴が空",
          description: "undo(): 履歴が空のため失敗",
        });
      } else {
        const lastOp = undoStack.pop()!;
        if (lastOp.op === "push") {
          stack.pop();
          steps.push({
            type: "undo",
            stack: [...stack],
            undoStack: undoStack.map((u) => ({ ...u })),
            currentOp: `undo(push ${lastOp.value})`,
            result: "",
            description: `undo(): push(${lastOp.value}) を取り消し → pop`,
          });
        } else if (lastOp.op === "pop") {
          stack.push(lastOp.value!);
          steps.push({
            type: "undo",
            stack: [...stack],
            undoStack: undoStack.map((u) => ({ ...u })),
            currentOp: `undo(pop ${lastOp.value})`,
            result: "",
            description: `undo(): pop(${lastOp.value}) を取り消し → push(${lastOp.value})`,
          });
        }
      }
    } else if (op.type === "top") {
      const val = stack.length > 0 ? stack[stack.length - 1] : null;
      steps.push({
        type: "top",
        stack: [...stack],
        undoStack: undoStack.map((u) => ({ ...u })),
        currentOp: "top()",
        result: val !== null ? String(val) : "空",
        description: `top(): ${val !== null ? `先頭要素 = ${val}` : "スタックが空"}`,
      });
    }
  }

  steps.push({
    type: "done",
    stack: [...stack],
    undoStack: undoStack.map((u) => ({ ...u })),
    currentOp: "",
    result: "",
    description: `全操作完了。スタック: [${stack.join(", ")}]`,
  });

  return steps;
}

export default function UndoableDataStructureAnimationPage() {
  const [inputOps, setInputOps] = useState("push3,push5,push1,pop,undo,top,push7,undo,undo");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((opsStr: string) => {
    const ops = opsStr.trim().split(/[\s,]+/).map((s) => {
      if (s.startsWith("push")) return { type: "push" as const, value: parseInt(s.slice(4)) };
      if (s === "pop") return { type: "pop" as const };
      if (s === "undo") return { type: "undo" as const };
      if (s === "top") return { type: "top" as const };
      return null;
    }).filter((x) => x !== null) as Operation[];
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Undo可能データ構造</h1>
        <p className="text-sm text-muted-foreground mb-6">操作の取り消しをサポートするスタックの動作を可視化</p>

        <div className="flex gap-2 mb-8">
          <Input value={inputOps} onChange={(e) => setInputOps(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputOps); }} placeholder="push3,pop,undo,top,..." className="font-mono max-w-md" />
          <Button onClick={() => run(inputOps)} variant="outline">実行</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">スタック (上が先頭)</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.stack.length > 0 ? [...step.stack].reverse().map((val, idx) => (
              <div key={idx} className={`w-12 h-10 flex items-center justify-center border-2 text-sm font-mono ${idx === 0 ? "bg-blue-100 border-blue-400" : "bg-white border-gray-200"}`}>
                {val}
              </div>
            )) : <div className="text-sm text-muted-foreground">（空）</div>}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">Undo履歴</div>
          <div className="flex gap-1 overflow-x-auto pb-1 flex-wrap">
            {step.undoStack.length > 0 ? step.undoStack.map((u, idx) => (
              <div key={idx} className="px-2 py-1 border-2 bg-amber-50 border-amber-400 text-xs font-mono rounded">
                {u.op}{u.value !== undefined ? `(${u.value})` : ""}
              </div>
            )) : <div className="text-sm text-muted-foreground">（空）</div>}
          </div>
        </div>

        {step.currentOp && (
          <div className="mb-3 text-sm font-mono font-semibold text-foreground">{step.currentOp}</div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>先頭要素</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>Undo履歴</span></div>
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
