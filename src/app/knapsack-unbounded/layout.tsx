import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="ナップサック問題 (個数無制限)" slug="knapsack-unbounded" basePath="/knapsack-unbounded">
      {children}
    </AlgorithmLayout>
  );
}
