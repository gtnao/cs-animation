import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="木の直径" slug="tree-diameter" basePath="/tree-diameter">
      {children}
    </AlgorithmLayout>
  );
}
