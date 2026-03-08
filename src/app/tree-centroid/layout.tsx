import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="木の重心" slug="tree-centroid" basePath="/tree-centroid">
      {children}
    </AlgorithmLayout>
  );
}
