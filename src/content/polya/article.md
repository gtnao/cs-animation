---
title: "ポリアの数え上げ定理 解説"
---

## ポリアの数え上げ定理とは

ポリアの数え上げ定理 (Polya Enumeration Theorem, PET) はバーンサイドの補題を拡張し、対称性を考慮した彩色パターンの数を**巡回指標** (cycle index) を用いてより精密に数え上げる定理である。

## 巡回指標

### 定義

有限群 $G$ が集合 $\lbrace 1, 2, \ldots, n \rbrace$ に作用するとき、各 $g \in G$ の置換としてのサイクル構造を $(j_1, j_2, \ldots, j_n)$ で表す。ここで $j_k$ は長さ $k$ のサイクルの個数である。

$G$ の**巡回指標** (cycle index) は:

$$
Z(G) = \frac{1}{|G|} \sum_{g \in G} s_1^{j_1(g)} s_2^{j_2(g)} \cdots s_n^{j_n(g)}
$$

ここで $s_1, s_2, \ldots, s_n$ は不定元 (形式変数) である。

## 定理の主張

$k$ 色で $n$ 位置を塗るとき、群 $G$ の下で本質的に異なる彩色の数は:

$$
Z(G; k, k, \ldots, k) = \frac{1}{|G|} \sum_{g \in G} k^{c(g)}
$$

ここで $c(g)$ は $g$ の置換のサイクル数であり、$s_i = k$ ($\forall i$) としたものである。

これはバーンサイドの補題と一致する。

### 重み付きの場合

各色に重み $w_1, w_2, \ldots, w_k$ を付けたとき、各彩色パターンの重みの母関数は:

$$
Z(G; p_1, p_2, \ldots, p_n) \quad \text{where} \quad p_i = w_1^i + w_2^i + \cdots + w_k^i
$$

## 巡回群の巡回指標

$n$ 位置の巡回群 $C_n$ の巡回指標:

$$
Z(C_n) = \frac{1}{n} \sum_{d \mid n} \phi(d) \cdot s_d^{n/d}
$$

ここで $\phi$ はオイラーのトーシェント関数で、和は $n$ の約数 $d$ について取る。

## 具体例: 正方形の彩色

正方形の頂点を $k$ 色で塗る。回転群 $C_4$ の下で異なるパターンの数を求める。

$C_4 = \lbrace e, r, r^2, r^3 \rbrace$ (単位元、90度回転、180度回転、270度回転)

サイクル構造:
- $e$: $(1)(2)(3)(4)$ → 4 サイクル
- $r$: $(1234)$ → 1 サイクル
- $r^2$: $(13)(24)$ → 2 サイクル
- $r^3$: $(1432)$ → 1 サイクル

$$
Z(C_4) = \frac{1}{4}(s_1^4 + s_4 + s_2^2 + s_4) = \frac{1}{4}(s_1^4 + 2s_4 + s_2^2)
$$

$k$ 色の場合 ($s_i = k$):

$$
\frac{1}{4}(k^4 + 2k + k^2)
$$

$k = 2$ のとき: $\frac{16 + 4 + 4}{4} = 6$ 通り。

## 実装

```python title="polya.py"
from math import gcd

def polya_necklace(n: int, k: int) -> int:
    """Count distinct colorings of n positions with k colors
    under cyclic group action"""
    total = 0
    for r in range(n):
        # Number of cycles in rotation by r
        cycles = gcd(n, r) if r > 0 else n
        total += k ** cycles
    return total // n

def cycle_index_cyclic(n: int) -> dict:
    """Compute cycle index of cyclic group C_n
    Returns dict mapping cycle type tuples to coefficients"""
    terms = {}
    for r in range(n):
        g = gcd(n, r) if r > 0 else n
        cycle_type = tuple()
        if r == 0:
            cycle_type = (n, 0, 0)  # n fixed points
        else:
            d = n // g  # cycle length
            cycle_type = (0,) * (d - 1) + (g,)  # g cycles of length d
        terms[cycle_type] = terms.get(cycle_type, 0) + 1
    return terms
```

## 二面体群 (ブレスレットの数え上げ)

ネックレスと異なり、ブレスレットは裏返しも許す。回転と反射の両方を含む二面体群 $D_n$ の下で数え上げる。

$|D_n| = 2n$ で、回転 $n$ 個と反射 $n$ 個からなる。

```python title="bracelet.py"
from math import gcd

def bracelet_count(n: int, k: int) -> int:
    """Count distinct bracelets (rotation + reflection)"""
    # Rotations
    total = sum(k ** gcd(n, r) for r in range(n))
    # Reflections
    if n % 2 == 0:
        total += (n // 2) * k ** (n // 2 + 1)
        total += (n // 2) * k ** (n // 2)
    else:
        total += n * k ** ((n + 1) // 2)
    return total // (2 * n)
```

## 計算量

| 問題 | 計算量 |
|------|--------|
| 巡回群 (ネックレス) | $O(n \log n)$ |
| 二面体群 (ブレスレット) | $O(n \log n)$ |
| 一般の群 | $O(|G| \cdot n)$ |

## バーンサイドの補題との関係

ポリアの数え上げ定理は、バーンサイドの補題の特殊化 (各 $s_i = k$ とおく) であると同時に、重み付き彩色パターンの母関数を与える点でより一般的である。

バーンサイドの補題が「何種類あるか」を答えるのに対し、ポリアの定理は「各タイプが何種類あるか」の詳細情報も与える。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 群 $G$ の $n$ 位置への作用, $k$ 色 |
| 出力 | 本質的に異なる彩色数 |
| 核心 | 巡回指標 $Z(G)$ |
| 単純な場合 | $\frac{1}{|G|} \sum k^{c(g)}$ |
| 拡張 | 重み付き数え上げの母関数 |
