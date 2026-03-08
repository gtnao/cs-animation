import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="BIT (Fenwick Tree)" slug="fenwick-tree" basePath="/fenwick-tree">
      {children}
    </AlgorithmLayout>
  );
}
