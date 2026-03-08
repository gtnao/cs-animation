import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="ビームサーチ" slug="beam-search" basePath="/beam-search">
      {children}
    </AlgorithmLayout>
  );
}
