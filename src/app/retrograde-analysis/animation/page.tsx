"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StateResult = "W" | "L" | "?" ;

type StepType = "init" | "mark_terminal" | "propagate_win" | "propagate_loss" | "check_undecided" | "done";

interface Step {
  type: StepType;
  maxN: number;
  moves: number[];
  states: StateResult[];
  currentState: number;
  queueStates: number[];
  description: string;
}

// --- Retrograde analysis on subtraction game ---
// Terminal state: 0 stones = Lose for the player to move

function generateSteps(maxN: number, moves: number[]): Step[] {
  const steps: Step[] = [];
  const states: StateResult[] = new Array(maxN + 1).fill("?");

  steps.push({
    type: "init",
    maxN,
    moves,
    states: [...states],
    currentState: -1,
    queueStates: [],
    description: `後退解析: Subtraction Game (取れる数: {${moves.join(",")}}, 0~${maxN})`,
  });

  // Mark terminal states
  states[0] = "L"; // Can't move = lose
  steps.push({
    type: "mark_terminal",
    maxN,
    moves,
    states: [...states],
    currentState: 0,
    queueStates: [],
    description: "終端状態: 0 は負け (手番のプレイヤーが動けない)",
  });

  // BFS-like retrograde
  const queue = [0];
  const outDegree = new Array(maxN + 1).fill(0);

  // Compute out-degrees
  for (let n = 1; n <= maxN; n++) {
    for (const m of moves) {
      if (n - m >= 0) outDegree[n]++;
    }
  }

  while (queue.length > 0) {
    const s = queue.shift()!;

    // Find predecessors (states that can move to s)
    for (const m of moves) {
      const pred = s + m;
      if (pred > maxN || states[pred] !== "?") continue;

      if (states[s] === "L") {
        // Predecessor can move to a losing state -> predecessor wins
        states[pred] = "W";
        queue.push(pred);

        steps.push({
          type: "propagate_win",
          maxN,
          moves,
          states: [...states],
          currentState: pred,
          queueStates: [...queue],
          description: `状態 ${pred} → ${s} (負け) に遷移可能 → 状態 ${pred} は勝ち`,
        });
      } else if (states[s] === "W") {
        // Predecessor sees one winning successor, reduce count
        outDegree[pred]--;

        steps.push({
          type: "check_undecided",
          maxN,
          moves,
          states: [...states],
          currentState: pred,
          queueStates: [...queue],
          description: `状態 ${pred} → ${s} (勝ち): 残り未確定遷移先 = ${outDegree[pred]}`,
        });

        if (outDegree[pred] === 0) {
          // All successors are winning -> this state loses
          states[pred] = "L";
          queue.push(pred);

          steps.push({
            type: "propagate_loss",
            maxN,
            moves,
            states: [...states],
            currentState: pred,
            queueStates: [...queue],
            description: `状態 ${pred} の全遷移先が勝ち → 状態 ${pred} は負け`,
          });
        }
      }
    }
  }

  steps.push({
    type: "done",
    maxN,
    moves,
    states: [...states],
    currentState: -1,
    queueStates: [],
    description: "後退解析完了",
  });

  return steps;
}

function parseInput(s: string): { maxN: number; moves: number[] } | null {
  const parts = s.split("|").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const maxN = parseInt(parts[0]);
  const moves = parts[1].split(",").map(Number).filter((n) => n > 0);
  if (isNaN(maxN) || maxN < 1 || moves.length === 0) return null;
  return { maxN: Math.min(maxN, 20), moves };
}

export default function RetrogradeAnalysisAnimationPage() {
  const [input, setInput] = useState("12|1,2,3");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const parsed = parseInput(s);
    if (!parsed) return;
    setSteps(generateSteps(parsed.maxN, parsed.moves));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(input); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 500);
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
    <>
<div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="最大N|取れる数(カンマ区切り)" className="font-mono max-w-md" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        {/* State visualization */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">ゲーム状態</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.states.map((state, idx) => {
              const isCurrent = idx === step.currentState;
              const isInQueue = step.queueStates.includes(idx);
              let cls = "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              if (isCurrent) {
                cls += " bg-blue-100 border-blue-400 font-bold";
              } else if (isInQueue) {
                cls += " bg-amber-50 border-amber-400";
              } else if (state === "W") {
                cls += " bg-emerald-100 border-emerald-500";
              } else if (state === "L") {
                cls += " bg-red-100 border-red-500";
              } else {
                cls += " bg-gray-50 border-gray-200 text-muted-foreground";
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{state}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transition arrows */}
        {step.currentState >= 0 && (
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-1">遷移可能</div>
            <div className="font-mono text-sm">
              {step.moves
                .filter((m) => step.currentState - m >= 0)
                .map((m) => `${step.currentState} → ${step.currentState - m}`)
                .join(", ")}
            </div>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>取れる数: {"{" + step.moves.join(", ") + "}"}</span>
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>処理中</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>キュー内</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>勝ち (W)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>負け (L)</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((p) => !p)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
    </>
  );
}
