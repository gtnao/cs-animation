"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface PalNode {
  len: number;
  suffLink: number;
  children: Record<string, number>;
}

type StepType = "init" | "add_char" | "done";

interface Step {
  type: StepType;
  nodes: PalNode[];
  lastNode: number;
  charIdx: number;
  char?: string;
  totalPalindromes: number;
  description: string;
}

// --- Algorithm ---

function generateSteps(s: string): Step[] {
  const steps: Step[] = [];
  if (s.length === 0) return [];

  // Node 0: root for even-length palindromes (len = -1)
  // Node 1: root for odd-length palindromes (len = 0)
  const nodes: PalNode[] = [
    { len: -1, suffLink: 0, children: {} },
    { len: 0, suffLink: 0, children: {} },
  ];
  let last = 1;

  steps.push({
    type: "init",
    nodes: JSON.parse(JSON.stringify(nodes)),
    lastNode: last,
    charIdx: -1,
    totalPalindromes: 0,
    description: `Palindromic Tree を初期化。ノード0 (偶数根, len=-1)、ノード1 (奇数根, len=0)`,
  });

  let totalPalindromes = 0;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    let cur = last;

    // Find longest suffix palindrome that can be extended by c
    while (true) {
      const curLen = nodes[cur].len;
      if (i - 1 - curLen >= 0 && s[i - 1 - curLen] === c) break;
      cur = nodes[cur].suffLink;
    }

    if (c in nodes[cur].children) {
      last = nodes[cur].children[c];
      steps.push({
        type: "add_char",
        nodes: JSON.parse(JSON.stringify(nodes)),
        lastNode: last,
        charIdx: i,
        char: c,
        totalPalindromes,
        description: `'${c}' (位置 ${i}): 回文はすでに存在 (ノード ${last}, len=${nodes[last].len})`,
      });
      continue;
    }

    const newNode = nodes.length;
    nodes.push({
      len: nodes[cur].len + 2,
      suffLink: -1,
      children: {},
    });
    nodes[cur].children[c] = newNode;
    totalPalindromes++;

    if (nodes[newNode].len === 1) {
      nodes[newNode].suffLink = 1;
    } else {
      // Find suffix link
      let tmp = nodes[cur].suffLink;
      while (true) {
        const tmpLen = nodes[tmp].len;
        if (i - 1 - tmpLen >= 0 && s[i - 1 - tmpLen] === c) break;
        tmp = nodes[tmp].suffLink;
      }
      nodes[newNode].suffLink = nodes[tmp].children[c] || 1;
    }

    last = newNode;

    steps.push({
      type: "add_char",
      nodes: JSON.parse(JSON.stringify(nodes)),
      lastNode: last,
      charIdx: i,
      char: c,
      totalPalindromes,
      description: `'${c}' (位置 ${i}): 新しい回文ノード ${newNode} 作成 (len=${nodes[newNode].len}, suffLink=${nodes[newNode].suffLink})`,
    });
  }

  steps.push({
    type: "done",
    nodes: JSON.parse(JSON.stringify(nodes)),
    lastNode: last,
    charIdx: s.length,
    totalPalindromes,
    description: `Palindromic Tree 構築完了。${totalPalindromes} 個の異なる回文部分文字列`,
  });

  return steps;
}

// --- Component ---

export default function PalindromicTreeAnimationPage() {
  const [input, setInput] = useState("eertree");
  const [text, setText] = useState("eertree");
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

  useEffect(() => { run(input); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Palindromic Tree</h1>
        <p className="text-sm text-muted-foreground mb-6">全回文部分文字列を効率的に管理する木構造</p>

        <div className="flex gap-2 mb-8">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(input); }} placeholder="文字列を入力" className="font-mono max-w-xs" />
          <Button onClick={() => run(input)} variant="outline">実行</Button>
        </div>

        {/* String */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">文字列</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {text.split("").map((c, idx) => {
              const base = "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
              const cls = idx === step.charIdx
                ? `${base} bg-blue-100 border-blue-400`
                : idx < step.charIdx
                  ? `${base} bg-white border-gray-300`
                  : `${base} bg-gray-50 border-gray-200`;
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className={cls}>{c}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{idx}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nodes table */}
        <div className="mb-6 overflow-x-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2">ノード一覧 (異なる回文数: {step.totalPalindromes})</div>
          <table className="text-sm font-mono border-collapse w-full">
            <thead>
              <tr className="text-muted-foreground">
                <th className="px-2 py-1 text-left">ID</th>
                <th className="px-2 py-1 text-left">len</th>
                <th className="px-2 py-1 text-left">suffLink</th>
                <th className="px-2 py-1 text-left">子</th>
              </tr>
            </thead>
            <tbody>
              {step.nodes.map((node, id) => {
                const isLast = id === step.lastNode;
                return (
                  <tr key={id} className={isLast ? "bg-blue-50" : ""}>
                    <td className="px-2 py-1 border-t border-gray-200">
                      {id}{id === 0 ? " (偶根)" : id === 1 ? " (奇根)" : ""}
                    </td>
                    <td className="px-2 py-1 border-t border-gray-200">{node.len}</td>
                    <td className="px-2 py-1 border-t border-gray-200">{node.suffLink}</td>
                    <td className="px-2 py-1 border-t border-gray-200">
                      {Object.entries(node.children).map(([c, to]) => `${c}→${to}`).join(", ") || "–"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>現在位置 / 最終ノード</span></div>
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
