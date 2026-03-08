import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Hadamard変換 (XOR畳み込み)" slug="hadamard-transform" basePath="/hadamard-transform">
      {children}
    </AlgorithmLayout>
  );
}
