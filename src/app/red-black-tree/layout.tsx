import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="赤黒木" slug="red-black-tree" basePath="/red-black-tree">
      {children}
    </AlgorithmLayout>
  );
}
