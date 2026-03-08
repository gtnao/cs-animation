import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Run Length Encoding" slug="rle" basePath="/rle">
      {children}
    </AlgorithmLayout>
  );
}
