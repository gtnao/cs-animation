import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Count-Min Sketch" slug="count-min-sketch" basePath="/count-min-sketch">
      {children}
    </AlgorithmLayout>
  );
}
