"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "add_hash"
  | "add_set"
  | "add_done"
  | "query_hash"
  | "query_check_hit"
  | "query_check_miss"
  | "query_result"
  | "done";

interface Step {
  type: StepType;
  bits: boolean[];
  highlightIndices: number[];
  description: string;
  queryResult?: boolean;
}

// --- Simple hash functions ---

function hash1(s: string, m: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) % m;
  }
  return h;
}

function hash2(s: string, m: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 37 + s.charCodeAt(i)) % m;
  }
  return ((h * 17) % m + m) % m;
}

function hash3(s: string, m: number): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) % m;
  }
  return h;
}

function getHashes(s: string, m: number): number[] {
  return [hash1(s, m), hash2(s, m), hash3(s, m)];
}

// --- Algorithm ---

function generateSteps(operations: string): Step[] {
  const m = 16; // bit array size
  const steps: Step[] = [];
  const bits = new Array(m).fill(false);

  steps.push({
    type: "init",
    bits: [...bits],
    highlightIndices: [],
    description: `Bloom Filter 初期化: サイズ m=${m}, ハッシュ関数 k=3`,
  });

  const ops = operations
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const op of ops) {
    if (op.startsWith("a")) {
      // Add
      const val = op.substring(1).trim();
      if (!val) continue;
      const hashes = getHashes(val, m);

      steps.push({
        type: "add_hash",
        bits: [...bits],
        highlightIndices: hashes,
        description: `Add("${val}"): ハッシュ値 = [${hashes.join(", ")}]`,
      });

      for (const h of hashes) {
        bits[h] = true;
      }

      steps.push({
        type: "add_set",
        bits: [...bits],
        highlightIndices: hashes,
        description: `Add("${val}"): ビット [${hashes.join(", ")}] を 1 にセット`,
      });

      steps.push({
        type: "add_done",
        bits: [...bits],
        highlightIndices: [],
        description: `Add("${val}") 完了`,
      });
    } else if (op.startsWith("q")) {
      // Query
      const val = op.substring(1).trim();
      if (!val) continue;
      const hashes = getHashes(val, m);

      steps.push({
        type: "query_hash",
        bits: [...bits],
        highlightIndices: hashes,
        description: `Query("${val}"): ハッシュ値 = [${hashes.join(", ")}]`,
      });

      let allSet = true;
      for (const h of hashes) {
        if (bits[h]) {
          steps.push({
            type: "query_check_hit",
            bits: [...bits],
            highlightIndices: [h],
            description: `Query("${val}"): bits[${h}] = 1 (OK)`,
          });
        } else {
          allSet = false;
          steps.push({
            type: "query_check_miss",
            bits: [...bits],
            highlightIndices: [h],
            description: `Query("${val}"): bits[${h}] = 0 (不在確定)`,
          });
          break;
        }
      }

      steps.push({
        type: "query_result",
        bits: [...bits],
        highlightIndices: hashes,
        queryResult: allSet,
        description: allSet
          ? `Query("${val}"): 全ビットが 1 → 「含まれる可能性あり」`
          : `Query("${val}"): 0 のビットあり → 「確実に含まれない」`,
      });
    }
  }

  steps.push({
    type: "done",
    bits: [...bits],
    highlightIndices: [],
    description: "全操作完了",
  });

  return steps;
}

// --- Component ---

export default function BloomFilterAnimationPage() {
  const [input, setInput] = useState("acat,adog,abird,qcat,qfish,qdog");
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Bloom Filter</h1>
        <p className="text-sm text-muted-foreground mb-6">
          確率的メンバーシップテスト
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder="acat,adog,qcat,qfish"
            className="font-mono max-w-lg"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          a[文字列]=追加, q[文字列]=クエリ (カンマ区切り、例: acat,adog,qcat)
        </p>

        {/* Bit array */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            ビット配列
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.bits.map((bit, idx) => {
              const isHighlighted = step.highlightIndices.includes(idx);
              let bgClass = bit ? "bg-amber-50 border-amber-400" : "bg-white border-gray-200";
              if (isHighlighted && bit) {
                bgClass = "bg-emerald-100 border-emerald-500";
              } else if (isHighlighted && !bit) {
                bgClass = "bg-red-100 border-red-500";
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors ${bgClass}`}
                  >
                    {bit ? "1" : "0"}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {idx}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            ビット数:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.bits.length}
            </span>
          </span>
          <span>
            1の数:{" "}
            <span className="font-mono font-semibold text-foreground">
              {step.bits.filter(Boolean).length}
            </span>
          </span>
          <span>
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>ヒット (bit=1)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>ミス (bit=0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>セット済み</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200" />
            <span>未セット</span>
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
      </div>
    </div>
  );
}
