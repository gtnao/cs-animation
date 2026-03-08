---
title: "ガウスの消去法 mod 2 ビット 解説"
---

## ガウスの消去法 mod 2 とは

ガウスの消去法 mod 2 (Gaussian Elimination over GF(2)) は、$\mathbb{F}_2 = \{0, 1\}$ (2元体、GF(2)) 上での線形代数演算を行うアルゴリズムである。通常のガウスの消去法と同じ原理だが、全ての演算が mod 2 で行われるため、加算は XOR、乗算は AND に対応する。

### GF(2) の演算規則

| $+$ | 0 | 1 |
|-----|---|---|
| **0** | 0 | 1 |
| **1** | 1 | 0 |

| $\times$ | 0 | 1 |
|-----------|---|---|
| **0** | 0 | 0 |
| **1** | 0 | 1 |

GF(2) では $-1 = 1$ であるため、加算と減算が同一の演算 (XOR) になる。これがビット演算との相性が良い理由である。

## ビットベクトルによる効率的な実装

### 核心アイデア

GF(2) 上の行列の各行を**整数のビット表現**で表す。行 $(a_0, a_1, \ldots, a_{m-1})$ を整数 $v = \sum_{j} a_j \cdot 2^j$ として格納する。

この表現を使うと:

- **行の XOR**: 整数の XOR 演算 1 回 ($O(1)$、ワードサイズ以内なら)
- **ピボット位置の確認**: ビットの検査 ($O(1)$)

通常は各要素を個別に操作するため 1 行あたり $O(m)$ かかるが、ビットベクトル表現では $O(m/w)$ ($w$ はワードサイズ) に削減される。

### 実装

```python title="gaussian_elimination_mod2.py"
def gaussian_elimination_mod2(vectors: list[int], max_bit: int) -> tuple[list[int], int]:
    """
    GF(2) Gaussian elimination on bit vectors.
    Returns (basis, rank).
    """
    basis = [0] * max_bit
    rank = 0
    for v in vectors:
        cur = v
        for bit in range(max_bit - 1, -1, -1):
            if not (cur >> bit & 1):
                continue
            if basis[bit] == 0:
                basis[bit] = cur
                rank += 1
                break
            cur ^= basis[bit]
    return basis, rank
```

### 行列形式の実装

行列形式で実装する場合、各行を整数で表す。

```python title="gaussian_elimination_mod2_matrix.py"
def gauss_mod2_matrix(rows: list[int], m: int) -> tuple[list[int], int]:
    """
    rows[i] is the integer representation of row i.
    m is the number of columns.
    Returns (reduced rows, rank).
    """
    n = len(rows)
    mat = rows[:]
    pivot_row = 0
    rank = 0

    for col in range(m - 1, -1, -1):
        # Find pivot
        found = -1
        for row in range(pivot_row, n):
            if mat[row] >> col & 1:
                found = row
                break
        if found == -1:
            continue

        # Swap
        mat[pivot_row], mat[found] = mat[found], mat[pivot_row]

        # Eliminate all other rows
        for row in range(n):
            if row != pivot_row and (mat[row] >> col & 1):
                mat[row] ^= mat[pivot_row]

        pivot_row += 1
        rank += 1

    return mat, rank
```

## 計算量

### 行列形式

- $n$ 行 $m$ 列の行列に対して $O(nm \cdot \min(n, m) / w)$
- $w$ はワードサイズ (通常 64)

ビット並列化により、通常のガウスの消去法 $O(nm \cdot \min(n,m))$ を $w$ 倍高速化できる。

### ベクトル挿入形式

$n$ 個の $m$ ビットベクトルを逐次的に処理する場合:

- 各ベクトルの挿入: $O(m)$ (最悪ケース、全ビット位置でXOR)
- 全体: $O(nm)$

## 応用

### XOR 方程式系の求解

$n$ 本の XOR 方程式

$$
a_{i,0} x_0 \oplus a_{i,1} x_1 \oplus \cdots \oplus a_{i,m-1} x_{m-1} = b_i
$$

は GF(2) 上の連立一次方程式であり、ガウスの消去法 mod 2 で解ける。

### 線形独立性の判定

ビットベクトルの集合が線形独立か判定する。ガウスの消去法で rank を求め、rank がベクトルの数と等しければ線形独立。

### XOR 基底 (線形基底)

集合 $S$ の XOR で表現できる値の全体 (線形包) を、少数の基底ベクトルで表す。ガウスの消去法 mod 2 でこの基底を構築できる。これは線形基底 (Linear Basis, XOR Basis) と呼ばれる。

### 最大 XOR 値

与えられたベクトル集合の部分集合の XOR で得られる最大値を求める問題。線形基底を構築し、上位ビットから貪欲に取る。

```python title="max_xor.py"
def max_xor(values: list[int]) -> int:
    basis = []
    for v in values:
        cur = v
        for b in basis:
            cur = min(cur, cur ^ b)
        if cur > 0:
            basis.append(cur)
            basis.sort(reverse=True)
    result = 0
    for b in basis:
        result = max(result, result ^ b)
    return result
```

### ライツアウト問題

ライツアウトパズルは GF(2) 上の連立方程式として定式化できる。各ボタンの押下を変数とし、各ライトの状態変化を方程式で表す。

## GF(2) 特有の性質

### 自己逆元

GF(2) では全ての非零元が自身の逆元である ($1^{-1} = 1$)。したがって、ガウスの消去法でスケーリング (割り算) のステップが不要になる。

### 加算と減算の同一性

$a + b = a - b = a \oplus b$ であるため、消去操作は単純な XOR で済む。

### 特性 2

GF(2) の標数は 2 であり、$1 + 1 = 0$ が成り立つ。これにより行列式の計算なども通常の体とは異なる振る舞いをする。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | GF(2) 上の $n \times m$ 行列 (ビットベクトル) |
| 出力 | 行階段形、階数 |
| 時間計算量 | $O(nm \cdot \min(n,m) / w)$ |
| 空間計算量 | $O(n)$ (各行を整数で格納) |
| 核心 | ビット並列 XOR による高速消去 |
| 応用 | XOR 方程式系、線形基底、最大 XOR、ライツアウト |
