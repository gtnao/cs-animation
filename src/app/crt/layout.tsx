import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="線形篩" slug="crt" basePath="/crt">
      {children}
    </AlgorithmLayout>
  );
}
