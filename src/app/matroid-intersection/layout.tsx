import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Matroid Intersection" slug="matroid-intersection" basePath="/matroid-intersection">
      {children}
    </AlgorithmLayout>
  );
}
