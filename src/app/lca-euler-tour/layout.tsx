import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="最小共通祖先 (LCA) - Euler Tour" slug="lca-euler-tour" basePath="/lca-euler-tour">
      {children}
    </AlgorithmLayout>
  );
}
