---
title: "行列木定理 (Kirchhoff) 解説"
---

## 行列木定理とは

行列木定理 (Kirchhoff's Matrix Tree Theorem) は、連結な無向グラフの**全域木の個数**をラプラシアン行列の行列式で計算する定理である。1847 年に Kirchhoff が電気回路の解析の中で発見した。

## 定義

### ラプラシアン行列

グラフ $G = (V, E)$ に対して、ラプラシアン行列 $L$ は次のように定義される:

$$
L = D - A
$$

ここで:
- $D$: 次数行列 (対角行列で $D_{ii} = \deg(i)$)
- $A$: 隣接行列

具体的には:

$$
L_{ij} = \begin{cases} \deg(i) & \text{if } i = j \\ -(\text{辺 } (i,j) \text{ の重複度}) & \text{if } i \neq j \end{cases}
$$

### 余因子

$L_{ii}$ を行列 $L$ の第 $i$ 行と第 $i$ 列を取り除いた $(n-1) \times (n-1)$ の小行列とする。

## 定理の主張

グラフ $G$ の全域木の個数 $t(G)$ は、ラプラシアン行列の任意の余因子に等しい:

$$
t(G) = \det(L_{ii})
$$

ここで $L_{ii}$ は $L$ から第 $i$ 行と第 $i$ 列を削除した行列である。どの $i$ を選んでも同じ値になる。

## 具体例

### 完全グラフ $K_4$

4 頂点の完全グラフを考える。

隣接行列:

$$
A = \begin{pmatrix} 0 & 1 & 1 & 1 \\ 1 & 0 & 1 & 1 \\ 1 & 1 & 0 & 1 \\ 1 & 1 & 1 & 0 \end{pmatrix}
$$

ラプラシアン行列:

$$
L = \begin{pmatrix} 3 & -1 & -1 & -1 \\ -1 & 3 & -1 & -1 \\ -1 & -1 & 3 & -1 \\ -1 & -1 & -1 & 3 \end{pmatrix}
$$

第 4 行と第 4 列を削除:

$$
L_{44} = \begin{pmatrix} 3 & -1 & -1 \\ -1 & 3 & -1 \\ -1 & -1 & 3 \end{pmatrix}
$$

$$
\det(L_{44}) = 3(9-1) - (-1)(-3-1) + (-1)(1+3) = 24 - 4 - 4 = 16
$$

したがって $K_4$ の全域木は 16 個である。これは Cayley の公式 $n^{n-2} = 4^2 = 16$ と一致する。

## ラプラシアン行列の性質

1. **半正定値**: 全固有値が $0$ 以上
2. **最小固有値は 0**: 固有ベクトルは全成分 1 のベクトル $(1, 1, \ldots, 1)^T$
3. **行和・列和が 0**: $\sum_j L_{ij} = 0$ ($\forall i$)
4. **連結性の判定**: 固有値 0 の重複度 = 連結成分の数

## 証明の概略

行列木定理の証明には Cauchy-Binet の公式を用いる方法がある。

接続行列 $B$ ($n \times m$ 行列、$n$ は頂点数、$m$ は辺数) に対して $L = B B^T$ が成り立つ。Cauchy-Binet の公式により:

$$
\det(L_{11}) = \sum_{S \subseteq E, |S| = n-1} \det(B_S) \det(B_S^T)
$$

ここで $B_S$ は辺集合 $S$ に対応する列を選んだ部分行列。$\det(B_S)^2 = 1$ ならば $S$ は全域木を形成し、$\det(B_S) = 0$ ならばそうでないことが示せる。

## 実装

```python title="matrix_tree.py"
import numpy as np

def spanning_tree_count(n: int, edges: list[tuple[int, int]]) -> int:
    """Count spanning trees using Kirchhoff's theorem"""
    # Build Laplacian matrix
    L = [[0] * n for _ in range(n)]
    for u, v in edges:
        L[u][v] -= 1
        L[v][u] -= 1
        L[u][u] += 1
        L[v][v] += 1

    # Remove last row and column
    cofactor = [row[:-1] for row in L[:-1]]

    # Compute determinant
    return round(np.linalg.det(cofactor))
```

整数演算のみで行列式を計算する場合は、ガウス消去法を分数なしで行うか、素数 mod で計算する。

```python title="matrix_tree_int.py"
def det_mod(matrix: list[list[int]], mod: int) -> int:
    """Compute determinant modulo a prime"""
    n = len(matrix)
    mat = [row[:] for row in matrix]
    result = 1
    for col in range(n):
        pivot = -1
        for row in range(col, n):
            if mat[row][col] % mod != 0:
                pivot = row
                break
        if pivot == -1:
            return 0
        if pivot != col:
            mat[col], mat[pivot] = mat[pivot], mat[col]
            result = (-result) % mod
        result = result * mat[col][col] % mod
        inv = pow(mat[col][col], mod - 2, mod)
        for row in range(col + 1, n):
            factor = mat[row][col] * inv % mod
            for j in range(col, n):
                mat[row][j] = (mat[row][j] - factor * mat[col][j]) % mod
    return result
```

## 計算量

| 処理 | 時間計算量 |
|------|-----------|
| ラプラシアン構築 | $O(n^2 + m)$ |
| 行列式の計算 | $O(n^3)$ |
| 全体 | $O(n^3)$ |

## 拡張

### 重み付きグラフ

辺に重み $w_e$ がある場合、全域木の重み (辺の重みの積) の総和が行列式で求まる。ラプラシアンの非対角要素を $-w_e$ にすればよい。

### 有向グラフ (arborescence)

有向グラフの場合、根付き全域木 (arborescence) の個数はラプラシアンの定義を修正して求められる (BEST theorem)。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 無向グラフ $G = (V, E)$ |
| 出力 | 全域木の個数 |
| 方法 | ラプラシアン行列の余因子の行列式 |
| 時間計算量 | $O(n^3)$ |
| 核心 | $t(G) = \det(L_{ii})$ |
