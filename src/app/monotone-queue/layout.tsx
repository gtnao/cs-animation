import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="Monotone Queue" slug="monotone-queue" basePath="/monotone-queue">
      {children}
    </AlgorithmLayout>
  );
}
