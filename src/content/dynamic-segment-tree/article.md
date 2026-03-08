---
title: "動的セグメント木 解説"
---

## 動的セグメント木とは

動的セグメント木 (Dynamic Segment Tree) は、値域が非常に大きい (例えば $10^9$) 場合に、**実際に使用するノードだけを動的に生成する**セグメント木である。

通常のセグメント木では値域 $N$ に対して $O(N)$ のメモリが必要だが、動的セグメント木では実際に更新が行われた位置に関連するノードのみを生成するため、$Q$ 回の更新に対して $O(Q \log N)$ のメモリで済む。

### 計算量

| 操作 | 時間計算量 | 空間計算量 |
|------|-----------|-----------|
| 一点更新 | $O(\log N)$ | $O(\log N)$ |
| 区間クエリ | $O(\log N)$ | - |
| $Q$ 回の操作後の総空間 | - | $O(Q \log N)$ |

ここで $N$ は値域のサイズである。

## 核心アイデア

### 通常のセグメント木の問題点

値域が $10^9$ の場合、通常のセグメント木では $4 \times 10^9$ 個のノードが必要であり、メモリが足りない。

### 解決策

ノードを配列ではなく、ポインタ (参照) ベースで管理する。初期状態ではノードは一つも存在せず、更新クエリが来たときに根から葉までのパス上に必要なノードを生成する。

存在しないノードは値が 0 (または単位元) であるとみなす。

## 実装

```python title="dynamic_segment_tree.py"
class Node:
    def __init__(self):
        self.val = 0
        self.left = None   # left child (Node or None)
        self.right = None  # right child (Node or None)

class DynamicSegmentTree:
    def __init__(self, range_max):
        self.range_max = range_max
        self.root = None

    def update(self, pos, val):
        self.root = self._update(self.root, 0, self.range_max, pos, val)

    def _update(self, node, l, r, pos, val):
        if node is None:
            node = Node()
        if l == r:
            node.val += val
            return node
        mid = (l + r) // 2
        if pos <= mid:
            node.left = self._update(node.left, l, mid, pos, val)
        else:
            node.right = self._update(node.right, mid + 1, r, pos, val)
        left_val = node.left.val if node.left else 0
        right_val = node.right.val if node.right else 0
        node.val = left_val + right_val
        return node

    def query(self, ql, qr):
        return self._query(self.root, 0, self.range_max, ql, qr)

    def _query(self, node, l, r, ql, qr):
        if node is None:
            return 0
        if qr < l or r < ql:
            return 0
        if ql <= l and r <= qr:
            return node.val
        mid = (l + r) // 2
        return (self._query(node.left, l, mid, ql, qr) +
                self._query(node.right, mid + 1, r, ql, qr))
```

## 通常のセグメント木との比較

| 特性 | 通常のセグメント木 | 動的セグメント木 |
|------|-------------------|-----------------|
| 構築方法 | 配列ベース (事前確保) | ポインタベース (動的生成) |
| メモリ | $O(N)$ | $O(Q \log N)$ |
| 値域制限 | 小さい値域のみ | 大きい値域にも対応 |
| 定数倍 | 速い | やや遅い |
| 座標圧縮 | 不要 (小さい値域) | 不要 |

## 座標圧縮との比較

大きな値域を扱う別のアプローチとして**座標圧縮**がある。クエリをオフラインで処理できる場合、座標圧縮して通常のセグメント木を使うほうが効率的である。

しかし、オンラインクエリ (クエリが逐次的に与えられる) の場合や、永続化と組み合わせる場合には動的セグメント木が有用である。

## 永続化との組み合わせ

動的セグメント木は永続セグメント木と同じくポインタベースであるため、永続化と自然に組み合わせられる。更新時にパス複製を行えば、過去のバージョンを保持しつつ大きな値域にも対応できる。

## まとめ

| 項目 | 内容 |
|------|------|
| 一点更新 | $O(\log N)$ |
| 区間クエリ | $O(\log N)$ |
| 空間 ($Q$ 回操作) | $O(Q \log N)$ |
| 核心 | 必要なノードのみを動的に生成 |
| 利点 | 大きな値域でもメモリ効率が良い |
| 応用 | オンラインクエリ、永続化との組み合わせ |
