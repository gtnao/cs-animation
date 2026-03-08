import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Counting Sort" slug="counting-sort" basePath="/counting-sort">
      {children}
    </AlgorithmLayout>
  );
}
