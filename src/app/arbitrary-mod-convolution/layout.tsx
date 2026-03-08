import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="任意modでの畳み込み" slug="arbitrary-mod-convolution" basePath="/arbitrary-mod-convolution">
      {children}
    </AlgorithmLayout>
  );
}
