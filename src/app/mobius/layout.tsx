import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="高速べき乗 (繰り返し二乗法)" slug="mobius" basePath="/mobius">
      {children}
    </AlgorithmLayout>
  );
}
