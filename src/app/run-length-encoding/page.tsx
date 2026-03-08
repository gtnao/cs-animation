import Link from "next/link";

export default function RunLengthEncodingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-2">ランレングス圧縮</h1>
        <p className="text-sm text-muted-foreground mb-8">
          連続する同一要素をその値と出現回数のペアに置き換えるデータ圧縮手法
        </p>
        <div className="space-y-2">
          <Link
            href="/run-length-encoding/animation"
            className="block p-4 border border-border rounded hover:bg-accent transition-colors"
          >
            <h2 className="font-semibold">アニメーション</h2>
            <p className="text-sm text-muted-foreground">
              ステップ実行でアルゴリズムの動作を可視化
            </p>
          </Link>
          <Link
            href="/run-length-encoding/article"
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
