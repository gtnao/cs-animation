import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="包除原理" slug="inclusion-exclusion" basePath="/inclusion-exclusion">
      {children}
    </AlgorithmLayout>
  );
}
