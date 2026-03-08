import Link from "next/link";

export default function WaveletTreePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-2">Wavelet Tree</h1>
        <p className="text-sm text-muted-foreground mb-8">
          数列に対する多様なクエリを効率的に処理するデータ構造
        </p>
        <div className="space-y-2">
          <Link
            href="/wavelet-tree/animation"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">アニメーション</h2>
            <p className="text-sm text-muted-foreground">
              ステップ実行でアルゴリズムの動作を可視化
            </p>
          </Link>
          <Link
            href="/wavelet-tree/article"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">解説記事</h2>
            <p className="text-sm text-muted-foreground">
              アルゴリズムの原理と正当性を詳しく解説
            </p>
          </Link>
        </div>
        <div className="mt-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
