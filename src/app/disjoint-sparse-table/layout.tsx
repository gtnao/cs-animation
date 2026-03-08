import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Disjoint Sparse Table" slug="disjoint-sparse-table" basePath="/disjoint-sparse-table">
      {children}
    </AlgorithmLayout>
  );
}
