import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="高速ゼータ変換 / メビウス変換" slug="zeta-mobius-transform" basePath="/zeta-mobius-transform">
      {children}
    </AlgorithmLayout>
  );
}
