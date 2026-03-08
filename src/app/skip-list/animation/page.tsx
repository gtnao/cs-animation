"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface SLNode {
  key: number;
  forward: (SLNode | null)[];
}

interface SkipListData {
  header: SLNode;
  maxLevel: number;
  level: number;
}

type StepType = "init" | "search_level" | "advance" | "drop_level" | "insert" | "done";

interface Step {
  type: StepType;
  list: number[][]; // each level as sorted array of keys
  currentLevel: number;
  currentKey: number | null;
  insertedKey: number | null;
  newNodeLevel: number;
  description: string;
}

// --- Skip list utilities ---

const MAX_LEVEL = 4;
const P = 0.5;

let slSeed = 42;
function slRandom(): number {
  slSeed = (slSeed * 16807 + 0) % 2147483647;
  return (slSeed & 0xffff) / 0xffff;
}

function randomLevel(): number {
  let lvl = 0;
  while (slRandom() < P && lvl < MAX_LEVEL) lvl++;
  return lvl;
}

function createSkipList(): SkipListData {
  const header: SLNode = { key: -Infinity, forward: new Array(MAX_LEVEL + 1).fill(null) };
  return { header, maxLevel: MAX_LEVEL, level: 0 };
}

function skipListToLevels(sl: SkipListData): number[][] {
  const levels: number[][] = [];
  for (let lvl = 0; lvl <= sl.level; lvl++) {
    const row: number[] = [];
    let node = sl.header.forward[lvl];
    while (node) {
      row.push(node.key);
      node = node.forward[lvl];
    }
    levels.push(row);
  }
  return levels;
}

function insertWithSteps(sl: SkipListData, key: number, steps: Step[]): void {
  const update: (SLNode | null)[] = new Array(MAX_LEVEL + 1).fill(null);
  let current = sl.header;

  for (let i = sl.level; i >= 0; i--) {
    steps.push({
      type: "search_level",
      list: skipListToLevels(sl),
      currentLevel: i,
      currentKey: current.key === -Infinity ? null : current.key,
      insertedKey: null,
      newNodeLevel: -1,
      description: `レベル ${i} で探索開始`,
    });

    while (current.forward[i] && current.forward[i]!.key < key) {
      current = current.forward[i]!;
      steps.push({
        type: "advance",
        list: skipListToLevels(sl),
        currentLevel: i,
        currentKey: current.key,
        insertedKey: null,
        newNodeLevel: -1,
        description: `レベル ${i}: ノード ${current.key} → 右に進む (${current.key} < ${key})`,
      });
    }

    update[i] = current;

    if (i > 0) {
      steps.push({
        type: "drop_level",
        list: skipListToLevels(sl),
        currentLevel: i - 1,
        currentKey: current.key === -Infinity ? null : current.key,
        insertedKey: null,
        newNodeLevel: -1,
        description: `レベル ${i - 1} に降りる`,
      });
    }
  }

  const lvl = randomLevel();

  if (lvl > sl.level) {
    for (let i = sl.level + 1; i <= lvl; i++) {
      update[i] = sl.header;
    }
    sl.level = lvl;
  }

  const newNode: SLNode = { key, forward: new Array(lvl + 1).fill(null) };
  for (let i = 0; i <= lvl; i++) {
    newNode.forward[i] = update[i]!.forward[i];
    update[i]!.forward[i] = newNode;
  }

  steps.push({
    type: "insert",
    list: skipListToLevels(sl),
    currentLevel: 0,
    currentKey: key,
    insertedKey: key,
    newNodeLevel: lvl,
    description: `ノード ${key} をレベル ${lvl} で挿入`,
  });
}

// --- Component ---

export default function SkipListAnimationPage() {
  const [input, setInput] = useState("3,6,7,9,12,19,21,25");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const values = s.split(",").map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v));
    if (values.length === 0) return;
    slSeed = 42;
    const allSteps: Step[] = [];
    const sl = createSkipList();
    allSteps.push({ type: "init", list: [], currentLevel: 0, currentKey: null, insertedKey: null, newNodeLevel: -1, description: "空のSkip Listからスタート" });

    for (const val of values) {
      allSteps.push({ type: "search_level", list: skipListToLevels(sl), currentLevel: sl.level, currentKey: null, insertedKey: null, newNodeLevel: -1, description: `値 ${val} を挿入開始` });
      insertWithSteps(sl, val, allSteps);
    }

    allSteps.push({ type: "done", list: skipListToLevels(sl), currentLevel: 0, currentKey: null, insertedKey: null, newNodeLevel: -1, description: "全ての値の挿入が完了" });
    setSteps(allSteps);
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(input); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((p) => p + 1), 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentStep, steps.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }
      else if (e.key === "ArrowRight") { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }
      else if (e.key === " ") { e.preventDefault(); if (currentStep < steps.length - 1) setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [steps.length, currentStep]);

  const step = steps[currentStep];
  if (!step) return null;

  // Gather all keys for layout
  const allKeys = step.list.length > 0 ? step.list[0] : [];
  const levels = step.list;
  const cellW = 50;
  const cellH = 36;
  const leftPad = 70;
  const topPad = 20;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Skip List</h1>
        <p className="text-sm text-muted-foreground mb-6">挿入操作をステップごとに可視化</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="カンマ区切りで値を入力" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6 border border-border rounded p-4 bg-white overflow-x-auto">
          <svg
            width={Math.max(leftPad + allKeys.length * cellW + 40, 400)}
            height={Math.max(topPad + (levels.length + 1) * cellH + 20, 100)}
            className="w-full h-auto"
          >
            {/* Level labels */}
            {levels.map((_, lvlIdx) => {
              const y = topPad + (levels.length - 1 - lvlIdx) * cellH + cellH / 2;
              return (
                <text key={`lbl-${lvlIdx}`} x={15} y={y + 5} fontSize={12} fontFamily="monospace" fill={step.currentLevel === lvlIdx ? "#2563eb" : "#9ca3af"}>
                  L{lvlIdx}
                </text>
              );
            })}

            {/* Nodes */}
            {allKeys.map((key, colIdx) => {
              const x = leftPad + colIdx * cellW;
              return levels.map((lvlKeys, lvlIdx) => {
                const y = topPad + (levels.length - 1 - lvlIdx) * cellH;
                const present = lvlKeys.includes(key);
                if (!present) return null;

                let fill = "#ffffff";
                let stroke = "#d1d5db";
                if (key === step.insertedKey) { fill = "#d1fae5"; stroke = "#10b981"; }
                else if (key === step.currentKey && lvlIdx === step.currentLevel) { fill = "#dbeafe"; stroke = "#60a5fa"; }

                return (
                  <g key={`cell-${lvlIdx}-${key}`}>
                    <rect x={x} y={y} width={cellW - 4} height={cellH - 4} rx={4} fill={fill} stroke={stroke} strokeWidth={2} />
                    <text x={x + (cellW - 4) / 2} y={y + (cellH - 4) / 2 + 5} textAnchor="middle" fontSize={13} fontFamily="monospace" fill="#1f2937">{key}</text>
                    {/* Horizontal arrow to next node at this level */}
                    {(() => {
                      const nextIdx = allKeys.findIndex((k, ci) => ci > colIdx && lvlKeys.includes(k));
                      if (nextIdx >= 0) {
                        const nx = leftPad + nextIdx * cellW;
                        return <line x1={x + cellW - 4} y1={y + (cellH - 4) / 2} x2={nx} y2={y + (cellH - 4) / 2} stroke="#9ca3af" strokeWidth={1.5} markerEnd="url(#arrow)" />;
                      }
                      return null;
                    })()}
                  </g>
                );
              });
            })}

            {/* Arrow marker */}
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#9ca3af" />
              </marker>
            </defs>
          </svg>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3"><span>Step {currentStep + 1} / {steps.length}</span></div>
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center"><p className="text-sm font-mono">{step.description}</p></div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded" /><span>探索中</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded" /><span>挿入完了</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.max(0, p - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((p) => Math.min(steps.length - 1, p + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((p) => !p)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
      </div>
    </div>
  );
}
