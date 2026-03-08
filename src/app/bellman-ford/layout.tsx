import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Bellman-Ford法" slug="bellman-ford" basePath="/bellman-ford">
      {children}
    </AlgorithmLayout>
  );
}
