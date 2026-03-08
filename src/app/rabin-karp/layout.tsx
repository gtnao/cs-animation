import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Rabin-Karp法" slug="rabin-karp" basePath="/rabin-karp">
      {children}
    </AlgorithmLayout>
  );
}
