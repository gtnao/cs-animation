import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="0-1 BFS" slug="01-bfs" basePath="/01-bfs">
      {children}
    </AlgorithmLayout>
  );
}
