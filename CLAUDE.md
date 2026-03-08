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

## 大量生成ワークフロー（SubAgent 並列実行）

`todo.yml` にアルゴリズム一覧がある。これを SubAgent で並列に生成していく。

### 実行ルール

1. **SubAgent は最大5並列** で起動する
2. 各 SubAgent は `isolation: "worktree"` で独立した worktree 上で作業する
3. 各 SubAgent には **1カテゴリ分のアルゴリズム群** を丸ごと割り当てる
4. 親エージェントは **子が1つ完了するごとに** そのworktreeの変更を取り込み、ビルド確認・コミット・push を行う（全子の完了を待たない）
5. 作業を途中で止めず、全カテゴリが埋まるまでこのプロセスを繰り返す

### カテゴリの処理順

トピックの偏りを防ぐため、以下の順にラウンドロビンで5カテゴリずつ処理する。

**Round 1:**
- 文字列 (17)
- ソート (15)
- グラフ 探索・最短路 (11)
- グラフ 木・連結性 (11)
- グラフ マッチング・フロー (9)

**Round 2:**
- グラフ その他 (11)
- データ構造 基本 (8)
- データ構造 平衡二分探索木 (9)
- データ構造 区間・列 (12)
- データ構造 木クエリ (6)

**Round 3:**
- データ構造 発展 (10)
- 動的計画法 (19)
- 探索 (9)
- 数学 整数論 (14)
- 数学 線形代数 (6)

**Round 4:**
- 数学 多項式・変換 (10)
- 数学 組合せ (11)
- 計算幾何 (10)
- ゲーム理論 (4)
- その他 (20)

### SubAgent への指示テンプレート

各 SubAgent には以下を伝える:

- 担当カテゴリとそのアルゴリズム一覧 (`todo.yml` から抽出)
- 「新しいアルゴリズムを追加する手順」（本ファイルの該当セクション）
- 参考実装として `src/app/z-algorithm/` 以下の全ファイルと `src/content/z-algorithm/article.md`
- デザイン方針（フラット、色分け規則）
- 解説記事の書き方（数式の注意点含む）
- `src/app/page.tsx` のトップページへのリンク追加は **親が行う**（競合防止のため SubAgent はやらない）

### 親エージェントの責務

1. SubAgent の worktree から変更を取り込む
2. `src/app/page.tsx` にリンクを追加する
3. `NEXT_PUBLIC_BASE_PATH=/cs-animation npm run build` でビルド確認
4. コミット & push
5. `todo.yml` の該当アルゴリズムの `status` を `done` に更新
6. 次のラウンドの SubAgent を起動

## コマンド

- `npm run dev`: 開発サーバー起動
- `npm run build`: ビルド（`NEXT_PUBLIC_BASE_PATH=/cs-animation` を設定してビルドするとGitHub Pages用）
- `npm start`: プロダクションサーバー起動
