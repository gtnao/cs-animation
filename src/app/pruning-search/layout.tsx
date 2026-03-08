import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="枝刈り全探索" slug="pruning-search" basePath="/pruning-search">
      {children}
    </AlgorithmLayout>
  );
}
