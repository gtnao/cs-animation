import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Sparse Table" slug="sparse-table" basePath="/sparse-table">
      {children}
    </AlgorithmLayout>
  );
}
