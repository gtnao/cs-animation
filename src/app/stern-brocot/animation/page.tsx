"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "mediant" | "go_left" | "go_right" | "found" | "done";

interface Step {
  type: StepType;
  targetP: number;
  targetQ: number;
  lp: number;
  lq: number;
  rp: number;
  rq: number;
  mp: number;
  mq: number;
  path: string[];
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(p: number, q: number): Step[] {
  const steps: Step[] = [];

  // Reduce fraction
  function gcd(a: number, b: number): number {
    while (b) { [a, b] = [b, a % b]; }
    return a;
  }
  const g = gcd(p, q);
  p = p / g;
  q = q / g;

  let lp = 0, lq = 1; // left boundary 0/1
  let rp = 1, rq = 0; // right boundary 1/0 (infinity)
  const path: string[] = [];

  steps.push({
    type: "init",
    targetP: p, targetQ: q,
    lp, lq, rp, rq,
    mp: lp + rp, mq: lq + rq,
    path: [],
    description: `Stern-Brocot Tree で ${p}/${q} を探索。初期区間: [${lp}/${lq}, ${rp}/${rq}]`,
  });

  for (let iter = 0; iter < 50; iter++) {
    const mp = lp + rp;
    const mq = lq + rq;

    steps.push({
      type: "mediant",
      targetP: p, targetQ: q,
      lp, lq, rp, rq,
      mp, mq,
      path: [...path],
      description: `mediant = (${lp}+${rp})/(${lq}+${rq}) = ${mp}/${mq}`,
    });

    // Compare p/q with mp/mq using cross multiplication
    const cross1 = p * mq;
    const cross2 = mp * q;

    if (cross1 === cross2) {
      steps.push({
        type: "found",
        targetP: p, targetQ: q,
        lp, lq, rp, rq,
        mp, mq,
        path: [...path],
        description: `${p}/${q} = ${mp}/${mq}。見つかった!`,
      });
      break;
    } else if (cross1 < cross2) {
      // p/q < mp/mq, go left
      path.push("L");
      steps.push({
        type: "go_left",
        targetP: p, targetQ: q,
        lp, lq, rp: mp, rq: mq,
        mp, mq,
        path: [...path],
        description: `${p}/${q} < ${mp}/${mq} → 左へ (L)`,
      });
      rp = mp;
      rq = mq;
    } else {
      // p/q > mp/mq, go right
      path.push("R");
      steps.push({
        type: "go_right",
        targetP: p, targetQ: q,
        lp: mp, lq: mq, rp, rq,
        mp, mq,
        path: [...path],
        description: `${p}/${q} > ${mp}/${mq} → 右へ (R)`,
      });
      lp = mp;
      lq = mq;
    }
  }

  steps.push({
    type: "done",
    targetP: p, targetQ: q,
    lp, lq, rp, rq,
    mp: p, mq: q,
    path: [...path],
    description: `完了: ${p}/${q} のパス = ${path.join("")}`,
  });

  return steps;
}

// --- Component ---

export default function SternBrocotAnimationPage() {
  const [inputP, setInputP] = useState("5");
  const [inputQ, setInputQ] = useState("8");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((pStr: string, qStr: string) => {
    const p = parseInt(pStr, 10);
    const q = parseInt(qStr, 10);
    if (isNaN(p) || isNaN(q) || p < 1 || q < 1 || p > 100 || q > 100) return;
    setSteps(generateSteps(p, q));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputP, inputQ);
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
    }, 800);
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Stern-Brocot Tree</h1>
        <p className="text-sm text-muted-foreground mb-6">
          全ての正の有理数を既約分数として整列する二分木
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8 items-center">
          <Input value={inputP} onChange={(e) => setInputP(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputP, inputQ); }} placeholder="分子" className="font-mono max-w-[80px]" />
          <span className="text-muted-foreground">/</span>
          <Input value={inputQ} onChange={(e) => setInputQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputP, inputQ); }} placeholder="分母" className="font-mono max-w-[80px]" />
          <Button onClick={() => run(inputP, inputQ)} variant="outline">
            探索
          </Button>
        </div>

        {/* Current state */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            探索状態
          </div>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">左境界</div>
              <div className="px-3 py-2 border-2 bg-white border-gray-200 font-mono text-sm">
                {step.lp}/{step.lq}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">mediant</div>
              <div
                className={`px-4 py-2 border-2 font-mono text-lg font-bold ${
                  step.type === "found" || step.type === "done"
                    ? "bg-emerald-100 border-emerald-500"
                    : "bg-blue-100 border-blue-400"
                }`}
              >
                {step.mp}/{step.mq}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">右境界</div>
              <div className="px-3 py-2 border-2 bg-white border-gray-200 font-mono text-sm">
                {step.rp}/{step.rq === 0 ? "inf" : step.rq}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">目標</div>
              <div className="px-3 py-2 border-2 bg-amber-50 border-amber-400 font-mono text-sm font-bold">
                {step.targetP}/{step.targetQ}
              </div>
            </div>
          </div>
        </div>

        {/* Path */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            パス
          </div>
          <div className="flex gap-1">
            {step.path.length === 0 ? (
              <span className="text-xs text-muted-foreground">(root)</span>
            ) : (
              step.path.map((dir, idx) => (
                <div
                  key={idx}
                  className={`w-8 h-8 flex items-center justify-center border-2 text-sm font-mono font-bold rounded ${
                    dir === "L"
                      ? "bg-blue-100 border-blue-400"
                      : "bg-amber-50 border-amber-400"
                  }`}
                >
                  {dir}
                </div>
              ))
            )}
          </div>
        </div>

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
            <span>左 (L)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>右 (R) / 目標</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>一致</span>
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
      </div>
    </div>
  );
}
