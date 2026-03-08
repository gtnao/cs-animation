import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Gomory-Hu Tree" slug="gomory-hu" basePath="/gomory-hu">
      {children}
    </AlgorithmLayout>
  );
}
