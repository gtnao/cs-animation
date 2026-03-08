import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Matroid (マトロイド)" slug="matroid" basePath="/matroid">
      {children}
    </AlgorithmLayout>
  );
}
