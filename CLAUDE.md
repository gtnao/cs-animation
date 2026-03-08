# CS Animation

アルゴリズムをインタラクティブに可視化・解説するサイト。

## 技術スタック

- Next.js 16 (App Router, `output: "export"` で静的書き出し)
- React 19, TypeScript
- Tailwind CSS v4, shadcn/ui
- GitHub Pages にデプロイ (`basePath: /cs-animation`)

## デザイン方針

- フラットデザイン。グラデーションや過度な装飾は使わない
- shadcn/ui のコンポーネントを活用する
- アニメーションページのセル色分け規則:
  - 青 (`bg-blue-100 border-blue-400`): 現在のインデックス
  - 琥珀 (`bg-amber-50 border-amber-400`): 注目区間
  - 緑 (`bg-emerald-100 border-emerald-500`): 一致
  - 赤 (`bg-red-100 border-red-500`): 不一致
  - 白 (`bg-white border-gray-200`): デフォルト

## プロジェクト構造

```
src/
  app/
    page.tsx                            # トップページ（アルゴリズム一覧）
    <algorithm>/
      page.tsx                          # ハブページ（アニメーション・記事への導線）
      animation/page.tsx                # インタラクティブ可視化（"use client"）
      article/page.tsx                  # 解説記事（Server Component）
      article/layout.tsx                # KaTeX CSS の import
  components/
    ui/                                 # shadcn/ui コンポーネント
    article/
      article-renderer.tsx              # 記事 HTML レンダラー（"use client"、Mermaid 後処理）
      mermaid-diagram.tsx               # Mermaid 図レンダラー（"use client"）
  content/
    <algorithm>/article.md              # 解説記事の Markdown ソース
  lib/
    markdown.ts                         # unified パイプライン（remark/rehype）
    utils.ts                            # shadcn ユーティリティ
```

## 新しいアルゴリズムを追加する手順

1. `src/content/<name>/article.md` に解説記事を書く（frontmatter に `title` を設定）
2. `src/app/<name>/page.tsx` にハブページを作る（z-algorithm/page.tsx をテンプレートにする）
3. `src/app/<name>/animation/page.tsx` にアニメーションページを作る（"use client"）
4. `src/app/<name>/article/page.tsx` に記事ページを作る（`renderMarkdown` + `ArticleRenderer`）
5. `src/app/<name>/article/layout.tsx` に KaTeX CSS の import を追加する
6. `src/app/page.tsx` のトップページにリンクを追加する

## アニメーションページの設計パターン

- `"use client"` で作成
- `Step` 型でアルゴリズムの各ステップを記録し、配列として保持
- `generateSteps(input)` でステップ配列を生成
- ユーザーが前へ/次へ/再生/リセットでステップを操作
- 矢印キーとスペースキーのキーボードショートカットに対応
- 凡例（Legend）で色の意味を表示

## 解説記事の書き方

- Markdown 形式。`src/lib/markdown.ts` の unified パイプラインで HTML に変換される
- 使える機能:
  - GFM（テーブル、タスクリスト等）
  - インライン数式: `$...$`、ブロック数式: `$$...$$`（KaTeX）
  - コードブロック: ` ```lang title="filename" ` で Shiki シンタックスハイライト
  - Mermaid 図: ` ```mermaid ` コードブロック
- **注意**: 数式の直後に全角括弧 `（）` を置かない（KaTeX 警告が出る）。半角 `()` を使い、前にスペースを入れる
- 記事は厳密な定義・証明と直感的な説明の両方を含める

## コマンド

- `npm run dev`: 開発サーバー起動
- `npm run build`: ビルド（`NEXT_PUBLIC_BASE_PATH=/cs-animation` を設定してビルドするとGitHub Pages用）
- `npm start`: プロダクションサーバー起動
