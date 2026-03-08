import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="B+木" slug="b-plus-tree" basePath="/b-plus-tree">
      {children}
    </AlgorithmLayout>
  );
}
