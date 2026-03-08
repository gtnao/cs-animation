---
title: "最長共通部分列 (LCS) 解説"
---

## 最長共通部分列 (LCS) とは

最長共通部分列 (Longest Common Subsequence, LCS) は、2つの列に共通する部分列のうち最長のものを求める問題である。部分列とは、元の列から要素を (連続とは限らず) いくつか取り出して順序を保ったものである。

### 定義

列 $X = x_1 x_2 \cdots x_m$ と $Y = y_1 y_2 \cdots y_n$ が与えられたとき、両方の部分列となっている列 $Z$ のうち最長のものを求める。

### 具体例

$X = \text{ABCBDAB}$, $Y = \text{BDCAB}$ のとき、LCS は $\text{BCAB}$ (長さ4) である。

## 素朴なアプローチ

$X$ の全ての部分列 ($2^m$ 通り) について、$Y$ の部分列でもあるか確認する。時間計算量は $O(n \cdot 2^m)$ で指数時間である。

## 動的計画法

### 状態と遷移

$dp[i][j]$ を「$X$ の先頭 $i$ 文字と $Y$ の先頭 $j$ 文字の LCS の長さ」と定義する。

$$
dp[i][j] = \begin{cases}
0 & \text{if } i = 0 \text{ or } j = 0 \\
dp[i-1][j-1] + 1 & \text{if } x_i = y_j \\
\max(dp[i-1][j],\, dp[i][j-1]) & \text{if } x_i \neq y_j
\end{cases}
$$

### 直感的な理解

- $x_i = y_j$ の場合: この文字を LCS に含め、残りの問題を $X[1..i-1]$ と $Y[1..j-1]$ に帰着する
- $x_i \neq y_j$ の場合: $x_i$ を使わないか $y_j$ を使わないか、良い方を選ぶ

### 実装

```python title="lcs.py"
def lcs_length(X: str, Y: str) -> int:
    m, n = len(X), len(Y)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if X[i - 1] == Y[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]
```

### LCS の復元

DPテーブルを逆にたどることで、実際の LCS 文字列を復元できる。

```python title="lcs_trace.py"
def lcs_string(X: str, Y: str) -> str:
    m, n = len(X), len(Y)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if X[i - 1] == Y[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    # Traceback
    result = []
    i, j = m, n
    while i > 0 and j > 0:
        if X[i - 1] == Y[j - 1]:
            result.append(X[i - 1])
            i -= 1
            j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            i -= 1
        else:
            j -= 1
    return "".join(reversed(result))
```

## 計算量

| 項目 | 値 |
|------|------|
| 時間計算量 | $O(mn)$ |
| 空間計算量 | $O(mn)$ (Hirschberg 法で $O(\min(m, n))$) |

## 最適部分構造と重複部分問題

LCS 問題は動的計画法の2つの要件を満たす:

1. **最適部分構造**: 最適解が部分問題の最適解から構成される
2. **重複部分問題**: 同じ部分問題が繰り返し現れる

## 応用

- diff ツール (ファイル差分の表示)
- DNA 配列のアラインメント
- バージョン管理システム
- 自然言語処理 (文の類似度)

## LCS と編集距離の関係

LCS 長を $L$、2つの文字列の長さを $m, n$ とすると、LCS ベースの編集距離 (挿入・削除のみ) は $(m - L) + (n - L) = m + n - 2L$ である。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 2つの列 $X$ (長さ $m$), $Y$ (長さ $n$) |
| 出力 | LCS の長さ (および LCS 自体) |
| 時間計算量 | $O(mn)$ |
| 空間計算量 | $O(mn)$ |
| 核心 | 文字一致時は対角遷移、不一致時は上または左の最大値 |
