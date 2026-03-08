"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "classify"
  | "find_lms"
  | "bucket_sort"
  | "induce_l"
  | "induce_s"
  | "done";

interface Step {
  type: StepType;
  types: string[]; // "S" | "L" | "S*"
  sa: number[];
  lmsPositions: number[];
  currentIdx: number;
  description: string;
}

// --- Algorithm ---

function generateSteps(s: string): Step[] {
  const n = s.length;
  if (n === 0) return [];
  const steps: Step[] = [];

  // Classify S/L types
  const types: string[] = new Array(n).fill("");
  types[n - 1] = "S";

  steps.push({
    type: "init",
    types: [...types],
    sa: new Array(n).fill(-1),
    lmsPositions: [],
    currentIdx: -1,
    description: `SA-IS: 文字列 "${s}" の Suffix Array を構築`,
  });

  for (let i = n - 2; i >= 0; i--) {
    if (s[i] < s[i + 1]) {
      types[i] = "S";
    } else if (s[i] > s[i + 1]) {
      types[i] = "L";
    } else {
      types[i] = types[i + 1];
    }
  }

  steps.push({
    type: "classify",
    types: [...types],
    sa: new Array(n).fill(-1),
    lmsPositions: [],
    currentIdx: -1,
    description: `各位置をS型 (接尾辞が次より辞書順で小) またはL型 (大) に分類`,
  });

  // Find LMS positions
  const lmsPositions: number[] = [];
  for (let i = 1; i < n; i++) {
    if (types[i] === "S" && types[i - 1] === "L") {
      types[i] = "S*";
      lmsPositions.push(i);
    }
  }

  steps.push({
    type: "find_lms",
    types: [...types],
    sa: new Array(n).fill(-1),
    lmsPositions: [...lmsPositions],
    currentIdx: -1,
    description: `LMS (Left-Most S-type) 位置を検出: [${lmsPositions.join(", ")}]。L型の直後のS型がLMS`,
  });

  // Bucket sort LMS suffixes
  const sa = new Array(n).fill(-1);
  // Count characters
  const charSet = [...new Set(s.split(""))].sort();
  const bucketSizes: Record<string, number> = {};
  const bucketEnds: Record<string, number> = {};

  for (const c of s) {
    bucketSizes[c] = (bucketSizes[c] || 0) + 1;
  }
  let pos = 0;
  for (const c of charSet) {
    pos += bucketSizes[c];
    bucketEnds[c] = pos - 1;
  }

  // Place LMS suffixes at end of their buckets
  const tailCopy = { ...bucketEnds };
  for (let i = lmsPositions.length - 1; i >= 0; i--) {
    const c = s[lmsPositions[i]];
    sa[tailCopy[c]] = lmsPositions[i];
    tailCopy[c]--;
  }

  steps.push({
    type: "bucket_sort",
    types: [...types],
    sa: [...sa],
    lmsPositions: [...lmsPositions],
    currentIdx: -1,
    description: `LMS接尾辞をバケットの末尾に配置`,
  });

  // Induce L-type suffixes
  const headPos: Record<string, number> = {};
  pos = 0;
  for (const c of charSet) {
    headPos[c] = pos;
    pos += bucketSizes[c];
  }

  for (let i = 0; i < n; i++) {
    if (sa[i] > 0 && types[sa[i] - 1] === "L") {
      const c = s[sa[i] - 1];
      sa[headPos[c]] = sa[i] - 1;
      headPos[c]++;
    }
  }

  steps.push({
    type: "induce_l",
    types: [...types],
    sa: [...sa],
    lmsPositions: [...lmsPositions],
    currentIdx: -1,
    description: `L型接尾辞を左から誘導ソート (バケットの先頭に配置)`,
  });

  // Induce S-type suffixes
  const tail2 = { ...bucketEnds };
  for (let i = n - 1; i >= 0; i--) {
    if (sa[i] > 0 && (types[sa[i] - 1] === "S" || types[sa[i] - 1] === "S*")) {
      const c = s[sa[i] - 1];
      sa[tail2[c]] = sa[i] - 1;
      tail2[c]--;
    }
  }

  steps.push({
    type: "induce_s",
    types: [...types],
    sa: [...sa],
    lmsPositions: [...lmsPositions],
    currentIdx: -1,
    description: `S型接尾辞を右から誘導ソート (バケットの末尾に配置)`,
  });

  steps.push({
    type: "done",
    types: [...types],
    sa: [...sa],
    lmsPositions: [...lmsPositions],
    currentIdx: -1,
    description: `SA-IS 完了。SA = [${sa.join(", ")}]`,
  });

  return steps;
}

// --- Component ---

export default function SAISAnimationPage() {
  const [input, setInput] = useState("mmiissiissiippii$");
  const [text, setText] = useState("mmiissiissiippii$");
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

  const getCellClass = (idx: number): string => {
    const base =
      "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
    if (step.lmsPositions.includes(idx)) {
      return `${base} bg-blue-100 border-blue-400`;
    }
    if (step.types[idx] === "L") {
      return `${base} bg-amber-50 border-amber-400`;
    }
    if (step.types[idx] === "S" || step.types[idx] === "S*") {
      return `${base} bg-emerald-100 border-emerald-500`;
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
            placeholder="文字列を入力 (末尾に$推奨)"
            className="font-mono max-w-xs"
          />
          <Button onClick={() => run(input)} variant="outline">
            実行
          </Button>
        </div>

        {/* String with types */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            文字列と型分類
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {text.split("").map((c, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getCellClass(idx)}>{c}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {step.types[idx] || "?"}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SA */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Suffix Array
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step.sa.map((val, idx) => {
              let cls =
                "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              if (val >= 0) {
                cls += " bg-white border-gray-300";
              } else {
                cls += " bg-gray-50 border-gray-200 text-muted-foreground";
              }
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{val >= 0 ? val : "–"}</div>
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
            <span>LMS位置</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>L型</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>S型</span>
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
