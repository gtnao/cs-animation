---
title: "スターリング数 解説"
---

## スターリング数とは

スターリング数には第一種と第二種の2種類がある。いずれも集合の分割や順列の構造に関する組合せ数である。

## 第二種スターリング数

### 定義

第二種スターリング数 $S(n, k)$ (または $\left\lbrace{n \atop k}\right\rbrace$) は、$n$ 個の要素を $k$ 個の空でない部分集合に分割する方法の数である。

### 漸化式

$$
S(n, k) = k \cdot S(n-1, k) + S(n-1, k-1)
$$

基底: $S(0, 0) = 1$, $S(n, 0) = 0$ ($n > 0$), $S(0, k) = 0$ ($k > 0$)

### 漸化式の直感的理解

$n$ 番目の要素を追加するとき:

1. 既存の $k$ 個のグループのいずれかに入れる: $k$ 通り $\times$ $S(n-1, k)$
2. 新しい単独グループを作る: $S(n-1, k-1)$

### 明示公式

$$
S(n, k) = \frac{1}{k!} \sum_{j=0}^{k} (-1)^{k-j} \binom{k}{j} j^n
$$

これは包除原理から導かれる。

### 具体例

$S(4, 2) = 7$: 集合 $\lbrace 1, 2, 3, 4 \rbrace$ を 2 つの非空部分集合に分割する方法:

$\lbrace 1 \rbrace \cup \lbrace 2,3,4 \rbrace$, $\lbrace 2 \rbrace \cup \lbrace 1,3,4 \rbrace$, $\lbrace 3 \rbrace \cup \lbrace 1,2,4 \rbrace$, $\lbrace 4 \rbrace \cup \lbrace 1,2,3 \rbrace$, $\lbrace 1,2 \rbrace \cup \lbrace 3,4 \rbrace$, $\lbrace 1,3 \rbrace \cup \lbrace 2,4 \rbrace$, $\lbrace 1,4 \rbrace \cup \lbrace 2,3 \rbrace$

## 第一種スターリング数

### 定義

符号なし第一種スターリング数 $\left[\begin{smallmatrix} n \\ k \end{smallmatrix}\right]$ (または $|s(n, k)|$) は、$n$ 個の要素の順列のうち、ちょうど $k$ 個の巡回置換 (サイクル) からなるものの数である。

### 漸化式

$$
\left[\begin{smallmatrix} n \\ k \end{smallmatrix}\right] = (n-1) \cdot \left[\begin{smallmatrix} n-1 \\ k \end{smallmatrix}\right] + \left[\begin{smallmatrix} n-1 \\ k-1 \end{smallmatrix}\right]
$$

基底: $\left[\begin{smallmatrix} 0 \\ 0 \end{smallmatrix}\right] = 1$

### 漸化式の直感的理解

$n$ 番目の要素を追加するとき:

1. 既存の $n-1$ 個の要素の前のいずれかの位置に挿入する (既存のサイクルに入る): $(n-1)$ 通り $\times$ $\left[\begin{smallmatrix} n-1 \\ k \end{smallmatrix}\right]$
2. 新しい固定点 (長さ1のサイクル) を作る: $\left[\begin{smallmatrix} n-1 \\ k-1 \end{smallmatrix}\right]$

## 実装

```python title="stirling.py"
def stirling_second(n: int, k: int) -> int:
    """Second kind Stirling number S(n, k)"""
    dp = [[0] * (k + 1) for _ in range(n + 1)]
    dp[0][0] = 1
    for i in range(1, n + 1):
        for j in range(1, min(i, k) + 1):
            dp[i][j] = j * dp[i-1][j] + dp[i-1][j-1]
    return dp[n][k]

def stirling_first(n: int, k: int) -> int:
    """Unsigned first kind Stirling number"""
    dp = [[0] * (k + 1) for _ in range(n + 1)]
    dp[0][0] = 1
    for i in range(1, n + 1):
        for j in range(1, min(i, k) + 1):
            dp[i][j] = (i - 1) * dp[i-1][j] + dp[i-1][j-1]
    return dp[n][k]
```

## 計算量

| 方法 | 時間計算量 | 空間計算量 |
|------|-----------|-----------|
| DP テーブル | $O(nk)$ | $O(nk)$ |
| DP (空間最適化) | $O(nk)$ | $O(k)$ |

## スターリング数の重要な性質

### 第二種の行和

$$
\sum_{k=0}^{n} S(n, k) = B_n \quad \text{(ベル数)}
$$

### 第一種の行和

$$
\sum_{k=0}^{n} \left[\begin{smallmatrix} n \\ k \end{smallmatrix}\right] = n!
$$

これは全順列をサイクル数で分類したものの合計が $n!$ であることに対応する。

### べき乗との関係

$$
x^n = \sum_{k=0}^{n} S(n, k) \cdot x^{\underline{k}}
$$

ここで $x^{\underline{k}} = x(x-1)\cdots(x-k+1)$ は下降階乗べきである。

## 応用

- 集合の分割の数え上げ
- 順列のサイクル構造の解析
- 多項式の基底変換 (通常のべき基底と下降階乗べき基底の間)
- 包除原理との組み合わせ

## まとめ

| 項目 | 第二種 $S(n,k)$ | 第一種 $\left[\begin{smallmatrix} n \\ k \end{smallmatrix}\right]$ |
|------|----------------|------|
| 意味 | $n$ 要素を $k$ 非空集合に分割 | $n$ 要素の順列で $k$ サイクル |
| 漸化式の係数 | $k$ | $n-1$ |
| 行和 | ベル数 $B_n$ | $n!$ |
