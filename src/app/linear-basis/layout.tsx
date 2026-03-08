import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="線形基底 (XOR Basis)" slug="linear-basis" basePath="/linear-basis">
      {children}
    </AlgorithmLayout>
  );
}
