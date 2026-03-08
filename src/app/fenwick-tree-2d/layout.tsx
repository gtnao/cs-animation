import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="2次元BIT" slug="fenwick-tree-2d" basePath="/fenwick-tree-2d">
      {children}
    </AlgorithmLayout>
  );
}
