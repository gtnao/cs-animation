import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="一般マッチング (Edmonds' Blossom)" slug="blossom" basePath="/blossom">
      {children}
    </AlgorithmLayout>
  );
}
