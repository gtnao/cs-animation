import "katex/dist/katex.min.css";
import { AlgorithmLayout } from "@/components/algorithm-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AlgorithmLayout title="連結性DP (Profile DP)" slug="profile-dp" basePath="/profile-dp">
      {children}
    </AlgorithmLayout>
  );
}
