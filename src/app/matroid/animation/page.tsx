"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "sort" | "check" | "accept" | "reject" | "done";

interface Element {
  id: number;
  weight: number;
  group: number;
}

interface Step {
  type: StepType;
  elements: Element[];
  sortedOrder: number[];
  selected: number[];
  currentIndex: number;
  description: string;
}

function generateSteps(elements: Element[]): Step[] {
  const steps: Step[] = [];

  steps.push({
    type: "init",
    elements: elements.map((e) => ({ ...e })),
    sortedOrder: [],
    selected: [],
    currentIndex: -1,
    description: `${elements.length}個の要素。パーティションマトロイド上で貪欲法 (各グループから高々1個選択)`,
  });

  const sorted = [...elements].sort((a, b) => b.weight - a.weight);
  const sortedOrder = sorted.map((e) => e.id);

  steps.push({
    type: "sort",
    elements: elements.map((e) => ({ ...e })),
    sortedOrder: [...sortedOrder],
    selected: [],
    currentIndex: -1,
    description: `重みの降順にソート: [${sorted.map((e) => `${e.id}(w=${e.weight})`).join(", ")}]`,
  });

  const selected: number[] = [];
  const usedGroups = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    const elem = sorted[i];

    steps.push({
      type: "check",
      elements: elements.map((e) => ({ ...e })),
      sortedOrder: [...sortedOrder],
      selected: [...selected],
      currentIndex: elem.id,
      description: `要素${elem.id} (重み=${elem.weight}, グループ=${elem.group}) を検討`,
    });

    if (!usedGroups.has(elem.group)) {
      selected.push(elem.id);
      usedGroups.add(elem.group);
      steps.push({
        type: "accept",
        elements: elements.map((e) => ({ ...e })),
        sortedOrder: [...sortedOrder],
        selected: [...selected],
        currentIndex: elem.id,
        description: `グループ${elem.group}は未使用。要素${elem.id}を選択。合計重み=${selected.reduce((s, id) => s + elements[id].weight, 0)}`,
      });
    } else {
      steps.push({
        type: "reject",
        elements: elements.map((e) => ({ ...e })),
        sortedOrder: [...sortedOrder],
        selected: [...selected],
        currentIndex: elem.id,
        description: `グループ${elem.group}は使用済み。要素${elem.id}をスキップ`,
      });
    }
  }

  const totalWeight = selected.reduce((s, id) => s + elements[id].weight, 0);
  steps.push({
    type: "done",
    elements: elements.map((e) => ({ ...e })),
    sortedOrder: [...sortedOrder],
    selected: [...selected],
    currentIndex: -1,
    description: `貪欲法完了。選択: [${selected.join(", ")}], 合計重み=${totalWeight}`,
  });

  return steps;
}

export default function MatroidAnimationPage() {
  const [input, setInput] = useState("0:5:A,1:3:A,2:8:B,3:2:B,4:7:C,5:1:C");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((s: string) => {
    const groups = new Map<string, number>();
    let groupId = 0;
    const elements: Element[] = s.trim().split(",").map((part) => {
      const [id, weight, group] = part.split(":");
      if (!groups.has(group)) groups.set(group, groupId++);
      return { id: parseInt(id), weight: parseInt(weight), group: groups.get(group)! };
    }).filter((e) => !isNaN(e.id) && !isNaN(e.weight));
    if (elements.length === 0) return;
    setSteps(generateSteps(elements));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(input); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 600);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Matroid (マトロイド)</h1>
        <p className="text-sm text-muted-foreground mb-6">パーティションマトロイド上の貪欲法を可視化</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="id:weight:group,..." className="font-mono max-w-md" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">要素</div>
          <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
            {step.elements.map((elem) => (
              <div key={elem.id} className={`px-3 py-2 border-2 rounded text-sm font-mono transition-colors ${
                elem.id === step.currentIndex && step.type === "accept" ? "bg-emerald-100 border-emerald-500" :
                elem.id === step.currentIndex && step.type === "reject" ? "bg-red-100 border-red-500" :
                elem.id === step.currentIndex ? "bg-blue-100 border-blue-400" :
                step.selected.includes(elem.id) ? "bg-emerald-100 border-emerald-500" :
                "bg-white border-gray-200"
              }`}>
                <div>ID:{elem.id}</div>
                <div className="text-xs">w={elem.weight} g={elem.group}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">選択済み</div>
          <div className="flex gap-1">
            {step.selected.length > 0 ? step.selected.map((id) => (
              <div key={id} className="w-10 h-10 flex items-center justify-center border-2 bg-emerald-100 border-emerald-500 text-sm font-mono">{id}</div>
            )) : <div className="text-sm text-muted-foreground">（なし）</div>}
          </div>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>検討中</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>選択</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" /><span>棄却</span></div>
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
