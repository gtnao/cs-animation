---
title: "遅延評価セグメント木 解説"
---

## 遅延評価セグメント木とは

遅延評価セグメント木 (Lazy Segment Tree / Segment Tree with Lazy Propagation) は、通常のセグメント木を拡張し、**区間更新**と**区間クエリ**の両方を $O(\log n)$ で処理できるデータ構造である。

通常のセグメント木では一点更新しかサポートしないため、区間 $[l, r]$ の全要素に値を加算するような操作には $O((r - l + 1) \log n)$ かかる。遅延評価を導入することでこれを $O(\log n)$ に改善できる。

### 計算量

| 操作 | 時間計算量 |
|------|-----------|
| 構築 | $O(n)$ |
| 区間更新 | $O(\log n)$ |
| 区間クエリ | $O(\log n)$ |
| 空間計算量 | $O(n)$ |

## 核心アイデア：遅延伝搬

### 問題点

区間 $[l, r]$ の全要素に $v$ を加算する場合、影響を受ける葉は最大 $n$ 個であり、全て更新すると $O(n)$ かかる。

### 解決策

更新をすぐに全てのノードに反映せず、**必要になるまで先送りにする**。これが「遅延 (Lazy)」の名前の由来である。

各ノードに追加の配列 `lazy[]` を持たせ、「このノードの子孫にまだ伝えていない操作」を記録する。子ノードの情報が実際に必要になったとき初めて、遅延値を子に伝搬 (push down) する。

## 遅延伝搬の仕組み

### Push Down

ノード $k$ の遅延値を子に伝搬する操作:

```python title="push_down.py"
def push_down(tree, lazy, node, start, end):
    if lazy[node] != 0:
        mid = (start + end) // 2
        # Left child
        tree[2 * node] += lazy[node] * (mid - start + 1)
        lazy[2 * node] += lazy[node]
        # Right child
        tree[2 * node + 1] += lazy[node] * (end - mid)
        lazy[2 * node + 1] += lazy[node]
        # Clear
        lazy[node] = 0
```

重要なポイント:
- ノードの値 `tree[child]` を更新する際、区間の長さを掛ける (区間和の場合)
- 子の `lazy` 値に累積する
- 伝搬後、親の `lazy` 値を 0 にリセットする

### 区間更新

```python title="range_update.py"
def range_update(tree, lazy, node, start, end, l, r, val):
    if r < start or end < l:
        return
    if l <= start and end <= r:
        tree[node] += val * (end - start + 1)
        lazy[node] += val
        return
    push_down(tree, lazy, node, start, end)
    mid = (start + end) // 2
    range_update(tree, lazy, 2 * node, start, mid, l, r, val)
    range_update(tree, lazy, 2 * node + 1, mid + 1, end, l, r, val)
    tree[node] = tree[2 * node] + tree[2 * node + 1]
```

### 区間クエリ

```python title="range_query.py"
def range_query(tree, lazy, node, start, end, l, r):
    if r < start or end < l:
        return 0
    if l <= start and end <= r:
        return tree[node]
    push_down(tree, lazy, node, start, end)
    mid = (start + end) // 2
    left_val = range_query(tree, lazy, 2 * node, start, mid, l, r)
    right_val = range_query(tree, lazy, 2 * node + 1, mid + 1, end, l, r)
    return left_val + right_val
```

## 正当性の証明

### 不変条件

遅延評価セグメント木は以下の不変条件を保つ:

**ノード $k$ が区間 $[s, e]$ を担当するとき:**

$$
\text{tree}[k] = \sum_{i=s}^{e} a[i] + \text{lazy}[k] \times (e - s + 1)
$$

ここで $a[i]$ は「子孫の遅延値を全て反映した後の」元配列の値ではなく、子孫のノード値から復元される真の配列値である。

### push_down の正当性

push_down 前後で、部分木全体が表す区間和は変わらない。親の遅延値 $\text{lazy}[k]$ を子に分配しているだけだからである。

### 計算量の証明

区間更新・区間クエリともに、セグメント木の各深さで訪れるノードは高々 $O(1)$ 個であり、各ノードの処理は $O(1)$ なので、全体の計算量は $O(\log n)$ である。

## 完全な実装

```python title="lazy_segment_tree.py"
class LazySegmentTree:
    def __init__(self, arr):
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        self.lazy = [0] * (4 * self.n)
        self._build(arr, 1, 0, self.n - 1)

    def _build(self, arr, node, start, end):
        if start == end:
            self.tree[node] = arr[start]
            return
        mid = (start + end) // 2
        self._build(arr, 2 * node, start, mid)
        self._build(arr, 2 * node + 1, mid + 1, end)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def _push_down(self, node, start, end):
        if self.lazy[node] != 0:
            mid = (start + end) // 2
            self.tree[2 * node] += self.lazy[node] * (mid - start + 1)
            self.lazy[2 * node] += self.lazy[node]
            self.tree[2 * node + 1] += self.lazy[node] * (end - mid)
            self.lazy[2 * node + 1] += self.lazy[node]
            self.lazy[node] = 0

    def range_update(self, l, r, val):
        self._range_update(1, 0, self.n - 1, l, r, val)

    def _range_update(self, node, start, end, l, r, val):
        if r < start or end < l:
            return
        if l <= start and end <= r:
            self.tree[node] += val * (end - start + 1)
            self.lazy[node] += val
            return
        self._push_down(node, start, end)
        mid = (start + end) // 2
        self._range_update(2 * node, start, mid, l, r, val)
        self._range_update(2 * node + 1, mid + 1, end, l, r, val)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def query(self, l, r):
        return self._query(1, 0, self.n - 1, l, r)

    def _query(self, node, start, end, l, r):
        if r < start or end < l:
            return 0
        if l <= start and end <= r:
            return self.tree[node]
        self._push_down(node, start, end)
        mid = (start + end) // 2
        return (self._query(2 * node, start, mid, l, r) +
                self._query(2 * node + 1, mid + 1, end, l, r))
```

## 一般化：作用素モノイド

遅延評価セグメント木は**作用素モノイド**の枠組みで一般化できる。

- **値のモノイド** $(M, \cdot, e)$: ノードが持つ値の型と演算
- **作用素のモノイド** $(F, \circ, \text{id})$: 遅延値の型と合成
- **作用** $f \cdot x$: 作用素を値に適用する関数

区間加算・区間和の場合:
- $M = (\mathbb{Z}, +, 0)$
- $F = (\mathbb{Z}, +, 0)$
- 作用: $f \cdot x = x + f \times \text{len}$ (len は区間の長さ)

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n$ の配列 |
| 構築 | $O(n)$ |
| 区間更新 | $O(\log n)$ |
| 区間クエリ | $O(\log n)$ |
| 空間計算量 | $O(n)$ |
| 核心 | 遅延伝搬による更新の先送り |
| 応用 | 区間加算・区間和、区間代入・区間最小値 など |
