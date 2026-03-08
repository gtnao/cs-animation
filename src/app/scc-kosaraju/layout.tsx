import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="強連結成分分解 (Kosaraju)" slug="scc-kosaraju" basePath="/scc-kosaraju">
      {children}
    </AlgorithmLayout>
  );
}
