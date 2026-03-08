import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="重み付き Union-Find" slug="weighted-union-find" basePath="/weighted-union-find">
      {children}
    </AlgorithmLayout>
  );
}
