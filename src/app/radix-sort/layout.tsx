import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Radix Sort" slug="radix-sort" basePath="/radix-sort">
      {children}
    </AlgorithmLayout>
  );
}
