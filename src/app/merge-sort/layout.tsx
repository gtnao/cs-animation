import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Merge Sort" slug="merge-sort" basePath="/merge-sort">
      {children}
    </AlgorithmLayout>
  );
}
