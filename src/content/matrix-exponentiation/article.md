---
title: "行列累乗 解説"
---

## 行列累乗とは

行列累乗 (Matrix Exponentiation) は、正方行列 $A$ の $n$ 乗 $A^n$ を高速に計算する手法である。繰り返し二乗法 (binary exponentiation) を行列に適用することで、素朴な $O(d^3 n)$ の計算を $O(d^3 \log n)$ に削減する。ここで $d$ は行列のサイズである。

### 基本的なアイデア

整数のべき乗における繰り返し二乗法と全く同じ原理を使う。

$$
A^n = \begin{cases}
I & (n = 0) \\
(A^{n/2})^2 & (n \text{ が偶数}) \\
A \cdot (A^{(n-1)/2})^2 & (n \text{ が奇数})
\end{cases}
$$

ここで $I$ は単位行列である。

## アルゴリズム

### 二進展開による方法

指数 $n$ を二進表現 $n = b_{k-1} b_{k-2} \cdots b_1 b_0$ とする。このとき、

$$
A^n = A^{\sum_{i=0}^{k-1} b_i \cdot 2^i} = \prod_{i: b_i = 1} A^{2^i}
$$

$A^{2^i}$ は $A^{2^{i-1}}$ を二乗すれば得られるので、$A, A^2, A^4, A^8, \ldots$ を順に計算しながら、ビットが 1 の位置で結果に掛けていく。

### 実装

```python title="matrix_exponentiation.py"
def mat_mul(A: list[list[int]], B: list[list[int]]) -> list[list[int]]:
    n = len(A)
    C = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            for k in range(n):
                C[i][j] += A[i][k] * B[k][j]
    return C

def mat_pow(A: list[list[int]], exp: int) -> list[list[int]]:
    n = len(A)
    # Initialize result as identity matrix
    result = [[1 if i == j else 0 for j in range(n)] for i in range(n)]
    base = [row[:] for row in A]
    while exp > 0:
        if exp & 1:
            result = mat_mul(result, base)
        base = mat_mul(base, base)
        exp >>= 1
    return result
```

### 計算量

- **時間計算量:** $O(d^3 \log n)$。行列積 1 回が $O(d^3)$ であり、繰り返し二乗法により乗算回数は $O(\log n)$
- **空間計算量:** $O(d^2)$

## 正当性の証明

### 命題: 繰り返し二乗法は $A^n$ を正しく計算する

**証明:**

ループの不変条件を示す。ループの各反復の開始時点で以下が成り立つ。

$$
A^{n_{\text{original}}} = \text{result} \times \text{base}^{\text{exp}}
$$

ここで $n_{\text{original}}$ は元の指数である。

- **初期状態:** $\text{result} = I$, $\text{base} = A$, $\text{exp} = n$ なので $I \times A^n = A^n$。成立
- **exp が奇数の場合:** $\text{result}' = \text{result} \times \text{base}$, $\text{exp}' = \text{exp} - 1$ とすると、$\text{result}' \times \text{base}^{\text{exp}'} = \text{result} \times \text{base} \times \text{base}^{\text{exp}-1} = \text{result} \times \text{base}^{\text{exp}}$。不変条件は保たれる
- **exp を半分にする:** $\text{base}' = \text{base}^2$, $\text{exp}' = \text{exp}/2$ とすると、$\text{result} \times (\text{base}')^{\text{exp}'} = \text{result} \times (\text{base}^2)^{\text{exp}/2} = \text{result} \times \text{base}^{\text{exp}}$。不変条件は保たれる
- **終了時:** $\text{exp} = 0$ なので $\text{result} \times \text{base}^0 = \text{result} = A^{n_{\text{original}}}$。 $\square$

## 応用例

### フィボナッチ数列

フィボナッチ数列 $F(n) = F(n-1) + F(n-2)$ は次の行列の累乗で表される。

$$
\begin{pmatrix} F(n+1) \\ F(n) \end{pmatrix} = \begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}^n \begin{pmatrix} F(1) \\ F(0) \end{pmatrix}
$$

これにより $F(n)$ を $O(\log n)$ で計算できる ($d = 2$ なので行列積は $O(1)$)。

### 線形漸化式の高速計算

$k$ 項間漸化式

$$
a_n = c_1 a_{n-1} + c_2 a_{n-2} + \cdots + c_k a_{n-k}
$$

は $k \times k$ の遷移行列

$$
M = \begin{pmatrix}
c_1 & c_2 & \cdots & c_{k-1} & c_k \\
1 & 0 & \cdots & 0 & 0 \\
0 & 1 & \cdots & 0 & 0 \\
\vdots & & \ddots & & \vdots \\
0 & 0 & \cdots & 1 & 0
\end{pmatrix}
$$

を用いて $O(k^3 \log n)$ で計算できる。

### グラフの経路数

隣接行列 $A$ のグラフにおいて、$A^k$ の $(i, j)$ 成分は頂点 $i$ から頂点 $j$ への長さ $k$ の経路の数を表す。行列累乗により $O(V^3 \log k)$ で計算可能。

### 動的計画法の高速化

遷移行列が一定の DP は、行列累乗で高速化できる。特にセグメント数や状態数が少ない場合に有効。

## mod 演算との組み合わせ

実用上は結果が非常に大きくなるため、素数 $p$ で mod を取ることが多い。行列積の各要素に mod を適用するだけでよい。

```python title="matrix_exponentiation_mod.py"
MOD = 10**9 + 7

def mat_mul_mod(A, B):
    n = len(A)
    C = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            for k in range(n):
                C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % MOD
    return C
```

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $d \times d$ 正方行列 $A$, 指数 $n$ |
| 出力 | $A^n$ |
| 時間計算量 | $O(d^3 \log n)$ |
| 空間計算量 | $O(d^2)$ |
| 核心 | 繰り返し二乗法 (binary exponentiation) |
| 応用 | フィボナッチ数列, 線形漸化式, グラフ経路数, DP高速化 |
