import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="NTT (数論変換)" slug="ntt" basePath="/ntt">
      {children}
    </AlgorithmLayout>
  );
}
