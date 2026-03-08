---
title: "LARSCH Algorithm 解説"
---

## LARSCH Algorithm とは

LARSCH Algorithm (Larmore-Schieber Algorithm) は、$n \times m$ の **totally monotone 行列**の各行の最小値をオンラインで求めるアルゴリズムである。SMAWK アルゴリズムが行列全体にオフラインでアクセスするのに対し、LARSCH は行列の値を必要なときだけ計算するオンライン版として機能する。

時間計算量は $O(n + m)$ (行列のサイズが $n \times m$ の場合) である。

## 背景: Totally Monotone 行列

### 定義

$n \times m$ 行列 $C$ が **totally monotone** (全単調) であるとは、全ての $2 \times 2$ 部分行列が単調であること。より正確には:

任意の $i_1 < i_2$, $j_1 < j_2$ に対して、$C[i_1][j_1] \leq C[i_1][j_2]$ ならば $C[i_2][j_1] \leq C[i_2][j_2]$。

直感的には、各行の最小値の位置 (列インデックス) が上の行から下の行に向かって単調非減少であることを意味する。

### Monotone 行列との関係

- **Monotone 行列**: 各行の最小値の列が単調非減少
- **Totally Monotone 行列**: 全ての部分行列が monotone

Totally monotone は monotone より強い条件。totally monotone ならば monotone だが、逆は成り立たない。

## SMAWK Algorithm (前提知識)

SMAWK は totally monotone 行列の全行最小値を $O(n + m)$ で求めるオフラインアルゴリズムである。LARSCH はこれをオンライン化したものと位置づけられる。

### SMAWK の概要

1. **REDUCE**: 列数を行数以下に削減 ($O(m)$)
2. **再帰**: 偶数行のみの部分問題を解く ($T(n/2)$)
3. **INTERPOLATE**: 奇数行の最小値を偶数行の結果から求める ($O(n)$)

全体: $T(n) = T(n/2) + O(n + m) = O(n + m)$。

## LARSCH Algorithm

### 動機

DPの文脈では、$C[i][j] = dp[j] + w(j, i)$ のように行列の値が計算途中のDP値に依存する場合がある。この場合、行列全体を事前に構築できないため、SMAWK をそのまま適用できない。

LARSCH はDP値が上の行から順に決まる場合に、行最小値をオンラインで求められる。

### アルゴリズムの構造

LARSCH は SMAWK と同様の再帰構造を持つが、オンライン性を確保するために計算順序を工夫する。

1. 偶数行 $0, 2, 4, \ldots$ の部分問題を再帰的に解く
2. 各偶数行のDP値が確定したら、その情報を使って隣接する奇数行のDP値を計算

### 疑似コード

```
LARSCH(n, m, C):
    if n == 1:
        row 0 の最小値を全列走査で求める
        return

    // REDUCE: 列を n 個以下に削減
    active_cols = REDUCE(n, m, C)

    // 偶数行の部分問題を再帰的に解く
    even_row_mins = LARSCH(ceil(n/2), |active_cols|, C_even)

    // 奇数行を偶数行の結果で補間
    INTERPOLATE(odd rows, even_row_mins)
```

### REDUCE ステップ

列のスタックを管理する。新しい列 $j$ が来たとき:

1. スタックトップの列 $j'$ と比較
2. スタックの行数番目の行で $C[\text{top\_row}][j'] \geq C[\text{top\_row}][j]$ なら $j'$ を除去
3. スタックサイズが $n$ 未満なら $j$ を追加

この操作は amortized $O(1)$ per column で、全体 $O(m)$。

### INTERPOLATE ステップ

偶数行 $2k$ の最適列が $p_{2k}$、偶数行 $2k+2$ の最適列が $p_{2k+2}$ のとき、奇数行 $2k+1$ の最適列は $[p_{2k}, p_{2k+2}]$ の範囲にある。

この範囲を走査して最小値を見つける。全奇数行の走査範囲の合計は $O(n + m)$。

## 計算量

| 項目 | 値 |
|------|------|
| 時間計算量 | $O(n + m)$ |
| 空間計算量 | $O(n + m)$ |

DPへの適用では $m = n$ の場合が多く、$O(n)$ となる。

## DPへの適用

### 1D/1D DP の高速化

$$
dp[i] = \min_{j < i} (dp[j] + w(j, i))
$$

コスト関数 $w$ が concave (凹) な四辺形不等式を満たすとき、行列 $C[i][j] = dp[j] + w(j, i)$ は totally monotone になる。

LARSCH を用いると、このDPを $O(n)$ で解ける。Divide & Conquer Optimization の $O(n \log n)$ よりも高速。

### 比較

| 手法 | 時間計算量 | 特徴 |
|------|------|------|
| 素朴DP | $O(n^2)$ | 実装最も簡単 |
| D&C Optimization | $O(n \log n)$ | 実装が比較的簡単 |
| LARSCH | $O(n)$ | 最速だが実装が複雑 |

## 実装上の注意

LARSCH の実装は SMAWK に比べてかなり複雑である。主な難しさ:

1. オンラインでの列削減と再帰の組み合わせ
2. 再帰の各レベルでのコールバック管理
3. DP値の依存関係の正しい処理

競技プログラミングでは D&C Optimization で十分な場合が多いが、定数倍の改善や理論的な最適性が必要な場合に LARSCH が使われる。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n \times m$ の totally monotone 行列 (オンラインアクセス) |
| 出力 | 各行の最小値とその列インデックス |
| 時間計算量 | $O(n + m)$ |
| 空間計算量 | $O(n + m)$ |
| 核心 | SMAWK のオンライン化、REDUCE + 再帰 + INTERPOLATE |
