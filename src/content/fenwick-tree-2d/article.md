---
title: "2次元BIT 解説"
---

## 2次元BIT とは

2次元 BIT (2D Binary Indexed Tree / 2D Fenwick Tree) は、1次元の BIT を2次元に拡張したデータ構造である。$H \times W$ のグリッド上での**一点加算**と**矩形領域の累積和**を $O(\log H \cdot \log W)$ で処理できる。

### 計算量

| 操作 | 時間計算量 |
|------|-----------|
| 構築 | $O(HW)$ |
| 一点加算 | $O(\log H \cdot \log W)$ |
| 矩形累積和 | $O(\log H \cdot \log W)$ |
| 空間計算量 | $O(HW)$ |

## 構造

1次元 BIT では各インデックスが「ある区間の和」を保持していたのと同様に、2次元 BIT では各セル $(i, j)$ が「ある矩形領域の和」を保持する。

具体的には、`bit[i][j]` は行方向に $[i - \text{LSB}(i) + 1, i]$、列方向に $[j - \text{LSB}(j) + 1, j]$ の矩形領域の和を保持する。

## 実装

### 一点加算

```python title="fenwick_2d_add.py"
def add(bit, H, W, r, c, val):
    """Add val to position (r, c), both 1-indexed"""
    x = r
    while x <= H:
        y = c
        while y <= W:
            bit[x][y] += val
            y += y & (-y)
        x += x & (-x)
```

### 矩形累積和

$[1, r] \times [1, c]$ の累積和:

```python title="fenwick_2d_sum.py"
def prefix_sum(bit, r, c):
    """Sum of [1..r][1..c]"""
    s = 0
    x = r
    while x > 0:
        y = c
        while y > 0:
            s += bit[x][y]
            y -= y & (-y)
        x -= x & (-x)
    return s
```

### 任意の矩形の和

矩形 $[r_1, r_2] \times [c_1, c_2]$ の和は包除原理で求められる:

$$
\text{sum}(r_1, c_1, r_2, c_2) = S(r_2, c_2) - S(r_1{-}1, c_2) - S(r_2, c_1{-}1) + S(r_1{-}1, c_1{-}1)
$$

ここで $S(r, c) = \text{prefix\_sum}(r, c)$ である。

```python title="fenwick_2d_range.py"
def range_sum(bit, r1, c1, r2, c2):
    return (prefix_sum(bit, r2, c2)
            - prefix_sum(bit, r1 - 1, c2)
            - prefix_sum(bit, r2, c1 - 1)
            + prefix_sum(bit, r1 - 1, c1 - 1))
```

## 完全な実装

```python title="fenwick_tree_2d.py"
class FenwickTree2D:
    def __init__(self, H, W):
        self.H = H
        self.W = W
        self.bit = [[0] * (W + 1) for _ in range(H + 1)]

    def add(self, r, c, val):
        """1-indexed"""
        x = r
        while x <= self.H:
            y = c
            while y <= self.W:
                self.bit[x][y] += val
                y += y & (-y)
            x += x & (-x)

    def prefix_sum(self, r, c):
        s = 0
        x = r
        while x > 0:
            y = c
            while y > 0:
                s += self.bit[x][y]
                y -= y & (-y)
            x -= x & (-x)
        return s

    def range_sum(self, r1, c1, r2, c2):
        return (self.prefix_sum(r2, c2)
                - self.prefix_sum(r1 - 1, c2)
                - self.prefix_sum(r2, c1 - 1)
                + self.prefix_sum(r1 - 1, c1 - 1))
```

## 応用

### 2次元の転倒数

2次元平面上の点集合に対して、特定の順序関係を持つペアの数を数える問題に応用できる。

### 動的な2次元累積和

元のグリッドが変化する場合に、毎回全体の累積和を再計算する代わりに、2次元BITで効率的に管理できる。

## まとめ

| 項目 | 内容 |
|------|------|
| 一点加算 | $O(\log H \cdot \log W)$ |
| 矩形累積和 | $O(\log H \cdot \log W)$ |
| 空間 | $O(HW)$ |
| 核心 | 1次元BITの2次元への拡張 |
| 利点 | 実装が簡潔 |
