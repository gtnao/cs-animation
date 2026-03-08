import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="二項係数 (mod p)" slug="binomial-coefficient" basePath="/binomial-coefficient">
      {children}
    </AlgorithmLayout>
  );
}
