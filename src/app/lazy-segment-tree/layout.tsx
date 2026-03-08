import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="遅延評価セグメント木" slug="lazy-segment-tree" basePath="/lazy-segment-tree">
      {children}
    </AlgorithmLayout>
  );
}
