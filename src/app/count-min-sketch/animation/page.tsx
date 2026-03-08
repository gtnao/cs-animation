"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "update_hash"
  | "update_increment"
  | "update_done"
  | "query_hash"
  | "query_read"
  | "query_result"
  | "done";

interface Step {
  type: StepType;
  table: number[][];
  highlightCells: [number, number][]; // [row, col]
  description: string;
  queryResult?: number;
}

// --- Hash functions ---

function hashRow0(s: string, w: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) % w;
  }
  return h;
}

function hashRow1(s: string, w: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 37 + s.charCodeAt(i)) % w;
  }
  return ((h * 17) % w + w) % w;
}

function hashRow2(s: string, w: number): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) % w;
  }
  return h;
}

function getRowHashes(s: string, w: number): number[] {
  return [hashRow0(s, w), hashRow1(s, w), hashRow2(s, w)];
}

// --- Algorithm ---

function generateSteps(operations: string): Step[] {
  const d = 3; // rows
  const w = 8; // columns
  const steps: Step[] = [];
  const table: number[][] = Array.from({ length: d }, () =>
    new Array(w).fill(0)
  );

  function cloneTable(): number[][] {
    return table.map((row) => [...row]);
  }

  steps.push({
    type: "init",
    table: cloneTable(),
    highlightCells: [],
    description: `Count-Min Sketch 初期化: d=${d}行, w=${w}列`,
  });

  const ops = operations
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const op of ops) {
    if (op.startsWith("u")) {
      // Update
      const val = op.substring(1).trim();
      if (!val) continue;
      const hashes = getRowHashes(val, w);
      const cells: [number, number][] = hashes.map((h, i) => [i, h]);

      steps.push({
        type: "update_hash",
        table: cloneTable(),
        highlightCells: cells,
        description: `Update("${val}"): ハッシュ値 = [${hashes.join(", ")}]`,
      });

      for (let i = 0; i < d; i++) {
        table[i][hashes[i]]++;
      }

      steps.push({
        type: "update_increment",
        table: cloneTable(),
        highlightCells: cells,
        description: `Update("${val}"): カウンタを +1`,
      });

      steps.push({
        type: "update_done",
        table: cloneTable(),
        highlightCells: [],
        description: `Update("${val}") 完了`,
      });
    } else if (op.startsWith("q")) {
      // Query
      const val = op.substring(1).trim();
      if (!val) continue;
      const hashes = getRowHashes(val, w);
      const cells: [number, number][] = hashes.map((h, i) => [i, h]);

      steps.push({
        type: "query_hash",
        table: cloneTable(),
        highlightCells: cells,
        description: `Query("${val}"): ハッシュ値 = [${hashes.join(", ")}]`,
      });

      const values = hashes.map((h, i) => table[i][h]);

      steps.push({
        type: "query_read",
        table: cloneTable(),
        highlightCells: cells,
        description: `Query("${val}"): カウンタ値 = [${values.join(", ")}]`,
      });

      const result = Math.min(...values);

      steps.push({
        type: "query_result",
        table: cloneTable(),
        highlightCells: cells,
        queryResult: result,
        description: `Query("${val}"): min(${values.join(", ")}) = ${result}`,
      });
    }
  }

  steps.push({
    type: "done",
    table: cloneTable(),
    highlightCells: [],
    description: "全操作完了",
  });

  return steps;
}

// --- Component ---

export default function CountMinSketchAnimationPage() {
  const [input, setInput] = useState(
    "ucat,udog,ucat,ubird,ucat,udog,qcat,qdog,qfish"
  );
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
    }, 600);
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

  const isHighlighted = (row: number, col: number) =>
    step.highlightCells.some(([r, c]) => r === row && c === col);

  return (
    <>
<div className="flex gap-2 mb-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="ucat,udog,qcat"
            className="font-mono max-w-lg"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          u[文字列]=カウント更新, q[文字列]=頻度クエリ (カンマ区切り)
        </p>

        {/* Counter table */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            カウンタテーブル (d=3行, w=8列)
          </div>
          <div className="overflow-x-auto">
            <div className="inline-block">
              {/* Column headers */}
              <div className="flex gap-1 mb-1 ml-12">
                {Array.from({ length: step.table[0]?.length || 0 }, (_, j) => (
                  <div
                    key={j}
                    className="w-10 text-center text-[10px] text-muted-foreground font-mono"
                  >
                    {j}
                  </div>
                ))}
              </div>
              {step.table.map((row, i) => (
                <div key={i} className="flex gap-1 mb-1 items-center">
                  <div className="w-10 text-right text-[10px] text-muted-foreground font-mono mr-1">
                    h{i}
                  </div>
                  {row.map((val, j) => {
                    const hl = isHighlighted(i, j);
                    let cls =
                      "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
                    if (hl) {
                      cls += " bg-blue-100 border-blue-400 font-bold";
                    } else if (val > 0) {
                      cls += " bg-amber-50 border-amber-400";
                    } else {
                      cls += " bg-white border-gray-200";
                    }
                    return (
                      <div key={j} className={cls}>
                        {val}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          {step.queryResult !== undefined && (
            <span>
              推定頻度:{" "}
              <span className="font-mono font-semibold text-foreground">
                {step.queryResult}
              </span>
            </span>
          )}
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>処理中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>カウント {'>'} 0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200" />
            <span>カウント = 0</span>
          </div>
        </div>

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
              setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
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
