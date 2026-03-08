import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="点の内包判定" slug="point-in-polygon" basePath="/point-in-polygon">
      {children}
    </AlgorithmLayout>
  );
}
