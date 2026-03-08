import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Johnson's Algorithm" slug="johnson" basePath="/johnson">
      {children}
    </AlgorithmLayout>
  );
}
