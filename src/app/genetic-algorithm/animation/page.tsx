"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

// --- Types ---

type StepType =
  | "init"
  | "evaluate"
  | "select"
  | "crossover"
  | "mutate"
  | "new_generation"
  | "done";

interface Individual {
  genes: number[];
  fitness: number;
}

interface Step {
  type: StepType;
  generation: number;
  population: Individual[];
  bestIndividual: Individual;
  bestFitness: number;
  parent1?: Individual;
  parent2?: Individual;
  child?: Individual;
  description: string;
}

// --- Fitness function ---
// Maximize: count of 1s in binary string (OneMax problem)

function fitness(genes: number[]): number {
  return genes.reduce((sum, g) => sum + g, 0);
}

// --- Pseudo-random ---

function createRng(seed: number) {
  let s = seed;
  return function random(): number {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// --- Algorithm step generation ---

function generateSteps(
  geneLength: number,
  popSize: number,
  maxGen: number,
  mutationRate: number
): Step[] {
  const steps: Step[] = [];
  const rng = createRng(123);

  // Initialize population
  let population: Individual[] = [];
  for (let i = 0; i < popSize; i++) {
    const genes = Array.from({ length: geneLength }, () =>
      rng() < 0.5 ? 1 : 0
    );
    population.push({ genes, fitness: fitness(genes) });
  }

  let bestIndividual = population.reduce((best, ind) =>
    ind.fitness > best.fitness ? ind : best
  );

  steps.push({
    type: "init",
    generation: 0,
    population: population.map((p) => ({ ...p, genes: [...p.genes] })),
    bestIndividual: { ...bestIndividual, genes: [...bestIndividual.genes] },
    bestFitness: bestIndividual.fitness,
    description: `初期集団を生成: ${popSize} 個体, 遺伝子長 ${geneLength}。最良適応度 = ${bestIndividual.fitness}/${geneLength}`,
  });

  for (let gen = 1; gen <= maxGen; gen++) {
    // Evaluate
    steps.push({
      type: "evaluate",
      generation: gen,
      population: population.map((p) => ({ ...p, genes: [...p.genes] })),
      bestIndividual: { ...bestIndividual, genes: [...bestIndividual.genes] },
      bestFitness: bestIndividual.fitness,
      description: `第 ${gen} 世代: 適応度評価。平均 = ${(population.reduce((s, p) => s + p.fitness, 0) / popSize).toFixed(1)}, 最良 = ${bestIndividual.fitness}`,
    });

    // Selection (tournament selection)
    const newPop: Individual[] = [];

    for (let i = 0; i < popSize; i += 2) {
      // Select parents via tournament
      const selectParent = (): Individual => {
        const a = Math.floor(rng() * popSize);
        const b = Math.floor(rng() * popSize);
        return population[a].fitness >= population[b].fitness
          ? population[a]
          : population[b];
      };

      const parent1 = selectParent();
      const parent2 = selectParent();

      if (i === 0) {
        steps.push({
          type: "select",
          generation: gen,
          population: population.map((p) => ({ ...p, genes: [...p.genes] })),
          bestIndividual: { ...bestIndividual, genes: [...bestIndividual.genes] },
          bestFitness: bestIndividual.fitness,
          parent1: { ...parent1, genes: [...parent1.genes] },
          parent2: { ...parent2, genes: [...parent2.genes] },
          description: `選択: 親1 (適応度=${parent1.fitness}), 親2 (適応度=${parent2.fitness})`,
        });
      }

      // Crossover (single-point)
      const crossPoint = Math.floor(rng() * geneLength);
      const child1Genes = [
        ...parent1.genes.slice(0, crossPoint),
        ...parent2.genes.slice(crossPoint),
      ];
      const child2Genes = [
        ...parent2.genes.slice(0, crossPoint),
        ...parent1.genes.slice(crossPoint),
      ];

      if (i === 0) {
        steps.push({
          type: "crossover",
          generation: gen,
          population: population.map((p) => ({ ...p, genes: [...p.genes] })),
          bestIndividual: { ...bestIndividual, genes: [...bestIndividual.genes] },
          bestFitness: bestIndividual.fitness,
          parent1: { ...parent1, genes: [...parent1.genes] },
          parent2: { ...parent2, genes: [...parent2.genes] },
          child: { genes: [...child1Genes], fitness: fitness(child1Genes) },
          description: `交叉 (位置=${crossPoint}): [${parent1.genes.slice(0, crossPoint).join("")}|${parent2.genes.slice(crossPoint).join("")}] → 子 (適応度=${fitness(child1Genes)})`,
        });
      }

      // Mutation
      for (let j = 0; j < geneLength; j++) {
        if (rng() < mutationRate) child1Genes[j] = 1 - child1Genes[j];
        if (rng() < mutationRate) child2Genes[j] = 1 - child2Genes[j];
      }

      newPop.push({ genes: child1Genes, fitness: fitness(child1Genes) });
      if (newPop.length < popSize) {
        newPop.push({ genes: child2Genes, fitness: fitness(child2Genes) });
      }
    }

    // Elitism: keep best
    const worstIdx = newPop.reduce(
      (minIdx, ind, idx) =>
        ind.fitness < newPop[minIdx].fitness ? idx : minIdx,
      0
    );
    newPop[worstIdx] = { ...bestIndividual, genes: [...bestIndividual.genes] };

    population = newPop;

    // Update best
    for (const ind of population) {
      if (ind.fitness > bestIndividual.fitness) {
        bestIndividual = { ...ind, genes: [...ind.genes] };
      }
    }

    steps.push({
      type: "new_generation",
      generation: gen,
      population: population.map((p) => ({ ...p, genes: [...p.genes] })),
      bestIndividual: { ...bestIndividual, genes: [...bestIndividual.genes] },
      bestFitness: bestIndividual.fitness,
      description: `第 ${gen} 世代完了。最良適応度 = ${bestIndividual.fitness}/${geneLength}`,
    });

    if (bestIndividual.fitness === geneLength) {
      steps.push({
        type: "done",
        generation: gen,
        population: population.map((p) => ({ ...p, genes: [...p.genes] })),
        bestIndividual: { ...bestIndividual, genes: [...bestIndividual.genes] },
        bestFitness: bestIndividual.fitness,
        description: `最適解発見! 全遺伝子が 1 (世代 ${gen})`,
      });
      return steps;
    }
  }

  steps.push({
    type: "done",
    generation: maxGen,
    population: population.map((p) => ({ ...p, genes: [...p.genes] })),
    bestIndividual: { ...bestIndividual, genes: [...bestIndividual.genes] },
    bestFitness: bestIndividual.fitness,
    description: `探索完了 (${maxGen} 世代)。最良適応度 = ${bestIndividual.fitness}/${geneLength}`,
  });

  return steps;
}

// --- Gene cell styling ---

function getGeneCellClass(value: number, isBest: boolean): string {
  const base =
    "w-6 h-6 flex items-center justify-center border text-[10px] font-mono transition-colors";

  if (isBest && value === 1) {
    return `${base} bg-emerald-100 border-emerald-500 font-bold`;
  }
  if (value === 1) {
    return `${base} bg-blue-100 border-blue-400`;
  }
  return `${base} bg-white border-gray-200 text-muted-foreground`;
}

// --- Component ---

const GENE_LENGTH = 10;
const POP_SIZE = 8;
const MAX_GEN = 20;
const MUTATION_RATE = 0.05;

export default function GeneticAlgorithmAnimationPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(() => {
    setSteps(
      generateSteps(GENE_LENGTH, POP_SIZE, MAX_GEN, MUTATION_RATE)
    );
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    run();
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
    }, 800);
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

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <>
{/* Population */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            集団 (個体数 {POP_SIZE}, 遺伝子長 {GENE_LENGTH})
          </div>
          <div className="space-y-1">
            {step.population.map((ind, i) => {
              const isBest =
                ind.genes.join("") === step.bestIndividual.genes.join("");
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 text-[10px] text-muted-foreground font-mono text-right">
                    {i}:
                  </div>
                  <div className="flex gap-px">
                    {ind.genes.map((g, j) => (
                      <div key={j} className={getGeneCellClass(g, isBest)}>
                        {g}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    f={ind.fitness}
                  </div>
                  {isBest && (
                    <div className="text-xs text-emerald-600 font-semibold">
                      best
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Parents and child for crossover/select steps */}
        {(step.type === "select" || step.type === "crossover") &&
          step.parent1 &&
          step.parent2 && (
            <div className="mb-6 p-3 bg-muted border border-border rounded">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {step.type === "select" ? "選択された親" : "交叉"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8">親1:</span>
                  <div className="flex gap-px">
                    {step.parent1.genes.map((g, j) => (
                      <div
                        key={j}
                        className="w-6 h-6 flex items-center justify-center border text-[10px] font-mono bg-amber-50 border-amber-400"
                      >
                        {g}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-mono">f={step.parent1.fitness}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8">親2:</span>
                  <div className="flex gap-px">
                    {step.parent2.genes.map((g, j) => (
                      <div
                        key={j}
                        className="w-6 h-6 flex items-center justify-center border text-[10px] font-mono bg-amber-50 border-amber-400"
                      >
                        {g}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-mono">f={step.parent2.fitness}</span>
                </div>
                {step.child && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-8">子:</span>
                    <div className="flex gap-px">
                      {step.child.genes.map((g, j) => (
                        <div
                          key={j}
                          className="w-6 h-6 flex items-center justify-center border text-[10px] font-mono bg-blue-100 border-blue-400"
                        >
                          {g}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs font-mono">f={step.child.fitness}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Best individual */}
        <div className="mb-6">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            最良個体
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-px">
              {step.bestIndividual.genes.map((g, j) => (
                <div
                  key={j}
                  className={`w-6 h-6 flex items-center justify-center border text-[10px] font-mono font-bold ${
                    g === 1
                      ? "bg-emerald-100 border-emerald-500"
                      : "bg-red-100 border-red-500"
                  }`}
                >
                  {g}
                </div>
              ))}
            </div>
            <span className="text-sm font-mono font-semibold">
              適応度 = {step.bestFitness}/{GENE_LENGTH}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-6 text-sm text-muted-foreground mb-3">
          <span>
            世代 ={" "}
            <span className="font-mono font-semibold text-foreground">
              {step.generation}
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
            <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-blue-400" />
            <span>遺伝子 = 1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white border-2 border-gray-200" />
            <span>遺伝子 = 0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-100 border-2 border-emerald-500" />
            <span>最良個体</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-50 border-2 border-amber-400" />
            <span>親</span>
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
              run();
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
