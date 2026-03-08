import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Burrows-Wheeler Transform" slug="bwt" basePath="/bwt">
      {children}
    </AlgorithmLayout>
  );
}
