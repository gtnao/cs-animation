---
title: "線分交差判定 解説"
---

## 線分交差判定とは

2つの線分が交差するか (共有点を持つか) を判定する問題である。計算幾何の最も基本的な操作の一つであり、多くのアルゴリズムの構成要素となる。

## 外積を用いた判定法

### 外積 (Cross Product)

2次元ベクトル $\vec{u} = (u_x, u_y)$ と $\vec{v} = (v_x, v_y)$ の外積は以下で定義される。

$$
\vec{u} \times \vec{v} = u_x v_y - u_y v_x
$$

3点 $O, A, B$ に対する **方向 (orientation)** は以下で判定できる。

$$
d = (A - O) \times (B - O)
$$

- $d > 0$: $O \to A \to B$ が反時計回り (左折)
- $d < 0$: $O \to A \to B$ が時計回り (右折)
- $d = 0$: 3点が一直線上

### 判定アルゴリズム

線分 $AB$ と線分 $CD$ が交差するための条件:

1. $C$ と $D$ が直線 $AB$ の異なる側にある (= $AB$ が $CD$ を跨ぐ)
2. $A$ と $B$ が直線 $CD$ の異なる側にある (= $CD$ が $AB$ を跨ぐ)

外積の符号で表すと:

$$
d_1 = \text{cross}(A, B, C), \quad d_2 = \text{cross}(A, B, D)
$$
$$
d_3 = \text{cross}(C, D, A), \quad d_4 = \text{cross}(C, D, B)
$$

$d_1 \cdot d_2 < 0$ かつ $d_3 \cdot d_4 < 0$ ならば交差する。

### 退化ケース

外積が0になる場合 (点が直線上にある場合) は、端点が他の線分上にあるかどうかの追加チェックが必要である。

### 実装

```python title="segment_intersection.py"
def cross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def on_segment(p, q, r):
    return (min(p[0], r[0]) <= q[0] <= max(p[0], r[0]) and
            min(p[1], r[1]) <= q[1] <= max(p[1], r[1]))

def segments_intersect(a, b, c, d):
    d1 = cross(a, b, c)
    d2 = cross(a, b, d)
    d3 = cross(c, d, a)
    d4 = cross(c, d, b)

    if d1 * d2 < 0 and d3 * d4 < 0:
        return True

    if d1 == 0 and on_segment(a, c, b): return True
    if d2 == 0 and on_segment(a, d, b): return True
    if d3 == 0 and on_segment(c, a, d): return True
    if d4 == 0 and on_segment(c, b, d): return True

    return False
```

## 計算量

1組の線分の交差判定は $O(1)$ で行える。$n$ 本の線分全ての交差を列挙する場合は、素朴には $O(n^2)$ だが、Bentley-Ottmann のスイープラインアルゴリズムを使うと $O((n + k) \log n)$ (ただし $k$ は交差点の数) で解ける。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 2つの線分 |
| 出力 | 交差するか否か |
| 時間計算量 | $O(1)$ |
| 核心 | 外積による方向判定 |
