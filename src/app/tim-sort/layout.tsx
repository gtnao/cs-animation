import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Tim Sort" slug="tim-sort" basePath="/tim-sort">
      {children}
    </AlgorithmLayout>
  );
}
