---
title: "永続データ構造全般 解説"
---

## 永続データ構造とは

永続データ構造 (Persistent Data Structure) は、更新操作を行っても過去のバージョンを破壊せず保持するデータ構造である。任意の過去の時点の状態にアクセスできる。

## 種類

### 部分永続 (Partially Persistent)

過去のバージョンは参照のみ可能。更新は常に最新バージョンに対して行う。

### 完全永続 (Fully Persistent)

過去の任意のバージョンに対して更新操作を行い、新しいバージョンを作ることができる。

## 実現方法: パス複写法 (Path Copying)

木構造のデータ構造で、更新されるノードから根までのパスのみを新しくコピーし、残りは元のバージョンと共有する。

```python title="persistent_array.py"
class Node:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build(a: list[int], lo: int, hi: int) -> Node:
    if lo == hi:
        return Node(val=a[lo])
    mid = (lo + hi) // 2
    return Node(
        left=build(a, lo, mid),
        right=build(a, mid + 1, hi)
    )

def update(node: Node, lo: int, hi: int, idx: int, val: int) -> Node:
    if lo == hi:
        return Node(val=val)
    mid = (lo + hi) // 2
    if idx <= mid:
        return Node(left=update(node.left, lo, mid, idx, val), right=node.right)
    else:
        return Node(left=node.left, right=update(node.right, mid + 1, hi, idx, val))

def query(node: Node, lo: int, hi: int, idx: int) -> int:
    if lo == hi:
        return node.val
    mid = (lo + hi) // 2
    if idx <= mid:
        return query(node.left, lo, mid, idx)
    else:
        return query(node.right, mid + 1, hi, idx)
```

## 計算量

| 操作 | 計算量 |
|------|--------|
| build | $O(n)$ |
| update | $O(\log n)$ |
| query | $O(\log n)$ |
| 空間 (1更新あたり) | $O(\log n)$ |

## 応用

- **永続セグメント木**: 区間クエリの過去バージョン参照
- **永続Union-Find**: 部分永続のUnion-Find
- **関数型プログラミング**: 不変データ構造の基盤

## まとめ

| 項目 | 内容 |
|------|------|
| 核心 | パス複写法で差分のみコピー |
| 更新 | $O(\log n)$ 時間、$O(\log n)$ 空間 |
| クエリ | $O(\log n)$ |
