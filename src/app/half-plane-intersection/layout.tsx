import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="半平面交差" slug="half-plane-intersection" basePath="/half-plane-intersection">
      {children}
    </AlgorithmLayout>
  );
}
