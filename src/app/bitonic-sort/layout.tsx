import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Bitonic Sort" slug="bitonic-sort" basePath="/bitonic-sort">
      {children}
    </AlgorithmLayout>
  );
}
