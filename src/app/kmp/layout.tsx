import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="KMP法" slug="kmp" basePath="/kmp">
      {children}
    </AlgorithmLayout>
  );
}
