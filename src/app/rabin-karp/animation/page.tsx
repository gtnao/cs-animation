"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "compute_pattern" | "compute_window" | "compare_hash" | "verify" | "match" | "mismatch" | "done";

interface Step {
  type: StepType;
  windowStart: number;
  windowEnd: number;
  patternHash: number;
  windowHash: number;
  found: number[];
  description: string;
}

// --- Algorithm ---

const BASE = 256;
const MOD = 101;

function generateSteps(text: string, pattern: string): Step[] {
  const n = text.length;
  const m = pattern.length;
  if (n === 0 || m === 0 || m > n) return [];
  const steps: Step[] = [];
  const found: number[] = [];

  steps.push({
    type: "init",
    windowStart: 0,
    windowEnd: m - 1,
    patternHash: 0,
    windowHash: 0,
    found: [],
    description: `Rabin-Karp: テキスト "${text.slice(0, 20)}${text.length > 20 ? "..." : ""}" からパターン "${pattern}" を検索`,
  });

  // Compute pattern hash and initial window hash
  let patternHash = 0;
  let windowHash = 0;
  let h = 1; // BASE^(m-1) mod MOD

  for (let i = 0; i < m - 1; i++) {
    h = (h * BASE) % MOD;
  }

  for (let i = 0; i < m; i++) {
    patternHash = (patternHash * BASE + pattern.charCodeAt(i)) % MOD;
    windowHash = (windowHash * BASE + text.charCodeAt(i)) % MOD;
  }

  steps.push({
    type: "compute_pattern",
    windowStart: 0,
    windowEnd: m - 1,
    patternHash,
    windowHash,
    found: [],
    description: `パターンハッシュ H("${pattern}") = ${patternHash}、初期ウィンドウハッシュ H("${text.slice(0, m)}") = ${windowHash}`,
  });

  // Slide window
  for (let i = 0; i <= n - m; i++) {
    if (i > 0) {
      // Recompute hash
      windowHash = (BASE * (windowHash - text.charCodeAt(i - 1) * h) + text.charCodeAt(i + m - 1)) % MOD;
      if (windowHash < 0) windowHash += MOD;

      steps.push({
        type: "compute_window",
        windowStart: i,
        windowEnd: i + m - 1,
        patternHash,
        windowHash,
        found: [...found],
        description: `ウィンドウスライド → H("${text.slice(i, i + m)}") = ${windowHash}`,
      });
    }

    if (patternHash === windowHash) {
      steps.push({
        type: "compare_hash",
        windowStart: i,
        windowEnd: i + m - 1,
        patternHash,
        windowHash,
        found: [...found],
        description: `ハッシュ一致! H = ${patternHash}。文字列を実際に比較して検証`,
      });

      // Verify character by character
      let match = true;
      for (let j = 0; j < m; j++) {
        if (text[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }

      if (match) {
        found.push(i);
        steps.push({
          type: "match",
          windowStart: i,
          windowEnd: i + m - 1,
          patternHash,
          windowHash,
          found: [...found],
          description: `位置 ${i} でパターンが一致!`,
        });
      } else {
        steps.push({
          type: "mismatch",
          windowStart: i,
          windowEnd: i + m - 1,
          patternHash,
          windowHash,
          found: [...found],
          description: `ハッシュ衝突 (spurious hit)。文字列は不一致`,
        });
      }
    }
  }

  steps.push({
    type: "done",
    windowStart: n - m,
    windowEnd: n - 1,
    patternHash,
    windowHash,
    found: [...found],
    description: `検索完了。${found.length} 箇所で一致: [${found.join(", ")}]`,
  });

  return steps;
}

// --- Component ---

export default function RabinKarpAnimationPage() {
  const [textInput, setTextInput] = useState("abracadabra");
  const [patternInput, setPatternInput] = useState("abra");
  const [text, setText] = useState("abracadabra");
  const [pattern, setPattern] = useState("abra");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((t: string, p: string) => {
    const tt = t.trim();
    const pp = p.trim();
    if (tt.length === 0 || pp.length === 0) return;
    setText(tt);
    setPattern(pp);
    setSteps(generateSteps(tt, pp));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(textInput, patternInput); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 500);
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

  const m = pattern.length;

  return (
    <>
<div className="flex gap-2 mb-8 flex-wrap">
          <Input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="テキスト" className="font-mono max-w-xs" />
          <Input value={patternInput} onChange={(e) => setPatternInput(e.target.value)} placeholder="パターン" className="font-mono max-w-xs" />
          <Button onClick={() => run(textInput, patternInput)} variant="outline">実行</Button>
        </div>

        {/* Text */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">テキスト</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {text.split("").map((c, idx) => {
              const base = "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              let cls = `${base} bg-white border-gray-200`;
              if (step.type === "done") {
                for (const pos of step.found) {
                  if (idx >= pos && idx < pos + m) cls = `${base} bg-emerald-100 border-emerald-500`;
                }
              } else if (idx >= step.windowStart && idx <= step.windowEnd) {
                if (step.type === "match") cls = `${base} bg-emerald-100 border-emerald-500`;
                else if (step.type === "mismatch") cls = `${base} bg-red-100 border-red-500`;
                else if (step.type === "compare_hash") cls = `${base} bg-blue-100 border-blue-400`;
                else cls = `${base} bg-amber-50 border-amber-400`;
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{c}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hash info */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <div className="p-3 bg-muted/30 border border-border rounded">
            <div className="text-xs text-muted-foreground">パターンハッシュ</div>
            <div className="font-mono font-bold">{step.patternHash}</div>
          </div>
          <div className="p-3 bg-muted/30 border border-border rounded">
            <div className="text-xs text-muted-foreground">ウィンドウハッシュ</div>
            <div className="font-mono font-bold">{step.windowHash}</div>
          </div>
          <div className="p-3 bg-muted/30 border border-border rounded">
            <div className="text-xs text-muted-foreground">一致?</div>
            <div className="font-mono font-bold">{step.patternHash === step.windowHash ? "Yes" : "No"}</div>
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>ウィンドウ</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>ハッシュ一致</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>パターン一致</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>偽陽性</span></div>
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
