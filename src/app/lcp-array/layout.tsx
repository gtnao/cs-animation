import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="LCP Array (Kasai)" slug="lcp-array" basePath="/lcp-array">
      {children}
    </AlgorithmLayout>
  );
}
