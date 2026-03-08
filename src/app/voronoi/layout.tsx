import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="ボロノイ図" slug="voronoi" basePath="/voronoi">
      {children}
    </AlgorithmLayout>
  );
}
