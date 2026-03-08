import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Bloom Filter" slug="bloom-filter" basePath="/bloom-filter">
      {children}
    </AlgorithmLayout>
  );
}
