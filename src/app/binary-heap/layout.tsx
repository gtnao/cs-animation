import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Priority Queue (Binary Heap)" slug="binary-heap" basePath="/binary-heap">
      {children}
    </AlgorithmLayout>
  );
}
