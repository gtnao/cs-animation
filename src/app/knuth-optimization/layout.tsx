import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Knuth's Optimization" slug="knuth-optimization" basePath="/knuth-optimization">
      {children}
    </AlgorithmLayout>
  );
}
