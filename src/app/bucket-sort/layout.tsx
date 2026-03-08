import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Bucket Sort" slug="bucket-sort" basePath="/bucket-sort">
      {children}
    </AlgorithmLayout>
  );
}
