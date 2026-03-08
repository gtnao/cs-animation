import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="強連結成分分解 (Tarjan)" slug="scc-tarjan" basePath="/scc-tarjan">
      {children}
    </AlgorithmLayout>
  );
}
