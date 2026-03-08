import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Link-Cut Tree" slug="link-cut-tree" basePath="/link-cut-tree">
      {children}
    </AlgorithmLayout>
  );
}
