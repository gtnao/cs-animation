import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="最小費用流 (Primal-Dual)" slug="min-cost-flow" basePath="/min-cost-flow">
      {children}
    </AlgorithmLayout>
  );
}
