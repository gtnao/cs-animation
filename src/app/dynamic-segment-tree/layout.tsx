import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="動的セグメント木" slug="dynamic-segment-tree" basePath="/dynamic-segment-tree">
      {children}
    </AlgorithmLayout>
  );
}
