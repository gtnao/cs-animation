import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="オイラーのφ関数" slug="linear-sieve" basePath="/linear-sieve">
      {children}
    </AlgorithmLayout>
  );
}
