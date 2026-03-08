import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="最大フロー (Push-Relabel)" slug="push-relabel" basePath="/push-relabel">
      {children}
    </AlgorithmLayout>
  );
}
