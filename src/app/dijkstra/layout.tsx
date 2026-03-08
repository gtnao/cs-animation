import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Dijkstra法" slug="dijkstra" basePath="/dijkstra">
      {children}
    </AlgorithmLayout>
  );
}
