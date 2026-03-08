import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="DFS" slug="dfs" basePath="/dfs">
      {children}
    </AlgorithmLayout>
  );
}
