import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Skip List" slug="skip-list" basePath="/skip-list">
      {children}
    </AlgorithmLayout>
  );
}
