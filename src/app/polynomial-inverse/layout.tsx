import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="多項式の逆元・除算" slug="polynomial-inverse" basePath="/polynomial-inverse">
      {children}
    </AlgorithmLayout>
  );
}
