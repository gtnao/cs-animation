import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Selection Sort" slug="selection-sort" basePath="/selection-sort">
      {children}
    </AlgorithmLayout>
  );
}
