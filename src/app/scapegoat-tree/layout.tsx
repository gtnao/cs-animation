import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Scapegoat木" slug="scapegoat-tree" basePath="/scapegoat-tree">
      {children}
    </AlgorithmLayout>
  );
}
