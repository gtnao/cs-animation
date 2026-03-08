import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="ガウスの消去法" slug="gaussian-elimination" basePath="/gaussian-elimination">
      {children}
    </AlgorithmLayout>
  );
}
