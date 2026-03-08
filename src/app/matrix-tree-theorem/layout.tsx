import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="行列木定理 (Kirchhoff)" slug="matrix-tree-theorem" basePath="/matrix-tree-theorem">
      {children}
    </AlgorithmLayout>
  );
}
