import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="多項式の対数・指数" slug="polynomial-log-exp" basePath="/polynomial-log-exp">
      {children}
    </AlgorithmLayout>
  );
}
