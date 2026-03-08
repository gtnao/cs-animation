import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="双方向BFS" slug="bidirectional-bfs" basePath="/bidirectional-bfs">
      {children}
    </AlgorithmLayout>
  );
}
