import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">CS Animation</h1>
        <p className="text-muted-foreground mb-8">
          アルゴリズムをインタラクティブに学ぶ
        </p>
        <div className="space-y-2">
          <Link
            href="/z-algorithm"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">Z-Algorithm</h2>
            <p className="text-sm text-muted-foreground">
              文字列の各位置における最長共通接頭辞の長さを求める
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
