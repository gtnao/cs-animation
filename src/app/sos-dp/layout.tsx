import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="SOS DP (Sum over Subsets)" slug="sos-dp" basePath="/sos-dp">
      {children}
    </AlgorithmLayout>
  );
}
