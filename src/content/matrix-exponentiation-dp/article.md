---
title: "行列累乗 DP 解説"
---

## 行列累乗 DP とは

行列累乗 DP は、**線形漸化式で表されるDP** を行列のべき乗を使って高速に計算するテクニックである。通常 $O(n)$ かかる漸化式の第 $n$ 項の計算を、$O(k^3 \log n)$ ($k$ は状態数) に高速化できる。

### 基本アイデア

線形漸化式:
$$
\begin{pmatrix} F(n+1) \\ F(n) \end{pmatrix} = \begin{pmatrix} a & b \\ 1 & 0 \end{pmatrix} \begin{pmatrix} F(n) \\ F(n-1) \end{pmatrix}
$$

を繰り返し適用すると:

$$
\begin{pmatrix} F(n+1) \\ F(n) \end{pmatrix} = A^n \begin{pmatrix} F(1) \\ F(0) \end{pmatrix}
$$

$A^n$ を**繰り返し二乗法** (binary exponentiation) で $O(k^3 \log n)$ で計算する。

## フィボナッチ数列での具体例

フィボナッチ数列: $F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2)$。

遷移行列:
$$
A = \begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}
$$

$$
\begin{pmatrix} F(n+1) \\ F(n) \end{pmatrix} = \begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}^n \begin{pmatrix} 1 \\ 0 \end{pmatrix}
$$

### 検証

$n = 3$:
$$
A^3 = \begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}^3 = \begin{pmatrix} 3 & 2 \\ 2 & 1 \end{pmatrix}
$$

$$
\begin{pmatrix} 3 & 2 \\ 2 & 1 \end{pmatrix} \begin{pmatrix} 1 \\ 0 \end{pmatrix} = \begin{pmatrix} 3 \\ 2 \end{pmatrix} = \begin{pmatrix} F(4) \\ F(3) \end{pmatrix}
$$

確かに $F(3) = 2$, $F(4) = 3$。

## 繰り返し二乗法

$A^n$ を $O(\log n)$ 回の行列乗算で計算する。

$n$ の2進表現 $n = b_k b_{k-1} \cdots b_1 b_0$ に対して:

$$
A^n = A^{b_k \cdot 2^k} \cdot A^{b_{k-1} \cdot 2^{k-1}} \cdots A^{b_1 \cdot 2} \cdot A^{b_0}
$$

$A^{2^i}$ は $A^{2^{i-1}}$ を二乗するだけで得られる。

### 実装

```python title="matrix_exp.py"
def mat_mul(A, B, mod):
    n = len(A)
    C = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            for k in range(n):
                C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % mod
    return C

def mat_pow(A, p, mod):
    n = len(A)
    result = [[1 if i == j else 0 for j in range(n)] for i in range(n)]
    base = [row[:] for row in A]
    while p > 0:
        if p & 1:
            result = mat_mul(result, base, mod)
        base = mat_mul(base, base, mod)
        p >>= 1
    return result

def fibonacci(n, mod=10**9 + 7):
    if n <= 1:
        return n
    A = [[1, 1], [1, 0]]
    An = mat_pow(A, n, mod)
    return An[1][0]  # or An[0][1]
```

## 一般的な線形漸化式

$k$ 次の線形漸化式:

$$
a_n = c_1 a_{n-1} + c_2 a_{n-2} + \cdots + c_k a_{n-k}
$$

の遷移行列は $k \times k$ のコンパニオン行列:

$$
A = \begin{pmatrix}
c_1 & c_2 & c_3 & \cdots & c_k \\
1 & 0 & 0 & \cdots & 0 \\
0 & 1 & 0 & \cdots & 0 \\
\vdots & & \ddots & & \vdots \\
0 & 0 & \cdots & 1 & 0
\end{pmatrix}
$$

## 計算量

| 項目 | 値 |
|------|------|
| 行列乗算 | $O(k^3)$ |
| 繰り返し二乗法 | $O(\log n)$ 回の乗算 |
| 全体 | $O(k^3 \log n)$ |

通常の線形DP $O(kn)$ と比較して、$n$ が非常に大きい ($10^{18}$ 程度) 場合に有効。

## 適用条件

行列累乗 DP が使えるのは以下の条件を満たす場合:

1. 遷移が**線形** (加法と定数倍の組み合わせ)
2. 遷移の構造が**ステップによらず一定** (行列が同じ)
3. $n$ が大きい ($k$ は小さい)

## 応用例

### タイリング問題

$2 \times n$ のグリッドを $1 \times 2$ のドミノで敷き詰める方法の数:

$$
f(n) = f(n-1) + f(n-2)
$$

これはフィボナッチ数列と同じ漸化式になる。

### グラフの経路数

隣接行列 $A$ の $n$ 乗 $A^n$ の $(i, j)$ 成分は、頂点 $i$ から $j$ への長さ $n$ のウォーク数を表す。

### 確率遷移

マルコフ連鎖の $n$ ステップ後の状態分布を遷移行列のべき乗で計算する。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 線形漸化式と求めたい項数 $n$ |
| 出力 | 漸化式の第 $n$ 項 |
| 時間計算量 | $O(k^3 \log n)$ |
| 空間計算量 | $O(k^2)$ |
| 核心 | 線形漸化式を行列表現し、繰り返し二乗法で高速計算 |
