import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Divide & Conquer Optimization" slug="dnc-optimization" basePath="/dnc-optimization">
      {children}
    </AlgorithmLayout>
  );
}
