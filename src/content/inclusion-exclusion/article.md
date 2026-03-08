---
title: "包除原理 解説"
---

## 包除原理とは

包除原理 (Inclusion-Exclusion Principle) は、複数の集合の和集合の要素数を、各集合とその交わりの要素数から計算する原理である。

## 2 集合の場合

$$
|A \cup B| = |A| + |B| - |A \cap B|
$$

$A$ と $B$ をそのまま足すと $A \cap B$ の部分を二重に数えてしまうので、引いて補正する。

## 一般の場合

$n$ 個の集合 $A_1, A_2, \ldots, A_n$ に対して:

$$
\left| \bigcup_{i=1}^{n} A_i \right| = \sum_{k=1}^{n} (-1)^{k+1} \sum_{1 \leq i_1 < \cdots < i_k \leq n} |A_{i_1} \cap \cdots \cap A_{i_k}|
$$

あるいは同等に:

$$
\left| \bigcup_{i=1}^{n} A_i \right| = \sum_{\emptyset \neq S \subseteq [n]} (-1)^{|S|+1} \left| \bigcap_{i \in S} A_i \right|
$$

## 直感的な理解

包除原理は「足しすぎたら引き、引きすぎたら足す」を繰り返す操作である。

3 集合の場合を考える:

$$
|A \cup B \cup C| = |A| + |B| + |C| - |A \cap B| - |A \cap C| - |B \cap C| + |A \cap B \cap C|
$$

1. まず各集合の大きさを足す (一部の要素を複数回数えている)
2. 2 つの交わりを引いて二重計上を補正する (一部の要素を引きすぎる)
3. 3 つの交わりを足して再補正する

## 証明

### 命題: 包除原理は正しい

**証明:** 任意の要素 $x \in \bigcup_{i=1}^{n} A_i$ について、右辺での $x$ の寄与が正確に 1 であることを示す。

$x$ がちょうど $m$ 個の集合に属するとする ($1 \leq m \leq n$)。右辺で $x$ が数えられる回数は:

$$
\binom{m}{1} - \binom{m}{2} + \binom{m}{3} - \cdots + (-1)^{m+1}\binom{m}{m}
$$

二項定理より

$$
\sum_{k=0}^{m} (-1)^k \binom{m}{k} = (1-1)^m = 0
$$

$k = 0$ の項を移項すると

$$
\sum_{k=1}^{m} (-1)^{k+1} \binom{m}{k} = 1
$$

したがって各要素はちょうど 1 回数えられる。 $\square$

## 補集合の形

全体集合 $U$ のうち、どの $A_i$ にも属さない要素の数:

$$
\left| \overline{A_1} \cap \overline{A_2} \cap \cdots \cap \overline{A_n} \right| = |U| - \left| \bigcup_{i=1}^{n} A_i \right|
$$

$$
= |U| - \sum_{k=1}^{n} (-1)^{k+1} \sum_{|S|=k} \left| \bigcap_{i \in S} A_i \right|
$$

$$
= \sum_{k=0}^{n} (-1)^{k} \sum_{|S|=k} \left| \bigcap_{i \in S} A_i \right|
$$

この形は「条件を全て満たさない要素数」を求める問題でよく使われる。

## 実装

```python title="inclusion_exclusion.py"
def inclusion_exclusion(sets: list[set]) -> int:
    """Compute |A1 ∪ A2 ∪ ... ∪ An| using inclusion-exclusion"""
    n = len(sets)
    total = 0
    for mask in range(1, 1 << n):
        # Compute intersection of selected sets
        intersection = None
        bits = 0
        for i in range(n):
            if mask & (1 << i):
                bits += 1
                if intersection is None:
                    intersection = sets[i].copy()
                else:
                    intersection &= sets[i]
        size = len(intersection) if intersection else 0
        # Add or subtract based on parity
        if bits % 2 == 1:
            total += size
        else:
            total -= size
    return total
```

## 計算量

| 項目 | 計算量 |
|------|--------|
| 部分集合の列挙 | $O(2^n)$ |
| 各交わりの計算 | 問題依存 |
| 全体 | $O(2^n \cdot T)$ ($T$ は交わりの計算時間) |

## 応用例

### 1. オイラーのトーシェント関数

$\phi(n)$ は $1$ 以上 $n$ 以下の整数のうち $n$ と互いに素なものの個数。$n$ の素因数を $p_1, p_2, \ldots, p_k$ とし、$A_i$ を $p_i$ の倍数の集合とすると:

$$
\phi(n) = n \prod_{i=1}^{k} \left(1 - \frac{1}{p_i}\right)
$$

これは包除原理から導かれる。

### 2. 完全順列 (撹乱順列)

$n$ 個の要素の順列のうち、どの要素も元の位置にないものの数 $D_n$:

$$
D_n = n! \sum_{k=0}^{n} \frac{(-1)^k}{k!}
$$

### 3. 倍数の個数

$1$ から $N$ までの整数のうち、$a_1, a_2, \ldots, a_k$ のいずれかの倍数であるものの個数。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n$ 個の集合 $A_1, \ldots, A_n$ |
| 出力 | $|\bigcup A_i|$ |
| 計算量 | $O(2^n)$ (部分集合列挙) |
| 核心 | 交互の加減算で重複を正確に補正 |
| 応用 | トーシェント関数、完全順列、数え上げ全般 |
