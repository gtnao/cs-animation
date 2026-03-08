import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Aho-Corasick法" slug="aho-corasick" basePath="/aho-corasick">
      {children}
    </AlgorithmLayout>
  );
}
