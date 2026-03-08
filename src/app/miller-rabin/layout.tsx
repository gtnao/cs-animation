import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="原始根" slug="miller-rabin" basePath="/miller-rabin">
      {children}
    </AlgorithmLayout>
  );
}
