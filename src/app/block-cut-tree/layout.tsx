import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Block Cut Tree" slug="block-cut-tree" basePath="/block-cut-tree">
      {children}
    </AlgorithmLayout>
  );
}
