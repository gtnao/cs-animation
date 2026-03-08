"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

type StepType =
  | "init"
  | "build_implication"
  | "scc_start"
  | "scc_assign"
  | "check_sat"
  | "assign_value"
  | "done";

interface Step {
  type: StepType;
  description: string;
  // Implication graph adjacency (for display)
  implEdges: [number, number][];
  // SCC component id for each node (-1 = not assigned)
  sccId: number[];
  // Variable assignment (undefined = not yet)
  assignment: (boolean | null)[];
  // Currently highlighted nodes
  highlightNodes: number[];
  // Number of variables
  numVars: number;
  isSatisfiable: boolean | null;
}

// --- Clauses: (x0 OR x1), (!x0 OR x2), (!x1 OR !x2) ---
// Variables: x0, x1, x2
// Literals: 0=x0, 1=!x0, 2=x1, 3=!x1, 4=x2, 5=!x2

interface Clause {
  a: number; // literal index
  b: number; // literal index
}

function neg(lit: number): number {
  return lit ^ 1;
}

function litName(lit: number, numVars: number): string {
  const varIdx = Math.floor(lit / 2);
  const isNeg = lit % 2 === 1;
  if (varIdx >= numVars) return `?`;
  return isNeg ? `!x${varIdx}` : `x${varIdx}`;
}

// --- Default 2-SAT instance ---

function defaultInstance(): { numVars: number; clauses: Clause[] } {
  // (x0 OR x1), (!x0 OR x2), (!x1 OR !x2)
  return {
    numVars: 3,
    clauses: [
      { a: 0, b: 2 }, // x0 OR x1
      { a: 1, b: 4 }, // !x0 OR x2
      { a: 3, b: 5 }, // !x1 OR !x2
    ],
  };
}

// --- SCC (Kosaraju's) ---

function kosaraju(n: number, edges: [number, number][]): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const radj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    radj[v].push(u);
  }

  const visited = new Array(n).fill(false);
  const order: number[] = [];

  // Iterative DFS for forward pass
  function dfs1(start: number) {
    const stack: { node: number; idx: number }[] = [{ node: start, idx: 0 }];
    visited[start] = true;
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (top.idx < adj[top.node].length) {
        const next = adj[top.node][top.idx];
        top.idx++;
        if (!visited[next]) {
          visited[next] = true;
          stack.push({ node: next, idx: 0 });
        }
      } else {
        order.push(top.node);
        stack.pop();
      }
    }
  }

  for (let i = 0; i < n; i++) {
    if (!visited[i]) dfs1(i);
  }

  const comp = new Array(n).fill(-1);
  let numComp = 0;

  // Iterative DFS for backward pass
  function dfs2(start: number, c: number) {
    const stack = [start];
    comp[start] = c;
    while (stack.length > 0) {
      const u = stack.pop()!;
      for (const v of radj[u]) {
        if (comp[v] === -1) {
          comp[v] = c;
          stack.push(v);
        }
      }
    }
  }

  for (let i = order.length - 1; i >= 0; i--) {
    if (comp[order[i]] === -1) {
      dfs2(order[i], numComp);
      numComp++;
    }
  }

  return comp;
}

// --- Step generation ---

function generateSteps(numVars: number, clauses: Clause[]): Step[] {
  const steps: Step[] = [];
  const numLits = numVars * 2;

  steps.push({
    type: "init",
    description: `2-SAT: ${numVars}変数、${clauses.length}節`,
    implEdges: [],
    sccId: new Array(numLits).fill(-1),
    assignment: new Array(numVars).fill(null),
    highlightNodes: [],
    numVars,
    isSatisfiable: null,
  });

  // Build implication graph
  const implEdges: [number, number][] = [];
  for (const clause of clauses) {
    const { a, b } = clause;
    // (a OR b) => (!a -> b) AND (!b -> a)
    implEdges.push([neg(a), b]);
    implEdges.push([neg(b), a]);

    steps.push({
      type: "build_implication",
      description: `節 (${litName(a, numVars)} OR ${litName(b, numVars)}) → 含意辺 ${litName(neg(a), numVars)}→${litName(b, numVars)}, ${litName(neg(b), numVars)}→${litName(a, numVars)}`,
      implEdges: [...implEdges],
      sccId: new Array(numLits).fill(-1),
      assignment: new Array(numVars).fill(null),
      highlightNodes: [neg(a), b, neg(b), a],
      numVars,
      isSatisfiable: null,
    });
  }

  // Run SCC
  steps.push({
    type: "scc_start",
    description: "含意グラフの強連結成分 (SCC) を計算",
    implEdges: [...implEdges],
    sccId: new Array(numLits).fill(-1),
    assignment: new Array(numVars).fill(null),
    highlightNodes: [],
    numVars,
    isSatisfiable: null,
  });

  const sccId = kosaraju(numLits, implEdges);

  steps.push({
    type: "scc_assign",
    description: `SCC計算完了。各リテラルのSCC番号: ${Array.from({ length: numLits }, (_, i) => `${litName(i, numVars)}=${sccId[i]}`).join(", ")}`,
    implEdges: [...implEdges],
    sccId: [...sccId],
    assignment: new Array(numVars).fill(null),
    highlightNodes: [],
    numVars,
    isSatisfiable: null,
  });

  // Check satisfiability
  let satisfiable = true;
  for (let i = 0; i < numVars; i++) {
    if (sccId[2 * i] === sccId[2 * i + 1]) {
      satisfiable = false;
      steps.push({
        type: "check_sat",
        description: `x${i} と !x${i} が同じSCCに属する (SCC ${sccId[2 * i]})。充足不能!`,
        implEdges: [...implEdges],
        sccId: [...sccId],
        assignment: new Array(numVars).fill(null),
        highlightNodes: [2 * i, 2 * i + 1],
        numVars,
        isSatisfiable: false,
      });
      break;
    }
  }

  if (satisfiable) {
    steps.push({
      type: "check_sat",
      description: "どの変数も x_i と !x_i が別のSCCに属する。充足可能!",
      implEdges: [...implEdges],
      sccId: [...sccId],
      assignment: new Array(numVars).fill(null),
      highlightNodes: [],
      numVars,
      isSatisfiable: true,
    });

    // Assign values
    const assignment: (boolean | null)[] = new Array(numVars).fill(null);
    for (let i = 0; i < numVars; i++) {
      // x_i is true iff scc(x_i) > scc(!x_i) in topological order
      // Kosaraju gives reverse topological order, so smaller scc id = later in topo order
      assignment[i] = sccId[2 * i] > sccId[2 * i + 1];
      steps.push({
        type: "assign_value",
        description: `x${i}: SCC(x${i})=${sccId[2 * i]}, SCC(!x${i})=${sccId[2 * i + 1]} → x${i} = ${assignment[i]}`,
        implEdges: [...implEdges],
        sccId: [...sccId],
        assignment: [...assignment],
        highlightNodes: [2 * i, 2 * i + 1],
        numVars,
        isSatisfiable: true,
      });
    }
  }

  steps.push({
    type: "done",
    description: satisfiable
      ? "完了: 充足可能な割り当てを発見"
      : "完了: 充足不能",
    implEdges: [...implEdges],
    sccId: [...sccId],
    assignment: satisfiable
      ? steps[steps.length - 1].assignment
      : new Array(numVars).fill(null),
    highlightNodes: [],
    numVars,
    isSatisfiable: satisfiable,
  });

  return steps;
}

// --- Node positions for implication graph ---

function getNodePositions(numVars: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  // Layout: positive literals on left, negative on right
  for (let i = 0; i < numVars; i++) {
    // x_i (positive)
    positions.push({
      x: 150,
      y: 60 + i * 100,
    });
    // !x_i (negative)
    positions.push({
      x: 400,
      y: 60 + i * 100,
    });
  }
  return positions;
}

// --- Component ---

export default function TwoSatAnimationPage() {
  const [instance] = useState(defaultInstance);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(
    (inst: { numVars: number; clauses: Clause[] }) => {
      setSteps(generateSteps(inst.numVars, inst.clauses));
      setCurrentStep(0);
      setIsPlaying(false);
    },
    []
  );

  useEffect(() => {
    run(instance);
  }, [instance, run]);

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

  const positions = getNodePositions(step.numVars);
  const numLits = step.numVars * 2;

  function getNodeFill(idx: number): string {
    if (step.highlightNodes.includes(idx)) {
      if (step.isSatisfiable === false) return "fill-red-200 stroke-red-500";
      return "fill-blue-100 stroke-blue-400";
    }
    if (step.sccId[idx] !== -1) {
      // Color by SCC id
      const colors = [
        "fill-emerald-100 stroke-emerald-500",
        "fill-amber-100 stroke-amber-400",
        "fill-purple-100 stroke-purple-400",
        "fill-red-100 stroke-red-400",
        "fill-blue-100 stroke-blue-400",
        "fill-orange-100 stroke-orange-400",
      ];
      return colors[step.sccId[idx] % colors.length];
    }
    return "fill-white stroke-gray-300";
  }

  const arrowSize = 8;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">2-SAT</h1>
        <p className="text-sm text-muted-foreground mb-6">
          含意グラフとSCCによる充足可能性判定
        </p>

        {/* Clauses */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            節
          </div>
          <div className="flex gap-2 flex-wrap">
            {instance.clauses.map((c, i) => (
              <span
                key={i}
                className="px-2 py-1 border border-border rounded text-sm font-mono"
              >
                ({litName(c.a, instance.numVars)} OR{" "}
                {litName(c.b, instance.numVars)})
              </span>
            ))}
          </div>
        </div>

        {/* Implication Graph SVG */}
        <div className="mb-6 flex justify-center">
          <svg
            width={550}
            height={60 + step.numVars * 100}
            className="border border-border rounded"
          >
            <defs>
              <marker
                id="impl-arrow"
                markerWidth={arrowSize}
                markerHeight={arrowSize}
                refX={arrowSize + 16}
                refY={arrowSize / 2}
                orient="auto"
              >
                <polygon
                  points={`0 0, ${arrowSize} ${arrowSize / 2}, 0 ${arrowSize}`}
                  className="fill-gray-400"
                />
              </marker>
            </defs>
            {/* Edges */}
            {step.implEdges.map(([u, v], i) => {
              if (u >= numLits || v >= numLits) return null;
              return (
                <line
                  key={`e-${i}`}
                  x1={positions[u].x}
                  y1={positions[u].y}
                  x2={positions[v].x}
                  y2={positions[v].y}
                  className="stroke-gray-300"
                  strokeWidth={1.5}
                  markerEnd="url(#impl-arrow)"
                />
              );
            })}
            {/* Nodes */}
            {Array.from({ length: numLits }, (_, idx) => (
              <g key={`n-${idx}`}>
                <circle
                  cx={positions[idx].x}
                  cy={positions[idx].y}
                  r={24}
                  className={getNodeFill(idx)}
                  strokeWidth={2}
                />
                <text
                  x={positions[idx].x}
                  y={positions[idx].y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-xs font-mono fill-foreground"
                >
                  {litName(idx, step.numVars)}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Variable assignment */}
        {step.assignment.some((a) => a !== null) && (
          <div className="mb-4">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              変数割り当て
            </div>
            <div className="flex gap-2">
              {step.assignment.map((val, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 border rounded text-sm font-mono ${
                    val === true
                      ? "bg-emerald-100 border-emerald-500"
                      : val === false
                        ? "bg-red-100 border-red-500"
                        : "bg-white border-gray-200"
                  }`}
                >
                  x{i} = {val === null ? "?" : val.toString()}
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
          {step.isSatisfiable !== null && (
            <span>
              結果:{" "}
              <span
                className={`font-semibold ${step.isSatisfiable ? "text-emerald-600" : "text-red-600"}`}
              >
                {step.isSatisfiable ? "充足可能" : "充足不能"}
              </span>
            </span>
          )}
        </div>

        {/* Description */}
        <div className="p-3 bg-muted border border-border rounded mb-6 min-h-[2.5rem] flex items-center">
          <p className="text-sm font-mono">{step.description}</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>注目リテラル</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>SCC (色分け)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500" />
            <span>衝突</span>
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
