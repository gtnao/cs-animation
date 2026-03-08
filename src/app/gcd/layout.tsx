import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="中国剰余定理 (CRT)" slug="gcd" basePath="/gcd">
      {children}
    </AlgorithmLayout>
  );
}
