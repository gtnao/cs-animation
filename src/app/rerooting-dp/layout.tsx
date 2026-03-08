import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="全方位木DP (Rerooting)" slug="rerooting-dp" basePath="/rerooting-dp">
      {children}
    </AlgorithmLayout>
  );
}
