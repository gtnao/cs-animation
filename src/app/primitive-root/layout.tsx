import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Stern-Brocot Tree" slug="primitive-root" basePath="/primitive-root">
      {children}
    </AlgorithmLayout>
  );
}
