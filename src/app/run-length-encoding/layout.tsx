import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="ランレングス圧縮" slug="run-length-encoding" basePath="/run-length-encoding">
      {children}
    </AlgorithmLayout>
  );
}
