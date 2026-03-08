import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Li Chao Tree" slug="li-chao-tree" basePath="/li-chao-tree">
      {children}
    </AlgorithmLayout>
  );
}
