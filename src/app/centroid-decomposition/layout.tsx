import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="重心分解" slug="centroid-decomposition" basePath="/centroid-decomposition">
      {children}
    </AlgorithmLayout>
  );
}
