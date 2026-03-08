"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "rotations" | "sort" | "extract" | "done";

interface Step {
  type: StepType;
  rotations: string[];
  sorted: boolean;
  bwt: string;
  originalIndex: number;
  highlightCol: number;
  description: string;
}

// --- Algorithm ---

function generateSteps(s: string): Step[] {
  const steps: Step[] = [];
  const n = s.length;
  if (n === 0) return [];

  steps.push({
    type: "init",
    rotations: [],
    sorted: false,
    bwt: "",
    originalIndex: -1,
    highlightCol: -1,
    description: `BWT: 文字列 "${s}" を変換`,
  });

  // Generate all rotations
  const rotations: string[] = [];
  for (let i = 0; i < n; i++) {
    rotations.push(s.slice(i) + s.slice(0, i));
  }

  steps.push({
    type: "rotations",
    rotations: [...rotations],
    sorted: false,
    bwt: "",
    originalIndex: -1,
    highlightCol: -1,
    description: `${n} 個の巡回シフトを生成`,
  });

  // Sort rotations
  const sortedRotations = [...rotations].sort();
  const originalIndex = sortedRotations.indexOf(s);

  steps.push({
    type: "sort",
    rotations: sortedRotations,
    sorted: true,
    bwt: "",
    originalIndex,
    highlightCol: -1,
    description: `巡回シフトを辞書順にソート。元の文字列は ${originalIndex} 行目`,
  });

  // Extract last column
  const bwt = sortedRotations.map((r) => r[n - 1]).join("");

  steps.push({
    type: "extract",
    rotations: sortedRotations,
    sorted: true,
    bwt,
    originalIndex,
    highlightCol: n - 1,
    description: `最後の列を抽出 → BWT = "${bwt}"`,
  });

  steps.push({
    type: "done",
    rotations: sortedRotations,
    sorted: true,
    bwt,
    originalIndex,
    highlightCol: n - 1,
    description: `BWT完了。出力: "${bwt}" (元の位置: ${originalIndex})`,
  });

  return steps;
}

// --- Component ---

export default function BWTAnimationPage() {
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

  useEffect(() => { run(input); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 800);
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

  const n = text.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Burrows-Wheeler Transform</h1>
        <p className="text-sm text-muted-foreground mb-6">データ圧縮の前処理に用いられる可逆変換</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="文字列を入力 (末尾に$推奨)" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        {/* Rotation matrix */}
        {step.rotations.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              {step.sorted ? "ソート済み巡回シフト行列" : "巡回シフト一覧"}
            </div>
            <div className="space-y-1">
              {step.rotations.map((rot, rowIdx) => (
                <div key={rowIdx} className="flex gap-0.5 items-center">
                  <div className="w-6 text-right text-[10px] text-muted-foreground font-mono mr-1">
                    {rowIdx}
                  </div>
                  {rot.split("").map((c, colIdx) => {
                    const base = "w-8 h-8 flex items-center justify-center border text-xs font-mono transition-colors";
                    let cls = `${base} bg-white border-gray-200`;
                    if (step.highlightCol >= 0 && colIdx === step.highlightCol) {
                      cls = `${base} bg-amber-50 border-amber-400`;
                    }
                    if (rowIdx === step.originalIndex) {
                      cls = `${base} bg-blue-100 border-blue-400`;
                      if (step.highlightCol >= 0 && colIdx === step.highlightCol) {
                        cls = `${base} bg-emerald-100 border-emerald-500`;
                      }
                    }
                    return <div key={colIdx} className={cls}>{c}</div>;
                  })}
                  {step.highlightCol >= 0 && (
                    <span className="ml-2 text-sm font-mono font-bold text-amber-600">
                      {rot[n - 1]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BWT result */}
        {step.bwt && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">BWT 出力</div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {step.bwt.split("").map((c, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 flex items-center justify-center border-2 text-sm font-mono bg-emerald-100 border-emerald-500">{c}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
                </div>
              ))}
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
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>元の文字列</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>最終列</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>BWT出力</span></div>
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
