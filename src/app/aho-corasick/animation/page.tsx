"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface TrieNode {
  children: Map<string, number>;
  fail: number;
  output: number[];
  depth: number;
}

type StepType =
  | "init"
  | "trie_insert"
  | "build_fail"
  | "search_goto"
  | "search_fail"
  | "search_output"
  | "done";

interface Step {
  type: StepType;
  nodes: TrieNode[];
  currentNode: number;
  textPos: number;
  char?: string;
  found: { pattern: number; position: number }[];
  highlightNodes: number[];
  failLink?: [number, number];
  description: string;
}

// --- Algorithm ---

function generateSteps(text: string, patterns: string[]): Step[] {
  const steps: Step[] = [];
  if (text.length === 0 || patterns.length === 0) return [];

  // Build trie
  const nodes: TrieNode[] = [
    { children: new Map(), fail: 0, output: [], depth: 0 },
  ];

  steps.push({
    type: "init",
    nodes: JSON.parse(JSON.stringify(nodes, mapReplacer)),
    currentNode: 0,
    textPos: -1,
    found: [],
    highlightNodes: [0],
    description: `Trie を初期化。パターン: [${patterns.map((p) => `"${p}"`).join(", ")}]`,
  });

  for (let pi = 0; pi < patterns.length; pi++) {
    let cur = 0;
    for (let ci = 0; ci < patterns[pi].length; ci++) {
      const c = patterns[pi][ci];
      if (!nodes[cur].children.has(c)) {
        nodes[cur].children.set(c, nodes.length);
        nodes.push({
          children: new Map(),
          fail: 0,
          output: [],
          depth: nodes[cur].depth + 1,
        });
      }
      cur = nodes[cur].children.get(c)!;
    }
    nodes[cur].output.push(pi);
    steps.push({
      type: "trie_insert",
      nodes: JSON.parse(JSON.stringify(nodes, mapReplacer)),
      currentNode: cur,
      textPos: -1,
      found: [],
      highlightNodes: [cur],
      description: `パターン "${patterns[pi]}" を Trie に挿入 (ノード ${cur})`,
    });
  }

  // Build failure links using BFS
  const queue: number[] = [];
  for (const [, child] of nodes[0].children) {
    nodes[child].fail = 0;
    queue.push(child);
  }

  while (queue.length > 0) {
    const u = queue.shift()!;
    for (const [c, v] of nodes[u].children) {
      let f = nodes[u].fail;
      while (f !== 0 && !nodes[f].children.has(c)) {
        f = nodes[f].fail;
      }
      nodes[v].fail = nodes[f].children.has(c) ? nodes[f].children.get(c)! : 0;
      if (nodes[v].fail === v) nodes[v].fail = 0;
      nodes[v].output = [
        ...nodes[v].output,
        ...nodes[nodes[v].fail].output,
      ];
      queue.push(v);

      steps.push({
        type: "build_fail",
        nodes: JSON.parse(JSON.stringify(nodes, mapReplacer)),
        currentNode: v,
        textPos: -1,
        found: [],
        highlightNodes: [v, nodes[v].fail],
        failLink: [v, nodes[v].fail],
        description: `ノード ${v} の失敗リンク → ノード ${nodes[v].fail}`,
      });
    }
  }

  // Search phase
  let cur = 0;
  const found: { pattern: number; position: number }[] = [];

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    while (cur !== 0 && !nodes[cur].children.has(c)) {
      steps.push({
        type: "search_fail",
        nodes: JSON.parse(JSON.stringify(nodes, mapReplacer)),
        currentNode: cur,
        textPos: i,
        char: c,
        found: [...found],
        highlightNodes: [cur, nodes[cur].fail],
        description: `ノード ${cur} に '${c}' の遷移なし。失敗リンクでノード ${nodes[cur].fail} へ`,
      });
      cur = nodes[cur].fail;
    }

    if (nodes[cur].children.has(c)) {
      cur = nodes[cur].children.get(c)!;
      steps.push({
        type: "search_goto",
        nodes: JSON.parse(JSON.stringify(nodes, mapReplacer)),
        currentNode: cur,
        textPos: i,
        char: c,
        found: [...found],
        highlightNodes: [cur],
        description: `T[${i}]='${c}': ノード ${cur} へ遷移`,
      });
    } else {
      steps.push({
        type: "search_goto",
        nodes: JSON.parse(JSON.stringify(nodes, mapReplacer)),
        currentNode: 0,
        textPos: i,
        char: c,
        found: [...found],
        highlightNodes: [0],
        description: `T[${i}]='${c}': ルートに留まる`,
      });
    }

    if (nodes[cur].output.length > 0) {
      for (const pi of nodes[cur].output) {
        found.push({ pattern: pi, position: i - patterns[pi].length + 1 });
      }
      steps.push({
        type: "search_output",
        nodes: JSON.parse(JSON.stringify(nodes, mapReplacer)),
        currentNode: cur,
        textPos: i,
        found: [...found],
        highlightNodes: [cur],
        description: `パターン発見: ${nodes[cur].output.map((pi) => `"${patterns[pi]}" at ${i - patterns[pi].length + 1}`).join(", ")}`,
      });
    }
  }

  steps.push({
    type: "done",
    nodes: JSON.parse(JSON.stringify(nodes, mapReplacer)),
    currentNode: cur,
    textPos: text.length,
    found: [...found],
    highlightNodes: [],
    description: `検索完了。${found.length} 件の一致を検出`,
  });

  return steps;
}

function mapReplacer(_key: string, value: unknown) {
  if (value instanceof Map) {
    return Object.fromEntries(value);
  }
  return value;
}

// --- Component ---

export default function AhoCorasickAnimationPage() {
  const [textInput, setTextInput] = useState("ushers");
  const [patternsInput, setPatternsInput] = useState("he, she, his, hers");
  const [text, setText] = useState("ushers");
  const [patterns, setPatterns] = useState<string[]>(["he", "she", "his", "hers"]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((t: string, p: string) => {
    const tt = t.trim();
    const ps = p.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    if (tt.length === 0 || ps.length === 0) return;
    setText(tt);
    setPatterns(ps);
    setSteps(generateSteps(tt, ps));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(textInput, patternsInput);
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

  const getTextCellClass = (idx: number): string => {
    const base =
      "w-10 h-10 flex items-center justify-center border-2 text-sm font-mono transition-colors";
    if (step.type === "done") {
      for (const f of step.found) {
        if (idx >= f.position && idx < f.position + patterns[f.pattern].length) {
          return `${base} bg-emerald-100 border-emerald-500`;
        }
      }
    }
    if (step.type === "search_output") {
      for (const pi of (step.nodes[step.currentNode]?.output || [])) {
        const pos = idx;
        const matchStart = step.textPos - patterns[pi].length + 1;
        if (pos >= matchStart && pos <= step.textPos) {
          return `${base} bg-emerald-100 border-emerald-500`;
        }
      }
    }
    if (idx === step.textPos) {
      return `${base} bg-blue-100 border-blue-400`;
    }
    return `${base} bg-white border-gray-200`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Aho-Corasick法</h1>
        <p className="text-sm text-muted-foreground mb-6">
          複数パターンの同時検索を行うオートマトンベースのアルゴリズム
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="テキスト"
            className="font-mono max-w-xs"
          />
          <Input
            value={patternsInput}
            onChange={(e) => setPatternsInput(e.target.value)}
            placeholder="パターン (カンマ区切り)"
            className="font-mono max-w-sm"
          />
          <Button onClick={() => run(textInput, patternsInput)} variant="outline">
            実行
          </Button>
        </div>

        {/* Text */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            テキスト
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {text.split("").map((c, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={getTextCellClass(idx)}>{c}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {idx}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patterns */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            パターン
          </div>
          <div className="flex gap-2 flex-wrap">
            {patterns.map((p, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-muted border border-border rounded text-sm font-mono"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Current state */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            現在のノード: {step.currentNode}
          </div>
          {step.failLink && (
            <div className="text-xs text-muted-foreground">
              失敗リンク: {step.failLink[0]} → {step.failLink[1]}
            </div>
          )}
        </div>

        {/* Found patterns */}
        {step.found.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              発見済みパターン
            </div>
            <div className="flex gap-2 flex-wrap">
              {step.found.map((f, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-emerald-50 border border-emerald-300 rounded text-sm font-mono"
                >
                  &quot;{patterns[f.pattern]}&quot; at {f.position}
                </span>
              ))}
            </div>
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
            <span>現在位置</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>一致</span>
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
      </div>
    </div>
  );
}
