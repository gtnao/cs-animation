import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Minimum Rotation (Booth)" slug="booth" basePath="/booth">
      {children}
    </AlgorithmLayout>
  );
}
