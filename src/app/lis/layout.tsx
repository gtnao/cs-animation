import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="最長増加部分列 (LIS)" slug="lis" basePath="/lis">
      {children}
    </AlgorithmLayout>
  );
}
