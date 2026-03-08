---
title: "Merge Sort Tree 解説"
---

## Merge Sort Tree とは

Merge Sort Tree は、セグメント木の各ノードに**ソート済みの部分列**を格納するデータ構造である。これにより、区間に対する「$x$ 以下の要素数」「$k$ 番目に小さい要素」などのクエリを効率的に処理できる。

構造自体はマージソートの過程で生じる中間配列をそのまま保持したものと見なせる。

### 計算量

| 操作 | 時間計算量 |
|------|-----------|
| 構築 | $O(n \log n)$ |
| 区間で $x$ 以下の個数 | $O(\log^2 n)$ |
| 区間 $k$ 番目 (二分探索併用) | $O(\log^3 n)$ |
| 空間計算量 | $O(n \log n)$ |

## 構造

### 各ノードが持つ情報

ノードが区間 $[l, r]$ を担当するとき、そのノードは $a[l], a[l+1], \ldots, a[r]$ をソートした配列を持つ。

- 葉ノード: 要素 1 つのソート済み配列 $[a[i]]$
- 内部ノード: 左右の子のソート済み配列をマージした配列

### 例

配列 $[3, 1, 4, 1, 5, 9, 2, 6]$ に対する Merge Sort Tree:

| ノード | 区間 | ソート済み配列 |
|--------|------|---------------|
| 根 | $[0, 7]$ | $[1, 1, 2, 3, 4, 5, 6, 9]$ |
| 左 | $[0, 3]$ | $[1, 1, 3, 4]$ |
| 右 | $[4, 7]$ | $[2, 5, 6, 9]$ |

### 空間計算量

木の各深さで、全ノードの配列の要素数の合計は $n$ である。深さは $O(\log n)$ なので、総空間は $O(n \log n)$ である。

## 構築

マージソートと同じ要領で、ボトムアップに構築する。

```python title="merge_sort_tree_build.py"
def build(tree, arr, node, start, end):
    if start == end:
        tree[node] = [arr[start]]
        return
    mid = (start + end) // 2
    build(tree, arr, 2 * node, start, mid)
    build(tree, arr, 2 * node + 1, mid + 1, end)
    # Merge two sorted arrays
    tree[node] = merge(tree[2 * node], tree[2 * node + 1])

def merge(a, b):
    result = []
    i, j = 0, 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            result.append(a[i]); i += 1
        else:
            result.append(b[j]); j += 1
    result.extend(a[i:])
    result.extend(b[j:])
    return result
```

構築の時間計算量はマージソートと同じ $O(n \log n)$ である。

## クエリ: x 以下の要素数

区間 $[l, r]$ で $x$ 以下の要素数を求めるには、セグメント木のクエリと同じ要領で分解し、各ノードのソート済み配列に対して二分探索を行う。

```python title="merge_sort_tree_query.py"
from bisect import bisect_right

def count_le(tree, node, start, end, l, r, x):
    if r < start or end < l:
        return 0
    if l <= start and end <= r:
        return bisect_right(tree[node], x)
    mid = (start + end) // 2
    return (count_le(tree, 2 * node, start, mid, l, r, x) +
            count_le(tree, 2 * node + 1, mid + 1, end, l, r, x))
```

各深さで高々 2 個のノードに対して二分探索 ($O(\log n)$) を行い、深さは $O(\log n)$ なので、計算量は $O(\log^2 n)$ である。

## 応用: 区間 K 番目に小さい要素

区間 $[l, r]$ で $k$ 番目に小さい要素を求めるには、答えの値 $x$ について二分探索を行う。

「$x$ 以下の要素数が $k$ 以上になる最小の $x$」を求めればよい。値域上の二分探索に $O(\log V)$、各判定に $O(\log^2 n)$ かかるので、全体で $O(\log^2 n \cdot \log V)$ または $O(\log^3 n)$ (値域が配列の要素と同程度の場合) である。

## Fractional Cascading による高速化

Fractional Cascading を適用すると、各ノードでの二分探索を $O(1)$ に削減でき、クエリを $O(\log n)$ に改善できる。ただし実装が複雑になるため、競技プログラミングでは $O(\log^2 n)$ の実装がよく使われる。

## まとめ

| 項目 | 内容 |
|------|------|
| 構築 | $O(n \log n)$ |
| $x$ 以下の個数 | $O(\log^2 n)$ |
| $k$ 番目の要素 | $O(\log^3 n)$ |
| 空間 | $O(n \log n)$ |
| 核心 | セグメント木の各ノードにソート済み配列を保持 |
| 応用 | 区間順位クエリ、区間 K-th smallest |
