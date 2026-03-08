import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="線分交差判定" slug="segment-intersection" basePath="/segment-intersection">
      {children}
    </AlgorithmLayout>
  );
}
