"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "build_sa" | "compute_lcp" | "compare" | "done";

interface Step {
  type: StepType;
  sa: number[];
  rank: number[];
  lcp: number[];
  currentI: number;
  h: number;
  compareIndices?: [number, number];
  matchType?: "match" | "mismatch";
  description: string;
}

// --- Algorithm ---

function buildSA(s: string): number[] {
  const n = s.length;
  const suffixes = Array.from({ length: n }, (_, i) => i);
  suffixes.sort((a, b) => {
    const sa = s.slice(a);
    const sb = s.slice(b);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  });
  return suffixes;
}

function generateSteps(s: string): Step[] {
  const n = s.length;
  if (n === 0) return [];
  const steps: Step[] = [];

  const sa = buildSA(s);
  const rank = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    rank[sa[i]] = i;
  }
  const lcp = new Array(n).fill(0);

  steps.push({
    type: "init",
    sa: [...sa],
    rank: [...rank],
    lcp: [...lcp],
    currentI: -1,
    h: 0,
    description: `Suffix Array を構築済み。Kasai のアルゴリズムで LCP 配列を計算する`,
  });

  steps.push({
    type: "build_sa",
    sa: [...sa],
    rank: [...rank],
    lcp: [...lcp],
    currentI: -1,
    h: 0,
    description: `SA = [${sa.join(", ")}]。テキスト位置順 (i=0,1,...) に LCP を計算`,
  });

  let h = 0;
  for (let i = 0; i < n; i++) {
    if (rank[i] > 0) {
      const j = sa[rank[i] - 1];
      while (i + h < n && j + h < n && s[i + h] === s[j + h]) {
        steps.push({
          type: "compare",
          sa: [...sa],
          rank: [...rank],
          lcp: [...lcp],
          currentI: i,
          h: h + 1,
          compareIndices: [i + h, j + h],
          matchType: "match",
          description: `S[${i + h}]='${s[i + h]}' と S[${j + h}]='${s[j + h]}' を比較 → 一致 (h=${h + 1})`,
        });
        h++;
      }

      if (i + h < n && j + h < n) {
        steps.push({
          type: "compare",
          sa: [...sa],
          rank: [...rank],
          lcp: [...lcp],
          currentI: i,
          h,
          compareIndices: [i + h, j + h],
          matchType: "mismatch",
          description: `S[${i + h}]='${s[i + h]}' と S[${j + h}]='${s[j + h]}' を比較 → 不一致`,
        });
      }

      lcp[rank[i]] = h;
      steps.push({
        type: "compute_lcp",
        sa: [...sa],
        rank: [...rank],
        lcp: [...lcp],
        currentI: i,
        h,
        description: `LCP[${rank[i]}] = ${h} (位置 ${i} と位置 ${j} の最長共通接頭辞)`,
      });

      if (h > 0) h--;
    }
  }

  steps.push({
    type: "done",
    sa: [...sa],
    rank: [...rank],
    lcp: [...lcp],
    currentI: n,
    h: 0,
    description: `LCP Array 構築完了: [${lcp.join(", ")}]`,
  });

  return steps;
}

// --- Component ---

export default function LCPArrayAnimationPage() {
  const [input, setInput] = useState("banana$");
  const [text, setText] = useState("banana$");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const trimmed = s.trim();
    if (trimmed.length === 0) return;
    setText(trimmed);
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
    }, 500);
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

  const n = text.length;

  const getCellClass = (idx: number): string => {
    const base =
      "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
    if (step.compareIndices) {
      const [a, b] = step.compareIndices;
      if (idx === a || idx === b) {
        return step.matchType === "match"
          ? `${base} bg-emerald-100 border-emerald-500`
          : `${base} bg-red-100 border-red-500`;
      }
    }
    if (idx === step.currentI) {
      return `${base} bg-blue-100 border-blue-400`;
    }
    return `${base} bg-white border-gray-200`;
  };

  return (
    <>
{/* Input */}
        <div className="flex gap-2 mb-8">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="文字列を入力"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* String */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            文字列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {text.split("").map((c, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx)}>{c}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SA and LCP */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Suffix Array / LCP Array
          </div>
          <div className="overflow-x-auto">
            <table className="text-sm font-mono border-collapse">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left text-muted-foreground">Rank</th>
                  <th className="px-2 py-1 text-left text-muted-foreground">SA</th>
                  <th className="px-2 py-1 text-left text-muted-foreground">LCP</th>
                  <th className="px-2 py-1 text-left text-muted-foreground">Suffix</th>
                </tr>
              </thead>
              <tbody>
                {step.sa.map((saVal, rank) => {
                  const isActive = saVal === step.currentI;
                  const rowCls = isActive ? "bg-blue-50" : "";
                  return (
                    <tr key={rank} className={rowCls}>
                      <td className="px-2 py-1 border-t border-gray-200">{rank}</td>
                      <td className="px-2 py-1 border-t border-gray-200">{saVal}</td>
                      <td className="px-2 py-1 border-t border-gray-200">
                        {step.lcp[rank] > 0 || (step.type === "done") ? step.lcp[rank] : "–"}
                      </td>
                      <td className="px-2 py-1 border-t border-gray-200">
                        {text.slice(saVal, Math.min(saVal + 15, n))}
                        {saVal + 15 < n ? "..." : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.currentI >= 0 && step.type !== "done" && (
            <>
              <span>
                i = <span className="font-mono font-semibold text-foreground">{step.currentI}</span>
              </span>
              <span>
                h = <span className="font-mono font-semibold text-foreground">{step.h}</span>
              </span>
            </>
          )}
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Description */}
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>現在位置 i</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>一致</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>不一致</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>
            ← 前へ
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>
            次へ →
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>
            {isPlaying ? "停止" : "再生"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>
            リセット
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
    </>
  );
}
