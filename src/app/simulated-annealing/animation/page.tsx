"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

type StepType = "init" | "propose" | "accept" | "reject" | "done";

interface Step {
  type: StepType;
  x: number;
  fx: number;
  bestX: number;
  bestFx: number;
  proposedX: number;
  proposedFx: number;
  temperature: number;
  acceptProb: number;
  iteration: number;
  history: { x: number; fx: number }[];
  description: string;
}

// --- Target function: multi-modal function ---
// f(x) = sin(x) * x + cos(3x) - we want to MINIMIZE this

function targetFunc(x: number): number {
  return Math.sin(x) * x * 0.5 + Math.cos(3 * x) + 0.1 * (x - 2) * (x - 2);
}

const FUNC_LABEL = "f(x) = 0.5*x*sin(x) + cos(3x) + 0.1*(x-2)^2";

// --- Algorithm step generation ---

function generateSteps(
  x0: number,
  tempStart: number,
  tempEnd: number,
  maxIter: number
): Step[] {
  const steps: Step[] = [];
  // Seeded pseudo-random for reproducibility
  let seed = 42;
  function pseudoRandom(): number {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }

  let x = x0;
  let fx = targetFunc(x);
  let bestX = x;
  let bestFx = fx;
  const history: { x: number; fx: number }[] = [{ x, fx }];

  steps.push({
    type: "init",
    x,
    fx,
    bestX,
    bestFx,
    proposedX: x,
    proposedFx: fx,
    temperature: tempStart,
    acceptProb: 1,
    iteration: 0,
    history: [...history],
    description: `初期解: x=${x.toFixed(3)}, f(x)=${fx.toFixed(3)}, 初期温度=${tempStart}`,
  });

  const coolingRate = Math.pow(tempEnd / tempStart, 1 / maxIter);

  let temp = tempStart;
  for (let iter = 1; iter <= maxIter; iter++) {
    // Propose neighbor
    const dx = (pseudoRandom() - 0.5) * 3;
    const newX = Math.max(-5, Math.min(10, x + dx));
    const newFx = targetFunc(newX);
    const delta = newFx - fx;

    const acceptProb = delta < 0 ? 1 : Math.exp(-delta / temp);

    steps.push({
      type: "propose",
      x,
      fx,
      bestX,
      bestFx,
      proposedX: newX,
      proposedFx: newFx,
      temperature: temp,
      acceptProb,
      iteration: iter,
      history: [...history],
      description: `提案: x'=${newX.toFixed(3)}, f(x')=${newFx.toFixed(3)}, Δ=${delta.toFixed(3)}, 受理確率=${acceptProb.toFixed(3)}`,
    });

    const r = pseudoRandom();
    if (r < acceptProb) {
      x = newX;
      fx = newFx;
      history.push({ x, fx });

      if (fx < bestFx) {
        bestX = x;
        bestFx = fx;
      }

      steps.push({
        type: "accept",
        x,
        fx,
        bestX,
        bestFx,
        proposedX: newX,
        proposedFx: newFx,
        temperature: temp,
        acceptProb,
        iteration: iter,
        history: [...history],
        description: delta < 0
          ? `受理 (改善): f(x')=${newFx.toFixed(3)} < f(x)=${(newFx - delta).toFixed(3)}`
          : `受理 (悪化を許容): 確率 ${acceptProb.toFixed(3)} > ${r.toFixed(3)}`,
      });
    } else {
      steps.push({
        type: "reject",
        x,
        fx,
        bestX,
        bestFx,
        proposedX: newX,
        proposedFx: newFx,
        temperature: temp,
        acceptProb,
        iteration: iter,
        history: [...history],
        description: `棄却: 確率 ${acceptProb.toFixed(3)} < ${r.toFixed(3)}, T=${temp.toFixed(3)}`,
      });
    }

    temp *= coolingRate;
  }

  steps.push({
    type: "done",
    x: bestX,
    fx: bestFx,
    bestX,
    bestFx,
    proposedX: bestX,
    proposedFx: bestFx,
    temperature: temp,
    acceptProb: 0,
    iteration: maxIter,
    history: [...history],
    description: `探索完了: 最良解 x=${bestX.toFixed(4)}, f(x)=${bestFx.toFixed(4)}`,
  });

  return steps;
}

// --- Graph component ---

function FunctionGraph({
  step,
  lo,
  hi,
}: {
  step: Step;
  lo: number;
  hi: number;
}) {
  const width = 600;
  const height = 300;
  const padding = 40;

  // Compute y range
  let yMin = Infinity;
  let yMax = -Infinity;
  const numSamples = 200;
  for (let i = 0; i <= numSamples; i++) {
    const x = lo + (i / numSamples) * (hi - lo);
    const y = targetFunc(x);
    yMin = Math.min(yMin, y);
    yMax = Math.max(yMax, y);
  }
  const yPad = (yMax - yMin) * 0.1;
  yMin -= yPad;
  yMax += yPad;

  const xScale = (x: number) =>
    padding + ((x - lo) / (hi - lo)) * (width - 2 * padding);
  const yScale = (y: number) =>
    height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);

  // Generate curve points
  const points: string[] = [];
  for (let i = 0; i <= numSamples; i++) {
    const x = lo + (i / numSamples) * (hi - lo);
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

      {/* History trail */}
      {step.history.length > 1 &&
        step.history.slice(0, -1).map((h, i) => (
          <line
            key={`trail-${i}`}
            x1={xScale(h.x)}
            y1={yScale(h.fx)}
            x2={xScale(step.history[i + 1].x)}
            y2={yScale(step.history[i + 1].fx)}
            stroke="#93c5fd"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}

      {/* Proposed point */}
      {(step.type === "propose" || step.type === "reject") && (
        <circle
          cx={xScale(step.proposedX)}
          cy={yScale(step.proposedFx)}
          r={5}
          fill={step.type === "reject" ? "#ef4444" : "#f59e0b"}
          opacity={0.8}
        />
      )}

      {/* Current point */}
      <circle
        cx={xScale(step.x)}
        cy={yScale(step.fx)}
        r={6}
        fill="#3b82f6"
        stroke="#1d4ed8"
        strokeWidth={2}
      />

      {/* Best point */}
      <circle
        cx={xScale(step.bestX)}
        cy={yScale(step.bestFx)}
        r={6}
        fill="#22c55e"
        stroke="#16a34a"
        strokeWidth={2}
      />

      {/* Labels */}
      <text x={width / 2} y={height - 8} textAnchor="middle" fontSize={12} fill="#6b7280">x</text>
      <text x={12} y={height / 2} textAnchor="middle" fontSize={12} fill="#6b7280" transform={`rotate(-90, 12, ${height / 2})`}>f(x)</text>
    </svg>
  );
}

// --- Component ---

export default function SimulatedAnnealingAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    setSteps(generateSteps(7, 10, 0.01, 30));
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
    }, 500);
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">焼きなまし法</h1>
        <p className="text-sm text-muted-foreground mb-6">
          温度パラメータで探索の幅を制御し、大域的最適解に近づくメタヒューリスティクス
        </p>

        {/* Graph */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            目的関数 (最小化)
          </div>
          <FunctionGraph step={step} lo={-5} hi={10} />
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3 flex-wrap">
          <span>
            温度 ={" "}
            <span className="font-mono font-semibold text-foreground">
              {step.temperature.toFixed(3)}
            </span>
          </span>
          <span>
            現在 ={" "}
            <span className="font-mono font-semibold text-foreground">
              f({step.x.toFixed(2)}) = {step.fx.toFixed(3)}
            </span>
          </span>
          <span>
            最良 ={" "}
            <span className="font-mono font-semibold text-foreground">
              f({step.bestX.toFixed(2)}) = {step.bestFx.toFixed(3)}
            </span>
          </span>
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
            <div className="w-3.5 h-3.5 bg-blue-500 border-2 border-blue-700 rounded-full" />
            <span>現在の解</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-500 border-2 border-emerald-700 rounded-full" />
            <span>最良解</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-400 border-2 border-amber-600 rounded-full" />
            <span>提案</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-500 border-2 border-red-700 rounded-full" />
            <span>棄却</span>
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
              run();
            }}
          >
            リセット
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          ← → キーでステップ移動、スペースキーで再生/停止
        </p>
      </div>
    </div>
  );
}
