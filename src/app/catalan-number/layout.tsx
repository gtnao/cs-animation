import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="カタラン数" slug="catalan-number" basePath="/catalan-number">
      {children}
    </AlgorithmLayout>
  );
}
