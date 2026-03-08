import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="ドロネー三角形分割" slug="delaunay" basePath="/delaunay">
      {children}
    </AlgorithmLayout>
  );
}
