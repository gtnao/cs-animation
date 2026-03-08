import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="最小共通祖先 (LCA) - ダブリング" slug="lca-doubling" basePath="/lca-doubling">
      {children}
    </AlgorithmLayout>
  );
}
