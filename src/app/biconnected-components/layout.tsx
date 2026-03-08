import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="二重頂点連結成分分解" slug="biconnected-components" basePath="/biconnected-components">
      {children}
    </AlgorithmLayout>
  );
}
