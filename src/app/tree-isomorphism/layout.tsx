import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="木の同型判定" slug="tree-isomorphism" basePath="/tree-isomorphism">
      {children}
    </AlgorithmLayout>
  );
}
