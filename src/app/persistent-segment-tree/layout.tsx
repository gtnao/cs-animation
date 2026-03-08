import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="永続セグメント木" slug="persistent-segment-tree" basePath="/persistent-segment-tree">
      {children}
    </AlgorithmLayout>
  );
}
