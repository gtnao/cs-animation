import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="メビウス関数・反転公式" slug="sieve-of-eratosthenes" basePath="/sieve-of-eratosthenes">
      {children}
    </AlgorithmLayout>
  );
}
