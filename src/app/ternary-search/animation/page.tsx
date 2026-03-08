"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

type StepType = "init" | "evaluate" | "narrow_left" | "narrow_right" | "done";

interface Step {
  type: StepType;
  lo: number;
  hi: number;
  m1: number;
  m2: number;
  fm1: number;
  fm2: number;
  iteration: number;
  description: string;
}

// --- Target function: -(x-3)^2 + 10 (maximum at x=3) ---

function targetFunc(x: number): number {
  return -(x - 3) * (x - 3) + 10;
}

const FUNC_LABEL = "f(x) = -(x-3)^2 + 10";

// --- Algorithm step generation ---

function generateSteps(lo: number, hi: number, maxIter: number): Step[] {
  const steps: Step[] = [];
  let l = lo;
  let r = hi;

  steps.push({
    type: "init",
    lo: l,
    hi: r,
    m1: 0,
    m2: 0,
    fm1: 0,
    fm2: 0,
    iteration: 0,
    description: `区間 [${l.toFixed(2)}, ${r.toFixed(2)}] で ${FUNC_LABEL} の最大値を探索`,
  });

  for (let iter = 1; iter <= maxIter; iter++) {
    const m1 = l + (r - l) / 3;
    const m2 = r - (r - l) / 3;
    const fm1 = targetFunc(m1);
    const fm2 = targetFunc(m2);

    steps.push({
      type: "evaluate",
      lo: l,
      hi: r,
      m1,
      m2,
      fm1,
      fm2,
      iteration: iter,
      description: `m1=${m1.toFixed(3)}, m2=${m2.toFixed(3)}, f(m1)=${fm1.toFixed(3)}, f(m2)=${fm2.toFixed(3)}`,
    });

    if (fm1 < fm2) {
      steps.push({
        type: "narrow_left",
        lo: m1,
        hi: r,
        m1,
        m2,
        fm1,
        fm2,
        iteration: iter,
        description: `f(m1) < f(m2) → 最大値は右側。lo = m1 = ${m1.toFixed(3)}`,
      });
      l = m1;
    } else {
      steps.push({
        type: "narrow_right",
        lo: l,
        hi: m2,
        m1,
        m2,
        fm1,
        fm2,
        iteration: iter,
        description: `f(m1) >= f(m2) → 最大値は左側。hi = m2 = ${m2.toFixed(3)}`,
      });
      r = m2;
    }
  }

  const best = (l + r) / 2;
  steps.push({
    type: "done",
    lo: l,
    hi: r,
    m1: best,
    m2: best,
    fm1: targetFunc(best),
    fm2: targetFunc(best),
    iteration: maxIter,
    description: `探索完了: x ≈ ${best.toFixed(4)}, f(x) ≈ ${targetFunc(best).toFixed(4)}`,
  });

  return steps;
}

// --- Graph component ---

function FunctionGraph({
  step,
  lo: graphLo,
  hi: graphHi,
}: {
  step: Step;
  lo: number;
  hi: number;
}) {
  const width = 600;
  const height = 300;
  const padding = 40;

  const xScale = (x: number) =>
    padding + ((x - graphLo) / (graphHi - graphLo)) * (width - 2 * padding);
  const yMin = targetFunc(graphLo);
  const yMax = targetFunc(3);
  const range = Math.max(yMax - yMin, 1);
  const yScale = (y: number) =>
    height - padding - ((y - yMin + 1) / (range + 2)) * (height - 2 * padding);

  // Generate curve points
  const points: string[] = [];
  const numPoints = 200;
  for (let i = 0; i <= numPoints; i++) {
    const x = graphLo + (i / numPoints) * (graphHi - graphLo);
    const y = targetFunc(x);
    points.push(`${xScale(x)},${yScale(y)}`);
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl border border-border rounded bg-white">
      {/* Axes */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d1d5db" strokeWidth={1} />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d1d5db" strokeWidth={1} />

      {/* Function curve */}
      <polyline fill="none" stroke="#6b7280" strokeWidth={2} points={points.join(" ")} />

      {/* Search range */}
      {step.type !== "done" && (
        <rect
          x={xScale(step.lo)}
          y={padding}
          width={xScale(step.hi) - xScale(step.lo)}
          height={height - 2 * padding}
          fill="rgba(251, 191, 36, 0.1)"
          stroke="#f59e0b"
          strokeWidth={1}
          strokeDasharray="4"
        />
      )}

      {/* m1 and m2 points */}
      {step.type === "evaluate" && (
        <>
          <circle cx={xScale(step.m1)} cy={yScale(step.fm1)} r={5} fill="#3b82f6" />
          <text x={xScale(step.m1)} y={yScale(step.fm1) - 10} textAnchor="middle" fontSize={11} fill="#3b82f6">
            m1
          </text>
          <circle cx={xScale(step.m2)} cy={yScale(step.fm2)} r={5} fill="#3b82f6" />
          <text x={xScale(step.m2)} y={yScale(step.fm2) - 10} textAnchor="middle" fontSize={11} fill="#3b82f6">
            m2
          </text>
        </>
      )}

      {(step.type === "narrow_left" || step.type === "narrow_right") && (
        <>
          <circle
            cx={xScale(step.m1)}
            cy={yScale(step.fm1)}
            r={5}
            fill={step.type === "narrow_left" ? "#ef4444" : "#22c55e"}
          />
          <text x={xScale(step.m1)} y={yScale(step.fm1) - 10} textAnchor="middle" fontSize={11}
            fill={step.type === "narrow_left" ? "#ef4444" : "#22c55e"}>
            m1
          </text>
          <circle
            cx={xScale(step.m2)}
            cy={yScale(step.fm2)}
            r={5}
            fill={step.type === "narrow_right" ? "#ef4444" : "#22c55e"}
          />
          <text x={xScale(step.m2)} y={yScale(step.fm2) - 10} textAnchor="middle" fontSize={11}
            fill={step.type === "narrow_right" ? "#ef4444" : "#22c55e"}>
            m2
          </text>
        </>
      )}

      {/* Result point */}
      {step.type === "done" && (
        <>
          <circle cx={xScale(step.m1)} cy={yScale(step.fm1)} r={6} fill="#22c55e" stroke="#16a34a" strokeWidth={2} />
          <text x={xScale(step.m1)} y={yScale(step.fm1) - 12} textAnchor="middle" fontSize={11} fill="#16a34a" fontWeight="bold">
            最大値
          </text>
        </>
      )}

      {/* Axis labels */}
      <text x={width / 2} y={height - 8} textAnchor="middle" fontSize={12} fill="#6b7280">x</text>
      <text x={12} y={height / 2} textAnchor="middle" fontSize={12} fill="#6b7280" transform={`rotate(-90, 12, ${height / 2})`}>f(x)</text>
    </svg>
  );
}

// --- Component ---

export default function TernarySearchAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lo = -2;
  const hi = 8;
  const maxIter = 15;

  const run = useCallback(() => {
    setSteps(generateSteps(lo, hi, maxIter));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-advance
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

  // Keyboard shortcuts
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
{/* Graph */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {FUNC_LABEL}
          </div>
          <FunctionGraph step={step} lo={lo} hi={hi} />
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.type !== "done" && (
            <>
              <span>
                区間 =[" "]
                <span className="font-mono font-semibold text-foreground">
                  [{step.lo.toFixed(3)}, {step.hi.toFixed(3)}]
                </span>
              </span>
              <span>
                反復 ={" "}
                <span className="font-mono font-semibold text-foreground">
                  {step.iteration}
                </span>
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" />
            <span>評価点 (m1, m2)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>探索区間</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>採用側</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500 rounded-full" />
            <span>棄却側</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep((prev) => Math.max(0, prev - 1));
              setIsPlaying(false);
            }}
            disabled={currentStep === 0}
          >
            ← 前へ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep((prev) =>
                Math.min(steps.length - 1, prev + 1)
              );
              setIsPlaying(false);
            }}
            disabled={currentStep === steps.length - 1}
          >
            次へ →
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying((prev) => !prev)}
            disabled={currentStep === steps.length - 1}
          >
            {isPlaying ? "停止" : "再生"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentStep(0);
              setIsPlaying(false);
            }}
          >
            リセット
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
    </>
  );
}
