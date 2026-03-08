import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Leftist Heap" slug="leftist-heap" basePath="/leftist-heap">
      {children}
    </AlgorithmLayout>
  );
}
