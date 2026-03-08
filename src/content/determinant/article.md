---
title: "行列式 Determinant 解説"
---

## 行列式とは

行列式 (Determinant) は正方行列に対して定義されるスカラー値であり、線形代数の基本概念の一つである。行列式は逆行列の存在判定、連立方程式の解の存在、体積の計算など、多くの場面で重要な役割を果たす。

### 定義

$n \times n$ 行列 $A = (a_{ij})$ の行列式 $\det(A)$ は、置換の総和として定義される。

$$
\det(A) = \sum_{\sigma \in S_n} \text{sgn}(\sigma) \prod_{i=1}^{n} a_{i, \sigma(i)}
$$

ここで $S_n$ は $\{1, 2, \ldots, n\}$ の全置換の集合、$\text{sgn}(\sigma)$ は置換 $\sigma$ の符号 (偶置換なら $+1$、奇置換なら $-1$) である。

### 小さいサイズの公式

**$2 \times 2$ 行列:**

$$
\det \begin{pmatrix} a & b \\ c & d \end{pmatrix} = ad - bc
$$

**$3 \times 3$ 行列 (サラスの公式):**

$$
\det \begin{pmatrix} a & b & c \\ d & e & f \\ g & h & i \end{pmatrix} = aei + bfg + cdh - ceg - bdi - afh
$$

## 行列式の性質

### 基本性質

1. **転置不変:** $\det(A^T) = \det(A)$
2. **乗法性:** $\det(AB) = \det(A) \cdot \det(B)$
3. **逆行列:** $\det(A^{-1}) = 1 / \det(A)$
4. **スカラー倍:** $\det(cA) = c^n \det(A)$ ($n$ は行列のサイズ)

### 行基本変換と行列式

行列式と行基本変換の関係が、ガウスの消去法による行列式計算の基礎である。

1. **行の交換:** 2つの行を交換すると行列式の符号が反転する
2. **行のスカラー倍:** ある行を $c$ 倍すると行列式も $c$ 倍になる
3. **行の加算:** ある行に他の行の定数倍を加えても行列式は変わらない

## ガウスの消去法による計算

### アルゴリズム

定義通りの計算は $O(n! \cdot n)$ であり、$n$ が大きいと実用的でない。ガウスの消去法で上三角行列に変換し、対角成分の積として計算するのが標準的な方法である。

$$
\det(A) = (-1)^s \prod_{i=0}^{n-1} U_{ii}
$$

ここで $U$ は上三角化された行列、$s$ は行の交換回数である。

```python title="determinant.py"
def determinant(A: list[list[float]]) -> float:
    n = len(A)
    M = [row[:] for row in A]
    sign = 1

    for col in range(n):
        # Partial pivoting
        max_row = max(range(col, n), key=lambda r: abs(M[r][col]))
        if abs(M[max_row][col]) < 1e-12:
            return 0.0

        if max_row != col:
            M[col], M[max_row] = M[max_row], M[col]
            sign *= -1

        # Eliminate below
        for row in range(col + 1, n):
            factor = M[row][col] / M[col][col]
            for j in range(col, n):
                M[row][j] -= factor * M[col][j]

    # Product of diagonal
    det = sign
    for i in range(n):
        det *= M[i][i]
    return det
```

### 計算量

- **時間計算量:** $O(n^3)$ (ガウスの消去法と同じ)
- **空間計算量:** $O(n^2)$

### 正当性

**定理:** ガウスの消去法の前進消去の各ステップは、行列式を保存する (行交換の符号を除く)。

**証明:** 消去操作は「行 $i$ に行 $j$ の $c$ 倍を加える」という操作であり、これは行列式を変えない (性質 3)。行の交換のみが符号を変える (性質 1)。上三角行列の行列式は対角成分の積である (定義から直接導ける)。 $\square$

## mod 素数での行列式

競技プログラミングでは、行列式を素数 $p$ で mod を取って計算することが多い。$\mathbb{F}_p$ 上でのガウスの消去法を行えばよい。

```python title="determinant_mod.py"
def determinant_mod(A: list[list[int]], mod: int) -> int:
    n = len(A)
    M = [row[:] for row in A]
    sign = 1

    for col in range(n):
        # Find non-zero pivot
        pivot = -1
        for row in range(col, n):
            if M[row][col] % mod != 0:
                pivot = row
                break
        if pivot == -1:
            return 0

        if pivot != col:
            M[col], M[pivot] = M[pivot], M[col]
            sign *= -1

        inv_pivot = pow(M[col][col], mod - 2, mod)
        for row in range(col + 1, n):
            factor = M[row][col] * inv_pivot % mod
            for j in range(col, n):
                M[row][j] = (M[row][j] - factor * M[col][j]) % mod

    det = sign % mod
    for i in range(n):
        det = det * M[i][i] % mod
    return det
```

ここでピボットの逆元はフェルマーの小定理 ($a^{p-2} \equiv a^{-1} \pmod{p}$) を用いる。

## 余因子展開

行列式は余因子展開によっても計算できる。第 $i$ 行に沿った展開は以下の通り。

$$
\det(A) = \sum_{j=0}^{n-1} (-1)^{i+j} a_{ij} \det(A_{ij})
$$

ここで $A_{ij}$ は $A$ から第 $i$ 行と第 $j$ 列を除いた $(n-1) \times (n-1)$ 小行列である。

この方法の計算量は $O(n!)$ であり、大きな行列には向かない。しかし小さい行列や理論的な議論では有用である。

## 応用

| 応用 | 説明 |
|------|------|
| 正則性の判定 | $\det(A) \neq 0$ ならば $A$ は正則 (逆行列が存在) |
| クラメルの公式 | 連立方程式の解を行列式の比で表す |
| 面積・体積 | 2次元の平行四辺形の面積、3次元の平行六面体の体積 |
| 固有値 | 固有多項式 $\det(A - \lambda I) = 0$ |
| 行列木定理 | グラフの全域木の数を行列式で計算 |

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n \times n$ 正方行列 $A$ |
| 出力 | $\det(A)$ |
| 時間計算量 (ガウス消去) | $O(n^3)$ |
| 時間計算量 (余因子展開) | $O(n!)$ |
| 空間計算量 | $O(n^2)$ |
| 核心 | 上三角化して対角積、行交換の符号追跡 |
