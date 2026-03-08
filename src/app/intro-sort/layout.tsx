import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Intro Sort" slug="intro-sort" basePath="/intro-sort">
      {children}
    </AlgorithmLayout>
  );
}
