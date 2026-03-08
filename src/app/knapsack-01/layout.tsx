import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="ナップサック問題 (0-1)" slug="knapsack-01" basePath="/knapsack-01">
      {children}
    </AlgorithmLayout>
  );
}
