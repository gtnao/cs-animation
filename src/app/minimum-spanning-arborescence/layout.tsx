import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="最小全域有向木" slug="minimum-spanning-arborescence" basePath="/minimum-spanning-arborescence">
      {children}
    </AlgorithmLayout>
  );
}
