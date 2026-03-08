import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="ラグランジュ補間" slug="lagrange-interpolation" basePath="/lagrange-interpolation">
      {children}
    </AlgorithmLayout>
  );
}
