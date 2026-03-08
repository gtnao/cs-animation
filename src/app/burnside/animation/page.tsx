"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "check_rotation" | "count_fixed" | "compute_average" | "done";

interface Step {
  type: StepType;
  nBeads: number;
  nColors: number;
  currentRotation: number;
  fixedPoints: number[];
  currentFixed: number;
  totalFixed: number;
  necklaces: number | null;
  coloring: number[];
  description: string;
}

// --- Algorithm step generation ---

function gcd(a: number, b: number): number {
  while (b > 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

function generateSteps(nBeads: number, nColors: number): Step[] {
  const steps: Step[] = [];

  steps.push({
    type: "init",
    nBeads,
    nColors,
    currentRotation: -1,
    fixedPoints: [],
    currentFixed: -1,
    totalFixed: 0,
    necklaces: null,
    coloring: [],
    description: `${nBeads} 個のビーズを ${nColors} 色で塗るネックレスの数をバーンサイドの補題で計算`,
  });

  const fixedPoints: number[] = [];
  let totalFixed = 0;

  for (let r = 0; r < nBeads; r++) {
    // Number of colorings fixed by rotation r = nColors^gcd(nBeads, r)
    // gcd(n, 0) = n
    const g = r === 0 ? nBeads : gcd(nBeads, r);
    const fixed = Math.pow(nColors, g);
    fixedPoints.push(fixed);
    totalFixed += fixed;

    // Generate a sample fixed coloring for visualization
    const coloring: number[] = [];
    const cycleLen = nBeads / g;
    for (let i = 0; i < nBeads; i++) {
      coloring.push(i % cycleLen < nColors ? i % cycleLen : 0);
    }

    steps.push({
      type: "count_fixed",
      nBeads,
      nColors,
      currentRotation: r,
      fixedPoints: [...fixedPoints],
      currentFixed: fixed,
      totalFixed,
      necklaces: null,
      coloring,
      description: `回転 ${r}: gcd(${nBeads}, ${r}) = ${g}, 不動点数 = ${nColors}^${g} = ${fixed}`,
    });
  }

  const necklaces = totalFixed / nBeads;

  steps.push({
    type: "compute_average",
    nBeads,
    nColors,
    currentRotation: -1,
    fixedPoints: [...fixedPoints],
    currentFixed: -1,
    totalFixed,
    necklaces,
    coloring: [],
    description: `軌道数 = (1/${nBeads}) * ${totalFixed} = ${necklaces}`,
  });

  steps.push({
    type: "done",
    nBeads,
    nColors,
    currentRotation: -1,
    fixedPoints: [...fixedPoints],
    currentFixed: -1,
    totalFixed,
    necklaces,
    coloring: [],
    description: `計算完了: 異なるネックレスの数 = ${necklaces}`,
  });

  return steps;
}

const COLORS = [
  "bg-blue-400",
  "bg-red-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-purple-400",
  "bg-pink-400",
];

// --- Component ---

export default function BurnsideAnimationPage() {
  const [inputBeads, setInputBeads] = useState("4");
  const [inputColors, setInputColors] = useState("2");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((beadsStr: string, colorsStr: string) => {
    const beads = parseInt(beadsStr, 10);
    const colors = parseInt(colorsStr, 10);
    if (isNaN(beads) || isNaN(colors) || beads < 1 || beads > 8 || colors < 1 || colors > 4) return;
    setSteps(generateSteps(beads, colors));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputBeads, inputColors);
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
    }, 700);
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

  return (
    <>
{/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-sm">ビーズ数:</span>
            <Input value={inputBeads} onChange={(e) => setInputBeads(e.target.value)} className="font-mono w-20" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">色数:</span>
            <Input value={inputColors} onChange={(e) => setInputColors(e.target.value)} className="font-mono w-20" />
          </div>
          <Button onClick={() => run(inputBeads, inputColors)} variant="outline">
            実行
          </Button>
        </div>

        {/* Necklace visualization */}
        {step.currentRotation >= 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              回転 {step.currentRotation} の不動点構造
            </div>
            <div className="flex gap-1 items-center">
              {Array.from({ length: step.nBeads }, (_, i) => {
                const g = step.currentRotation === 0 ? step.nBeads : gcd(step.nBeads, step.currentRotation);
                const cycleLen = step.nBeads / g;
                const cycleIdx = i % cycleLen;
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-10 h-10 rounded-full border-2 border-gray-300 ${COLORS[cycleIdx % COLORS.length]}`}
                    />
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {i}
                    </div>
                  </div>
                );
              })}
              <span className="ml-4 text-sm font-mono text-muted-foreground">
                サイクル数 = {step.currentRotation === 0 ? step.nBeads : gcd(step.nBeads, step.currentRotation)}
              </span>
            </div>
          </div>
        )}

        {/* Fixed points table */}
        {step.fixedPoints.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              各回転の不動点数
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {step.fixedPoints.map((val, idx) => {
                const base =
                  "w-14 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
                const cls =
                  idx === step.currentRotation
                    ? `${base} bg-blue-100 border-blue-400 font-bold`
                    : `${base} bg-white border-gray-200`;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className={cls}>{val}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      r={idx}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Result */}
        {step.necklaces !== null && (
          <div className="mb-6 p-4 border border-emerald-500 bg-emerald-50 rounded">
            <span className="text-sm font-mono font-bold">
              異なるネックレスの数 = {step.necklaces}
            </span>
          </div>
        )}

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        {/* Description */}
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>現在の回転</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>結果</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
    </>
  );
}
