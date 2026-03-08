import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="ミンコフスキー和" slug="minkowski-sum" basePath="/minkowski-sum">
      {children}
    </AlgorithmLayout>
  );
}
