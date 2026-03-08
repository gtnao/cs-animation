import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Monge性とSMAWK" slug="monge-smawk" basePath="/monge-smawk">
      {children}
    </AlgorithmLayout>
  );
}
