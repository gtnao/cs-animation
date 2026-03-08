import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Grundy数 (Sprague-Grundy定理)" slug="sprague-grundy" basePath="/sprague-grundy">
      {children}
    </AlgorithmLayout>
  );
}
