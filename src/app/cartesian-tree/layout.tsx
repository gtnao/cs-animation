import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Cartesian Tree" slug="cartesian-tree" basePath="/cartesian-tree">
      {children}
    </AlgorithmLayout>
  );
}
