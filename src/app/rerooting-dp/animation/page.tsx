"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "dfs1_visit"
  | "dfs1_aggregate"
  | "dfs2_visit"
  | "dfs2_reroot"
  | "done";

interface Step {
  type: StepType;
  node: number;
  parent: number;
  dp: number[];
  ans: number[];
  description: string;
  highlightEdge?: [number, number];
}

// --- Build adjacency list from edge string ---

function parseEdges(s: string, n: number): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const parts = s.trim().split(/[\s,]+/);
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const u = parseInt(parts[i]);
    const v = parseInt(parts[i + 1]);
    if (!isNaN(u) && !isNaN(v) && u < n && v < n) {
      adj[u].push(v);
      adj[v].push(u);
    }
  }
  return adj;
}

// --- Algorithm: rerooting DP for "max distance from root" ---

function generateSteps(n: number, adj: number[][]): Step[] {
  const steps: Step[] = [];
  const dp = new Array(n).fill(0); // dp[v] = max depth of subtree rooted at v
  const ans = new Array(n).fill(0); // answer for each root

  steps.push({
    type: "init",
    node: -1,
    parent: -1,
    dp: [...dp],
    ans: [...ans],
    description: `木の頂点数=${n}。各頂点を根とした最遠頂点距離を全方位木DPで求める`,
  });

  // DFS1: compute dp[v] = max depth in subtree of v (rooted at 0)
  const order: number[] = [];
  const par = new Array(n).fill(-1);
  const visited = new Array(n).fill(false);
  const stack = [0];
  visited[0] = true;

  while (stack.length > 0) {
    const v = stack.pop()!;
    order.push(v);
    for (const u of adj[v]) {
      if (!visited[u]) {
        visited[u] = true;
        par[u] = v;
        stack.push(u);
      }
    }
  }

  // Process in reverse order to compute dp bottom-up
  for (let idx = order.length - 1; idx >= 0; idx--) {
    const v = order[idx];
    steps.push({
      type: "dfs1_visit",
      node: v,
      parent: par[v],
      dp: [...dp],
      ans: [...ans],
      description: `DFS1: 頂点${v}を処理 (親=${par[v] === -1 ? "なし" : par[v]})`,
    });

    for (const u of adj[v]) {
      if (u !== par[v]) {
        dp[v] = Math.max(dp[v], dp[u] + 1);
      }
    }

    steps.push({
      type: "dfs1_aggregate",
      node: v,
      parent: par[v],
      dp: [...dp],
      ans: [...ans],
      description: `DFS1: dp[${v}] = ${dp[v]} (部分木の最大深さ)`,
    });
  }

  // DFS2: reroot
  ans[0] = dp[0];
  steps.push({
    type: "dfs2_visit",
    node: 0,
    parent: -1,
    dp: [...dp],
    ans: [...ans],
    description: `DFS2: 根0の答え ans[0] = dp[0] = ${dp[0]}`,
  });

  for (const v of order) {
    // Compute children values for rerooting
    const children = adj[v].filter((u) => u !== par[v]);
    const childVals = children.map((u) => dp[u] + 1);

    // Prefix and suffix max for efficient rerooting
    const k = children.length;
    const prefix = new Array(k + 1).fill(0);
    const suffix = new Array(k + 1).fill(0);
    for (let i = 0; i < k; i++) {
      prefix[i + 1] = Math.max(prefix[i], childVals[i]);
    }
    for (let i = k - 1; i >= 0; i--) {
      suffix[i] = Math.max(suffix[i + 1], childVals[i]);
    }

    for (let ci = 0; ci < k; ci++) {
      const u = children[ci];
      // When rerooting to u, v's contribution (excluding u's subtree)
      const fromParent = ans[v] !== undefined ? ans[v] : 0;
      const bestWithout = Math.max(prefix[ci], suffix[ci + 1]);
      const parentContrib = Math.max(bestWithout, fromParent - (dp[u] + 1) >= 0 ? 0 : 0) ;

      // Simpler: ans[u] = max(dp[u], max contribution from parent side + 1)
      const parentSide = Math.max(
        bestWithout + 1,
        (par[v] !== -1 || ans[v] > dp[v] ? ans[v] - 0 : 0) > bestWithout
          ? ans[v] - dp[u] > 0
            ? 1 + Math.max(bestWithout, ans[v] - (dp[u] + 1) >= 0 ? ans[v] : bestWithout)
            : bestWithout + 1
          : bestWithout + 1
      );

      // Correct rerooting: ans[u] = max(dp[u], 1 + max(all other children of v, parent contribution of v))
      const fromV = 1 + Math.max(
        bestWithout,
        ans[v] > dp[v] ? ans[v] : 0
      );
      ans[u] = Math.max(dp[u], fromV);

      steps.push({
        type: "dfs2_reroot",
        node: u,
        parent: v,
        dp: [...dp],
        ans: [...ans],
        highlightEdge: [v, u],
        description: `DFS2: 根を${v}→${u}に移動。ans[${u}] = max(dp[${u}]=${dp[u]}, 親側=${fromV}) = ${ans[u]}`,
      });
    }
  }

  steps.push({
    type: "done",
    node: -1,
    parent: -1,
    dp: [...dp],
    ans: [...ans],
    description: `完了。各頂点の最遠距離: [${ans.join(", ")}]`,
  });

  return steps;
}

// --- Default ---
const defaultN = 6;
const defaultEdges = "0 1, 0 2, 1 3, 1 4, 2 5";

// --- Component ---

export default function RerootingDPAnimationPage() {
  const [nInput, setNInput] = useState("6");
  const [edgesInput, setEdgesInput] = useState(defaultEdges);
  const [n, setN] = useState(defaultN);
  const [adj, setAdj] = useState<number[][]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((numNodes: number, edgeStr: string) => {
    if (numNodes <= 0 || numNodes > 20) return;
    const adjList = parseEdges(edgeStr, numNodes);
    setN(numNodes);
    setAdj(adjList);
    setSteps(generateSteps(numNodes, adjList));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const handleRun = useCallback(() => {
    const numNodes = parseInt(nInput);
    if (!isNaN(numNodes)) {
      run(numNodes, edgesInput);
    }
  }, [nInput, edgesInput, run]);

  useEffect(() => {
    run(defaultN, defaultEdges);
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
    <>
{/* Input */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Input
            value={nInput}
            onChange={(e) => setNInput(e.target.value)}
            placeholder="頂点数"
            className="font-mono w-20"
          />
          <Input
            value={edgesInput}
            onChange={(e) => setEdgesInput(e.target.value)}
            placeholder="辺 (u v, ...)"
            className="font-mono max-w-md"
          />
          <Button onClick={handleRun} variant="outline">
            実行
          </Button>
        </div>

        {/* Node display */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            頂点情報
          </div>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: n }, (_, v) => {
              let cls = "w-14 h-14 flex flex-col items-center justify-center border-2 rounded-full text-xs font-mono transition-colors";
              if (step.node === v) {
                cls += " bg-blue-100 border-blue-400";
              } else if (
                step.highlightEdge &&
                (step.highlightEdge[0] === v || step.highlightEdge[1] === v)
              ) {
                cls += " bg-amber-50 border-amber-400";
              } else {
                cls += " bg-white border-gray-200";
              }
              return (
                <div key={v} className={cls}>
                  <div className="font-bold">{v}</div>
                  <div className="text-[9px] text-muted-foreground">
                    {step.ans[v] > 0 ? `a=${step.ans[v]}` : `d=${step.dp[v]}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tables */}
        <div className="mb-6 flex gap-8 flex-wrap">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              dp[] (部分木の最大深さ)
            </div>
            <div className="flex gap-1">
              {step.dp.map((val, v) => (
                <div key={v} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 flex items-center justify-center border-2 text-sm font-mono ${
                      step.node === v
                        ? "bg-blue-100 border-blue-400"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {val}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              ans[] (各根での答え)
            </div>
            <div className="flex gap-1">
              {step.ans.map((val, v) => (
                <div key={v} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-10 h-10 flex items-center justify-center border-2 text-sm font-mono ${
                      step.node === v && step.type === "dfs2_reroot"
                        ? "bg-emerald-100 border-emerald-500 font-bold"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {val}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {v}
                  </div>
                </div>
              ))}
            </div>
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
            <span>処理中の頂点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>関連する辺/頂点</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>答え確定</span>
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
