import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="グラフ彩色" slug="graph-coloring" basePath="/graph-coloring">
      {children}
    </AlgorithmLayout>
  );
}
