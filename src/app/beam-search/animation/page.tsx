"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// --- Types ---

type StepType =
  | "init"
  | "expand"
  | "select"
  | "done";

interface BeamNode {
  path: number[];
  cost: number;
}

interface Step {
  type: StepType;
  depth: number;
  beamWidth: number;
  currentBeam: BeamNode[];
  candidates: BeamNode[];
  selectedBeam: BeamNode[];
  graph: number[][];
  description: string;
}

// --- Graph (weighted adjacency matrix) ---
// Small graph for visualization: 6 nodes, layer-by-layer structure

const DEFAULT_GRAPH: number[][] = [
  // node 0 -> costs to each node (0 = no edge)
  [0, 3, 7, 5, 0, 0],
  [0, 0, 0, 0, 4, 6],
  [0, 0, 0, 0, 2, 8],
  [0, 0, 0, 0, 5, 3],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
];

const NODE_LABELS = ["S", "A", "B", "C", "D", "E"];

// --- Algorithm step generation ---

function generateSteps(
  graph: number[][],
  beamWidth: number,
  start: number,
  goals: number[]
): Step[] {
  const steps: Step[] = [];
  const n = graph.length;

  let beam: BeamNode[] = [{ path: [start], cost: 0 }];

  steps.push({
    type: "init",
    depth: 0,
    beamWidth,
    currentBeam: [...beam],
    candidates: [],
    selectedBeam: [...beam],
    graph,
    description: `ビーム幅 ${beamWidth} でノード ${NODE_LABELS[start]} から探索開始`,
  });

  for (let depth = 0; depth < n && beam.length > 0; depth++) {
    // Expand all nodes in current beam
    const candidates: BeamNode[] = [];
    for (const node of beam) {
      const last = node.path[node.path.length - 1];
      if (goals.includes(last)) {
        candidates.push(node);
        continue;
      }
      for (let next = 0; next < n; next++) {
        if (graph[last][next] > 0 && !node.path.includes(next)) {
          candidates.push({
            path: [...node.path, next],
            cost: node.cost + graph[last][next],
          });
        }
      }
    }

    if (candidates.length === 0) break;

    steps.push({
      type: "expand",
      depth: depth + 1,
      beamWidth,
      currentBeam: [...beam],
      candidates: [...candidates],
      selectedBeam: [],
      graph,
      description: `深さ ${depth + 1}: ${beam.length} ノードを展開 → ${candidates.length} 候補`,
    });

    // Select top beamWidth candidates (lowest cost)
    candidates.sort((a, b) => a.cost - b.cost);
    const selected = candidates.slice(0, beamWidth);

    steps.push({
      type: "select",
      depth: depth + 1,
      beamWidth,
      currentBeam: [...beam],
      candidates: [...candidates],
      selectedBeam: [...selected],
      graph,
      description: `コスト順にビーム幅 ${beamWidth} 個を選択: ${selected.map((s) => `${NODE_LABELS[s.path[s.path.length - 1]]}(${s.cost})`).join(", ")}`,
    });

    beam = selected;

    // Check if any goal is reached
    const goalNode = beam.find((b) => goals.includes(b.path[b.path.length - 1]));
    if (goalNode) {
      steps.push({
        type: "done",
        depth: depth + 1,
        beamWidth,
        currentBeam: beam,
        candidates: [],
        selectedBeam: beam,
        graph,
        description: `ゴール ${NODE_LABELS[goalNode.path[goalNode.path.length - 1]]} に到達! パス: ${goalNode.path.map((p) => NODE_LABELS[p]).join(" → ")}, コスト: ${goalNode.cost}`,
      });
      return steps;
    }
  }

  const bestNode = beam.length > 0 ? beam[0] : null;
  steps.push({
    type: "done",
    depth: n,
    beamWidth,
    currentBeam: beam,
    candidates: [],
    selectedBeam: beam,
    graph,
    description: bestNode
      ? `探索完了。最良パス: ${bestNode.path.map((p) => NODE_LABELS[p]).join(" → ")}, コスト: ${bestNode.cost}`
      : "探索完了。パスが見つかりません",
  });

  return steps;
}

// --- Node styling ---

function getNodeClass(
  nodeIdx: number,
  step: Step
): string {
  const base =
    "w-12 h-12 rounded-full flex items-center justify-center border-2 text-sm font-mono font-bold transition-colors";

  // Check if node is in selected beam
  const inSelected = step.selectedBeam.some(
    (b) => b.path[b.path.length - 1] === nodeIdx
  );
  const inCurrent = step.currentBeam.some(
    (b) => b.path[b.path.length - 1] === nodeIdx
  );
  const inCandidates = step.candidates.some(
    (b) => b.path[b.path.length - 1] === nodeIdx
  );

  if (step.type === "done" && inSelected) {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

  if (step.type === "select" && inSelected) {
    return `${base} bg-emerald-100 border-emerald-500`;
  }

  if (step.type === "expand" && inCandidates) {
    return `${base} bg-amber-50 border-amber-400`;
  }

  if (inCurrent) {
    return `${base} bg-blue-100 border-blue-400`;
  }

  return `${base} bg-white border-gray-200`;
}

// --- Component ---

export default function BeamSearchAnimationPage() {
  const [beamWidthInput, setBeamWidthInput] = useState("2");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((bw: number) => {
    setSteps(generateSteps(DEFAULT_GRAPH, bw, 0, [4, 5]));
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, steps.length]);

  // Keyboard shortcuts
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

  const handleRun = () => {
    const bw = parseInt(beamWidthInput.trim(), 10);
    if (isNaN(bw) || bw < 1) return;
    run(bw);
  };

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <>
{/* Input */}
        <div className="flex gap-2 mb-8">
          <Input
            value={beamWidthInput}
            onChange={(e) => setBeamWidthInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRun();
            }}
            placeholder="ビーム幅"
            className="font-mono max-w-[120px]"
          />
          <Button onClick={handleRun} variant="outline">
            実行
          </Button>
        </div>

        {/* Graph nodes */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {"グラフ: S → {A, B, C} → {D, E}"}
          </div>
          <div className="flex items-center gap-8 justify-center py-4">
            {/* Layer 0: Start */}
            <div className="flex flex-col items-center gap-2">
              <div className={getNodeClass(0, step)}>{NODE_LABELS[0]}</div>
            </div>
            {/* Layer 1 */}
            <div className="flex flex-col items-center gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className={getNodeClass(i, step)}>
                  {NODE_LABELS[i]}
                </div>
              ))}
            </div>
            {/* Layer 2: Goals */}
            <div className="flex flex-col items-center gap-2">
              {[4, 5].map((i) => (
                <div key={i} className={getNodeClass(i, step)}>
                  {NODE_LABELS[i]}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current beam and candidates */}
        {step.candidates.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              候補 (コスト順)
            </div>
            <div className="flex flex-wrap gap-2">
              {step.candidates.map((c, i) => {
                const isSelected = i < step.beamWidth && step.type === "select";
                return (
                  <div
                    key={i}
                    className={`px-3 py-1.5 border rounded text-xs font-mono ${
                      isSelected
                        ? "bg-emerald-100 border-emerald-500"
                        : i >= step.beamWidth && step.type === "select"
                          ? "bg-red-100 border-red-500 line-through"
                          : "bg-amber-50 border-amber-400"
                    }`}
                  >
                    {c.path.map((p) => NODE_LABELS[p]).join("→")} (cost={c.cost})
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            ビーム幅 ={" "}
            <span className="font-mono font-semibold text-foreground">
              {step.beamWidth}
            </span>
          </span>
          <span>
            深さ ={" "}
            <span className="font-mono font-semibold text-foreground">
              {step.depth}
            </span>
          </span>
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400 rounded-full" />
            <span>現在のビーム</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400 rounded-full" />
            <span>展開候補</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500 rounded-full" />
            <span>選択されたノード</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 border-2 border-red-500 rounded-full" />
            <span>棄却</span>
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
              setCurrentStep((prev) =>
                Math.min(steps.length - 1, prev + 1)
              );
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
