import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Quick Sort" slug="quick-sort" basePath="/quick-sort">
      {children}
    </AlgorithmLayout>
  );
}
