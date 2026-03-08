import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="二部グラフ判定" slug="bipartite-check" basePath="/bipartite-check">
      {children}
    </AlgorithmLayout>
  );
}
