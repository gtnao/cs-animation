import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Parallel Binary Search" slug="parallel-binary-search" basePath="/parallel-binary-search">
      {children}
    </AlgorithmLayout>
  );
}
