"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StepType = "init" | "update" | "copy_path" | "query" | "done";

interface PNode {
  value: number;
  left: number;
  right: number;
}

interface Step {
  type: StepType;
  arr: number[];
  versions: number[][];
  currentVersion: number;
  targetIndex: number;
  newValue: number;
  queryVersion: number;
  queryIndex: number;
  queryResult: number | null;
  description: string;
}

interface Operation {
  type: "update" | "query";
  version?: number;
  index: number;
  value?: number;
}

function generateSteps(initialArr: number[], ops: Operation[]): Step[] {
  const steps: Step[] = [];
  const versions: number[][] = [initialArr.map((v) => v)];

  steps.push({
    type: "init",
    arr: [...initialArr],
    versions: versions.map((v) => [...v]),
    currentVersion: 0,
    targetIndex: -1,
    newValue: 0,
    queryVersion: -1,
    queryIndex: -1,
    queryResult: null,
    description: `初期配列 (v0): [${initialArr.join(", ")}]。永続配列を構築`,
  });

  for (const op of ops) {
    if (op.type === "update") {
      const baseVer = op.version !== undefined ? op.version : versions.length - 1;
      const newArr = [...versions[baseVer]];
      const oldVal = newArr[op.index];
      newArr[op.index] = op.value!;
      const newVer = versions.length;
      versions.push(newArr);

      steps.push({
        type: "copy_path",
        arr: [...newArr],
        versions: versions.map((v) => [...v]),
        currentVersion: newVer,
        targetIndex: op.index,
        newValue: op.value!,
        queryVersion: -1,
        queryIndex: -1,
        queryResult: null,
        description: `v${baseVer}をベースにA[${op.index}]を${oldVal}→${op.value}に更新 → v${newVer}を作成`,
      });
    } else if (op.type === "query") {
      const ver = op.version !== undefined ? op.version : versions.length - 1;
      const val = versions[ver][op.index];

      steps.push({
        type: "query",
        arr: [...versions[ver]],
        versions: versions.map((v) => [...v]),
        currentVersion: ver,
        targetIndex: -1,
        newValue: 0,
        queryVersion: ver,
        queryIndex: op.index,
        queryResult: val,
        description: `v${ver}のA[${op.index}]を参照 → ${val}`,
      });
    }
  }

  steps.push({
    type: "done",
    arr: [...versions[versions.length - 1]],
    versions: versions.map((v) => [...v]),
    currentVersion: versions.length - 1,
    targetIndex: -1,
    newValue: 0,
    queryVersion: -1,
    queryIndex: -1,
    queryResult: null,
    description: `完了。${versions.length}個のバージョンを管理`,
  });

  return steps;
}

export default function PersistentDataStructuresAnimationPage() {
  const [inputArr, setInputArr] = useState("1 2 3 4 5");
  const [inputOps, setInputOps] = useState("u0:2=10,u0:4=20,q0:3,q1:2,u1:0=99,q2:4");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((arrStr: string, opsStr: string) => {
    const arr = arrStr.trim().split(/[\s,]+/).map(Number).filter((x) => !isNaN(x));
    if (arr.length === 0) return;
    const parsed = opsStr.trim().split(",").map((s) => {
      s = s.trim();
      if (s.startsWith("u")) {
        const parts = s.slice(1).split(/[:=]/);
        return { type: "update" as const, version: parseInt(parts[0]), index: parseInt(parts[1]), value: parseInt(parts[2]) };
      } else if (s.startsWith("q")) {
        const parts = s.slice(1).split(":");
        return { type: "query" as const, version: parseInt(parts[0]), index: parseInt(parts[1]) };
      }
      return null;
    });
    const ops = parsed.filter((x) => x !== null) as Operation[];
    setSteps(generateSteps(arr, ops));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(inputArr, inputOps); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 700);
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
    <>
<div className="flex gap-2 mb-8 flex-wrap">
          <Input value={inputArr} onChange={(e) => setInputArr(e.target.value)} placeholder="初期配列" className="font-mono max-w-xs" />
          <Input value={inputOps} onChange={(e) => setInputOps(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(inputArr, inputOps); }} placeholder="u版:idx=val,q版:idx,..." className="font-mono max-w-sm" />
          <Button onClick={() => run(inputArr, inputOps)} variant="outline">実行</Button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">全バージョン</div>
          <div className="space-y-2">
            {step.versions.map((ver, vi) => (
              <div key={vi} className="flex items-center gap-2">
                <span className={`text-sm font-mono w-8 ${vi === step.currentVersion ? "font-bold text-foreground" : "text-muted-foreground"}`}>v{vi}:</span>
                <div className="flex gap-1">
                  {ver.map((val, idx) => (
                    <div key={idx} className={`w-12 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors ${
                      vi === step.currentVersion && idx === step.targetIndex ? "bg-blue-100 border-blue-400" :
                      vi === step.queryVersion && idx === step.queryIndex ? "bg-emerald-100 border-emerald-500" :
                      vi === step.currentVersion ? "bg-amber-50 border-amber-400" :
                      "bg-white border-gray-200"
                    }`}>{val}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {step.queryResult !== null && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">クエリ結果</div>
            <div className="inline-block px-3 py-1 border-2 bg-emerald-100 border-emerald-500 text-sm font-mono rounded">
              v{step.queryVersion}[{step.queryIndex}] = {step.queryResult}
            </div>
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>更新位置</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" /><span>現在のバージョン</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>クエリ対象</span></div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.max(0, prev - 1)); setIsPlaying(false); }} disabled={currentStep === 0}>← 前へ</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }} disabled={currentStep === steps.length - 1}>次へ →</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPlaying((prev) => !prev)} disabled={currentStep === steps.length - 1}>{isPlaying ? "停止" : "再生"}</Button>
          <Button variant="outline" size="sm" onClick={() => { setCurrentStep(0); setIsPlaying(false); }}>リセット</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">← → キーでステップ移動、スペースキーで再生/停止</p>
    </>
  );
}
