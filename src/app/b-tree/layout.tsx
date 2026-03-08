import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="B木" slug="b-tree" basePath="/b-tree">
      {children}
    </AlgorithmLayout>
  );
}
