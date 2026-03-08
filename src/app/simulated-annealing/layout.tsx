import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="焼きなまし法" slug="simulated-annealing" basePath="/simulated-annealing">
      {children}
    </AlgorithmLayout>
  );
}
