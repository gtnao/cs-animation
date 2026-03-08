import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="木上のパスクエリ" slug="tree-path-query" basePath="/tree-path-query">
      {children}
    </AlgorithmLayout>
  );
}
