import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="マージテク (Small to Large)" slug="small-to-large" basePath="/small-to-large">
      {children}
    </AlgorithmLayout>
  );
}
