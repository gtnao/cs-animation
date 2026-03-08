"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

interface TrieNode {
  id: number;
  children: Record<string, TrieNode>;
  isEnd: boolean;
  char: string;
}

type StepType = "init" | "insert_char" | "insert_done" | "search_char" | "search_found" | "search_not_found" | "done";

interface Step {
  type: StepType;
  root: TrieNode;
  currentNodeId: number;
  currentWord: string;
  currentCharIdx: number;
  phase: "insert" | "search";
  words: string[];
  searchResults: { word: string; found: boolean }[];
  description: string;
}

let nodeId = 0;

function createTrieNode(char: string): TrieNode {
  return { id: nodeId++, children: {}, isEnd: false, char };
}

function cloneTree(node: TrieNode): TrieNode {
  const cloned: TrieNode = { id: node.id, children: {}, isEnd: node.isEnd, char: node.char };
  for (const [c, child] of Object.entries(node.children)) {
    cloned.children[c] = cloneTree(child);
  }
  return cloned;
}

function generateSteps(words: string[], searchWords: string[]): Step[] {
  const steps: Step[] = [];
  nodeId = 0;
  const root = createTrieNode("");

  steps.push({
    type: "init",
    root: cloneTree(root),
    currentNodeId: 0,
    currentWord: "",
    currentCharIdx: -1,
    phase: "insert",
    words,
    searchResults: [],
    description: `Trie を初期化。挿入する単語: [${words.map(w => `"${w}"`).join(", ")}]`,
  });

  // Insert phase
  for (const word of words) {
    let node = root;
    for (let i = 0; i < word.length; i++) {
      const c = word[i];
      if (!node.children[c]) {
        node.children[c] = createTrieNode(c);
      }
      node = node.children[c];

      steps.push({
        type: "insert_char",
        root: cloneTree(root),
        currentNodeId: node.id,
        currentWord: word,
        currentCharIdx: i,
        phase: "insert",
        words,
        searchResults: [],
        description: `"${word}": 文字 '${c}' のノード${node.id === nodeId - 1 ? " (新規作成)" : ""}へ移動`,
      });
    }
    node.isEnd = true;

    steps.push({
      type: "insert_done",
      root: cloneTree(root),
      currentNodeId: node.id,
      currentWord: word,
      currentCharIdx: word.length - 1,
      phase: "insert",
      words,
      searchResults: [],
      description: `"${word}" の挿入完了。ノード ${node.id} を終端としてマーク`,
    });
  }

  // Search phase
  const searchResults: { word: string; found: boolean }[] = [];

  for (const word of searchWords) {
    let node: TrieNode | null = root;
    let found = true;

    for (let i = 0; i < word.length; i++) {
      const c = word[i];
      if (node && node.children[c]) {
        node = node.children[c];
        steps.push({
          type: "search_char",
          root: cloneTree(root),
          currentNodeId: node.id,
          currentWord: word,
          currentCharIdx: i,
          phase: "search",
          words,
          searchResults: [...searchResults],
          description: `"${word}" を検索: 文字 '${c}' → ノード ${node.id} へ`,
        });
      } else {
        found = false;
        steps.push({
          type: "search_not_found",
          root: cloneTree(root),
          currentNodeId: node ? node.id : 0,
          currentWord: word,
          currentCharIdx: i,
          phase: "search",
          words,
          searchResults: [...searchResults],
          description: `"${word}" を検索: 文字 '${c}' が見つからない → 不在`,
        });
        break;
      }
    }

    if (found && node) {
      if (node.isEnd) {
        searchResults.push({ word, found: true });
        steps.push({
          type: "search_found",
          root: cloneTree(root),
          currentNodeId: node.id,
          currentWord: word,
          currentCharIdx: word.length - 1,
          phase: "search",
          words,
          searchResults: [...searchResults],
          description: `"${word}" が Trie に存在!`,
        });
      } else {
        searchResults.push({ word, found: false });
        steps.push({
          type: "search_not_found",
          root: cloneTree(root),
          currentNodeId: node.id,
          currentWord: word,
          currentCharIdx: word.length - 1,
          phase: "search",
          words,
          searchResults: [...searchResults],
          description: `"${word}" のパスは存在するが終端マークなし → 不在`,
        });
      }
    } else if (found) {
      searchResults.push({ word, found: false });
    }
  }

  steps.push({
    type: "done",
    root: cloneTree(root),
    currentNodeId: 0,
    currentWord: "",
    currentCharIdx: -1,
    phase: "search",
    words,
    searchResults: [...searchResults],
    description: `完了。検索結果: ${searchResults.map(r => `"${r.word}": ${r.found ? "存在" : "不在"}`).join(", ")}`,
  });

  return steps;
}

// --- Tree rendering ---

function RenderTrieNode({ node, highlightId, depth }: { node: TrieNode; highlightId: number; depth: number }) {
  const isHighlighted = node.id === highlightId;
  return (
    <div className={depth > 0 ? "ml-4" : ""}>
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-mono border ${
        isHighlighted
          ? "bg-blue-100 border-blue-400 font-bold"
          : node.isEnd
            ? "bg-emerald-100 border-emerald-500"
            : "bg-white border-gray-200"
      }`}>
        {depth === 0 ? "root" : node.char}
        {node.isEnd && <span className="text-[9px] text-emerald-600">end</span>}
      </div>
      {Object.keys(node.children).length > 0 && (
        <div className="ml-2 border-l border-gray-200 pl-2 mt-1 space-y-1">
          {Object.entries(node.children)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([c, child]) => (
              <RenderTrieNode key={c} node={child} highlightId={highlightId} depth={depth + 1} />
            ))}
        </div>
      )}
    </div>
  );
}

// --- Component ---

export default function TrieAnimationPage() {
  const [wordsInput, setWordsInput] = useState("apple, app, application, bat, ball");
  const [searchInput, setSearchInput] = useState("app, bat, ban, apple");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((w: string, s: string) => {
    const ws = w.split(",").map(s => s.trim()).filter(s => s.length > 0);
    const ss = s.split(",").map(s => s.trim()).filter(s => s.length > 0);
    if (ws.length === 0) return;
    setSteps(generateSteps(ws, ss));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => { run(wordsInput, searchInput); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => setCurrentStep((prev) => prev + 1), 500);
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
          <Input value={wordsInput} onChange={(e) => setWordsInput(e.target.value)} placeholder="挿入する単語 (カンマ区切り)" className="font-mono max-w-sm" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="検索する単語 (カンマ区切り)" className="font-mono max-w-sm" />
          <Button onClick={() => run(wordsInput, searchInput)} variant="outline">実行</Button>
        </div>

        <div className="mb-4">
          <span className="text-xs font-semibold px-2 py-1 rounded bg-muted border border-border">
            {step.phase === "insert" ? "Phase 1: 挿入" : "Phase 2: 検索"}
            {step.currentWord && ` - "${step.currentWord}"`}
          </span>
        </div>

        <div className="mb-6 p-4 bg-muted/30 border border-border rounded overflow-x-auto">
          <RenderTrieNode node={step.root} highlightId={step.currentNodeId} depth={0} />
        </div>

        {step.searchResults.length > 0 && (
          <div className="mb-6 flex gap-2 flex-wrap">
            {step.searchResults.map((r, i) => (
              <span key={i} className={`px-2 py-1 rounded text-sm font-mono border ${r.found ? "bg-emerald-50 border-emerald-300" : "bg-red-50 border-red-300"}`}>
                &quot;{r.word}&quot;: {r.found ? "存在" : "不在"}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>Step {currentStep + 1} / {steps.length}</span>
        </div>

        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" /><span>現在のノード</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" /><span>終端ノード</span></div>
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
