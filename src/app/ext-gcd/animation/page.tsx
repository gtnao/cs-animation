"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType = "init" | "recurse" | "backtrack" | "done";

interface Step {
  type: StepType;
  a: number;
  b: number;
  x: number;
  y: number;
  q?: number;
  r?: number;
  table: { a: number; b: number; q: number; r: number; x: number; y: number }[];
  depth: number;
  description: string;
}

// --- Algorithm step generation ---

function generateSteps(a: number, b: number): Step[] {
  const steps: Step[] = [];
  // Forward pass: compute quotients and remainders
  const forward: { a: number; b: number; q: number; r: number }[] = [];

  let ca = a;
  let cb = b;

  steps.push({
    type: "init",
    a: ca,
    b: cb,
    x: 0,
    y: 0,
    table: [],
    depth: 0,
    description: `${ca}x + ${cb}y = gcd(${ca}, ${cb}) を満たす x, y を求めます`,
  });

  while (cb !== 0) {
    const q = Math.floor(ca / cb);
    const r = ca % cb;
    forward.push({ a: ca, b: cb, q, r });

    steps.push({
      type: "recurse",
      a: ca,
      b: cb,
      x: 0,
      y: 0,
      q,
      r,
      table: forward.map((f) => ({ ...f, x: 0, y: 0 })),
      depth: forward.length,
      description: `${ca} = ${cb} × ${q} + ${r}`,
    });

    ca = cb;
    cb = r;
  }

  // Backward pass: compute x and y
  const gcd = ca;
  let x = 1;
  let y = 0;
  const backTable: { a: number; b: number; q: number; r: number; x: number; y: number }[] = [];

  steps.push({
    type: "backtrack",
    a: ca,
    b: 0,
    x: 1,
    y: 0,
    table: forward.map((f) => ({ ...f, x: 0, y: 0 })),
    depth: forward.length,
    description: `基底ケース: gcd = ${gcd}, x = 1, y = 0`,
  });

  for (let i = forward.length - 1; i >= 0; i--) {
    const { q } = forward[i];
    const newX = y;
    const newY = x - q * y;
    x = newX;
    y = newY;

    backTable.unshift({ ...forward[i], x, y });

    steps.push({
      type: "backtrack",
      a: forward[i].a,
      b: forward[i].b,
      x,
      y,
      q,
      table: [
        ...backTable,
        ...forward.slice(0, i).map((f) => ({ ...f, x: 0, y: 0 })),
      ],
      depth: i,
      description: `逆算: x = ${y === 0 ? 0 : `前のy`}, y = ${`前のx`} - ${q} × ${`前のy`} → x = ${x}, y = ${y}  (${forward[i].a} × ${x} + ${forward[i].b} × ${y} = ${gcd})`,
    });
  }

  steps.push({
    type: "done",
    a,
    b,
    x,
    y,
    table: backTable,
    depth: 0,
    description: `完了: ${a} × (${x}) + ${b} × (${y}) = ${gcd}`,
  });

  return steps;
}

// --- Component ---

export default function ExtGCDAnimationPage() {
  const [inputA, setInputA] = useState("252");
  const [inputB, setInputB] = useState("105");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((aStr: string, bStr: string) => {
    const a = parseInt(aStr, 10);
    const b = parseInt(bStr, 10);
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) return;
    setSteps(generateSteps(a, b));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(inputA, inputB);
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
        <h1 className="text-2xl font-bold mb-1">拡張ユークリッドの互除法</h1>
        <p className="text-sm text-muted-foreground mb-6">
          ax + by = gcd(a, b) を満たす整数 x, y を求める
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8">
          <Input
            value={inputA}
            onChange={(e) => setInputA(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputA, inputB);
            }}
            placeholder="a"
            className="font-mono max-w-[120px]"
          />
          <Input
            value={inputB}
            onChange={(e) => setInputB(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(inputA, inputB);
            }}
            placeholder="b"
            className="font-mono max-w-[120px]"
          />
          <Button onClick={() => run(inputA, inputB)} variant="outline">
            実行
          </Button>
        </div>

        {/* Current values */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            現在の値
          </div>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">a</div>
              <div className="w-16 h-12 flex items-center justify-center border-2 bg-blue-100 border-blue-400 text-lg font-mono font-bold">
                {step.a}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">b</div>
              <div className="w-16 h-12 flex items-center justify-center border-2 bg-amber-50 border-amber-400 text-lg font-mono font-bold">
                {step.b}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">x</div>
              <div
                className={`w-16 h-12 flex items-center justify-center border-2 text-lg font-mono font-bold ${
                  step.type === "done"
                    ? "bg-emerald-100 border-emerald-500"
                    : "bg-white border-gray-200"
                }`}
              >
                {step.x}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">y</div>
              <div
                className={`w-16 h-12 flex items-center justify-center border-2 text-lg font-mono font-bold ${
                  step.type === "done"
                    ? "bg-emerald-100 border-emerald-500"
                    : "bg-white border-gray-200"
                }`}
              >
                {step.y}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {step.table.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              計算テーブル
            </div>
            <table className="text-sm font-mono border-collapse">
              <thead>
                <tr>
                  <th className="px-3 py-1 border border-border text-right">a</th>
                  <th className="px-3 py-1 border border-border text-right">b</th>
                  <th className="px-3 py-1 border border-border text-right">q</th>
                  <th className="px-3 py-1 border border-border text-right">r</th>
                  <th className="px-3 py-1 border border-border text-right">x</th>
                  <th className="px-3 py-1 border border-border text-right">y</th>
                </tr>
              </thead>
              <tbody>
                {step.table.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-1 border border-border text-right">{row.a}</td>
                    <td className="px-3 py-1 border border-border text-right">{row.b}</td>
                    <td className="px-3 py-1 border border-border text-right">{row.q}</td>
                    <td className="px-3 py-1 border border-border text-right">{row.r}</td>
                    <td className={`px-3 py-1 border border-border text-right ${row.x !== 0 || row.y !== 0 ? "bg-emerald-100" : ""}`}>
                      {row.x !== 0 || row.y !== 0 ? row.x : "–"}
                    </td>
                    <td className={`px-3 py-1 border border-border text-right ${row.x !== 0 || row.y !== 0 ? "bg-emerald-100" : ""}`}>
                      {row.x !== 0 || row.y !== 0 ? row.y : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
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
            <span>現在の a</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>現在の b</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>確定した x, y</span>
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
      </div>
    </div>
  );
}
