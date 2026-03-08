"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface SAMState {
  len: number;
  link: number;
  transitions: Record<string, number>;
  isClone: boolean;
}

type StepType = "init" | "extend" | "done";

interface Step {
  type: StepType;
  states: SAMState[];
  lastState: number;
  charAdded?: string;
  newStateId?: number;
  description: string;
}

// --- Algorithm ---

function generateSteps(s: string): Step[] {
  const steps: Step[] = [];
  if (s.length === 0) return [];

  const states: SAMState[] = [
    { len: 0, link: -1, transitions: {}, isClone: false },
  ];
  let last = 0;

  steps.push({
    type: "init",
    states: JSON.parse(JSON.stringify(states)),
    lastState: 0,
    description: `Suffix Automaton を初期化。初期状態 (空文字列) を作成`,
  });

  for (let ci = 0; ci < s.length; ci++) {
    const c = s[ci];
    const cur = states.length;
    states.push({
      len: states[last].len + 1,
      link: -1,
      transitions: {},
      isClone: false,
    });

    let p = last;
    while (p !== -1 && !(c in states[p].transitions)) {
      states[p].transitions[c] = cur;
      p = states[p].link;
    }

    if (p === -1) {
      states[cur].link = 0;
    } else {
      const q = states[p].transitions[c];
      if (states[p].len + 1 === states[q].len) {
        states[cur].link = q;
      } else {
        const clone = states.length;
        states.push({
          len: states[p].len + 1,
          link: states[q].link,
          transitions: { ...states[q].transitions },
          isClone: true,
        });
        while (p !== -1 && states[p].transitions[c] === q) {
          states[p].transitions[c] = clone;
          p = states[p].link;
        }
        states[q].link = clone;
        states[cur].link = clone;
      }
    }

    last = cur;

    steps.push({
      type: "extend",
      states: JSON.parse(JSON.stringify(states)),
      lastState: last,
      charAdded: c,
      newStateId: cur,
      description: `文字 '${c}' を追加 → 状態 ${cur} を作成 (len=${states[cur].len}, link=${states[cur].link})`,
    });
  }

  steps.push({
    type: "done",
    states: JSON.parse(JSON.stringify(states)),
    lastState: last,
    description: `Suffix Automaton 構築完了。${states.length} 個の状態`,
  });

  return steps;
}

// --- Component ---

export default function SuffixAutomatonAnimationPage() {
  const [input, setInput] = useState("abcbc");
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

  useEffect(() => { run(input); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

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
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="文字列を入力" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        {/* States table */}
        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">状態一覧</div>
          <table className="text-sm font-mono border-collapse w-full">
            <thead>
              <tr className="text-muted-foreground">
                <th className="px-2 py-1 text-left">ID</th>
                <th className="px-2 py-1 text-left">len</th>
                <th className="px-2 py-1 text-left">link</th>
                <th className="px-2 py-1 text-left">遷移</th>
                <th className="px-2 py-1 text-left">Clone</th>
              </tr>
            </thead>
            <tbody>
              {step.states.map((st, id) => {
                const isNew = step.newStateId === id;
                const isLast = step.lastState === id;
                let rowCls = "";
                if (isNew) rowCls = "bg-emerald-50";
                else if (isLast) rowCls = "bg-blue-50";
                return (
                  <tr key={id} className={rowCls}>
                    <td className="px-2 py-1 border-t border-gray-200">{id}</td>
                    <td className="px-2 py-1 border-t border-gray-200">{st.len}</td>
                    <td className="px-2 py-1 border-t border-gray-200">{st.link}</td>
                    <td className="px-2 py-1 border-t border-gray-200">
                      {Object.entries(st.transitions).map(([c, to]) => `${c}→${to}`).join(", ") || "–"}
                    </td>
                    <td className="px-2 py-1 border-t border-gray-200">{st.isClone ? "Yes" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>最終状態</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>新規状態</span></div>
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
