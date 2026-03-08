import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Suffix Array" slug="suffix-array" basePath="/suffix-array">
      {children}
    </AlgorithmLayout>
  );
}
