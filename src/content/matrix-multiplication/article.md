---
title: "行列積 解説"
---

## 行列積とは

行列積 (Matrix Multiplication) は、2つの行列 $A$ と $B$ から新しい行列 $C = AB$ を計算する基本演算である。線形代数の根幹をなし、コンピュータサイエンスのあらゆる分野で利用される。

### 定義

$n \times p$ 行列 $A$ と $p \times m$ 行列 $B$ の積 $C = AB$ は $n \times m$ 行列であり、各要素は次のように定義される。

$$
C[i][j] = \sum_{k=0}^{p-1} A[i][k] \cdot B[k][j]
$$

すなわち、$C$ の $(i, j)$ 成分は $A$ の第 $i$ 行と $B$ の第 $j$ 列の**内積**である。

### 具体例

$$
A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}, \quad B = \begin{pmatrix} 5 & 6 \\ 7 & 8 \end{pmatrix}
$$

$$
C = AB = \begin{pmatrix} 1 \cdot 5 + 2 \cdot 7 & 1 \cdot 6 + 2 \cdot 8 \\ 3 \cdot 5 + 4 \cdot 7 & 3 \cdot 6 + 4 \cdot 8 \end{pmatrix} = \begin{pmatrix} 19 & 22 \\ 43 & 50 \end{pmatrix}
$$

## 素朴なアルゴリズム

定義に従って3重ループで計算する。

```python title="matrix_multiply.py"
def matrix_multiply(A: list[list[int]], B: list[list[int]]) -> list[list[int]]:
    n = len(A)
    p = len(B)
    m = len(B[0])
    C = [[0] * m for _ in range(n)]
    for i in range(n):
        for j in range(m):
            for k in range(p):
                C[i][j] += A[i][k] * B[k][j]
    return C
```

### 計算量

- **時間計算量:** $O(nmp)$。正方行列 ($n = m = p$) の場合は $O(n^3)$
- **空間計算量:** $O(nm)$ (結果行列の分)

## 行列積の性質

### 結合法則

行列積は結合法則を満たす。

$$
(AB)C = A(BC)
$$

これは行列累乗や連鎖行列積の最適化の基礎となる重要な性質である。

### 非可換性

一般に行列積は交換法則を満たさない。

$$
AB \neq BA
$$

$AB$ が定義されても $BA$ が定義されるとは限らない (サイズの制約)。$AB$ と $BA$ の両方が定義される場合でも、一般には値が異なる。

### 分配法則

行列積は加法に対して分配法則を満たす。

$$
A(B + C) = AB + AC, \quad (A + B)C = AC + BC
$$

## 高速な行列積

### Strassen のアルゴリズム

1969年に Strassen が発見した分割統治法に基づくアルゴリズムである。$2 \times 2$ 行列のブロック分割を利用し、通常 8 回必要な乗算を 7 回に削減する。

$$
T(n) = 7T(n/2) + O(n^2)
$$

マスター定理より、計算量は $O(n^{\log_2 7}) \approx O(n^{2.807})$ となる。

### 現在の理論的限界

行列積の計算量の下界は $\Omega(n^2)$ (全要素を読む必要がある) だが、$O(n^2)$ アルゴリズムは見つかっていない。現在の最良の上界は $O(n^{2.371552})$ (2024年時点) である。行列積の計算量 $\omega$ の真の値の決定は、未解決問題である。

## 実装上の注意点

### ループ順序とキャッシュ効率

3重ループの順序 $(i, j, k)$, $(i, k, j)$, $(k, i, j)$ などによってキャッシュ効率が大きく変わる。

```python title="cache_friendly.py"
# Cache-friendly: A is accessed row-wise, B is accessed row-wise
def matrix_multiply_ikj(A, B):
    n = len(A)
    p = len(B)
    m = len(B[0])
    C = [[0] * m for _ in range(n)]
    for i in range(n):
        for k in range(p):
            for j in range(m):
                C[i][j] += A[i][k] * B[k][j]
    return C
```

$(i, k, j)$ 順は $B$ の行方向アクセスとなり、キャッシュ効率が良い。

## 応用

| 応用 | 説明 |
|------|------|
| 行列累乗 | 繰り返し二乗法と組み合わせて $A^n$ を $O(d^3 \log n)$ で計算 |
| グラフ理論 | 隣接行列の $k$ 乗で長さ $k$ のパス数を計算 |
| 動的計画法 | 遷移行列を用いた DP の高速化 |
| 連立方程式 | ガウスの消去法の基礎演算 |
| コンピュータグラフィックス | 座標変換、射影変換 |

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n \times p$ 行列 $A$, $p \times m$ 行列 $B$ |
| 出力 | $n \times m$ 行列 $C = AB$ |
| 時間計算量 (素朴) | $O(nmp)$ |
| 時間計算量 (Strassen) | $O(n^{2.807})$ |
| 空間計算量 | $O(nm)$ |
| 核心 | 行と列の内積計算 |
