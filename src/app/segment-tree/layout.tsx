import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="セグメント木" slug="segment-tree" basePath="/segment-tree">
      {children}
    </AlgorithmLayout>
  );
}
