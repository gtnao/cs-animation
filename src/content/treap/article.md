---
title: "Treap 解説"
---

## Treap とは

**Treap** は、Tree (木) と Heap (ヒープ) を組み合わせたデータ構造であり、1989年にAragonとSeidelによって提案された。各ノードが**キー** (BST性質) と**優先度** (ヒープ性質) の2つの値を持ち、以下の両方を同時に満たす二分木である。

1. **BST性質**: キーについて二分探索木の性質を満たす
2. **ヒープ性質**: 優先度について最小ヒープ (または最大ヒープ) の性質を満たす

### 定義

Treap の各ノード $v$ は $(k_v, p_v)$ のペアを持ち、以下を満たす。

- BST性質: 左部分木の全キー $< k_v <$ 右部分木の全キー
- ヒープ性質: $p_v \leq p_{\text{children}(v)}$ (最小ヒープの場合)

### 一意性

**定理:** $n$ 個の異なるキーと異なる優先度の組 $(k_1, p_1), \ldots, (k_n, p_n)$ に対して、Treap の形は一意に決まる。

**証明:** 最小の優先度を持つノード $(k_i, p_i)$ がヒープ性質より根になる。BST性質より $k_i$ より小さいキーは左部分木に、大きいキーは右部分木に属する。帰納的に各部分木も一意に決まる。 $\square$

## ランダム化 Treap

優先度をランダムに生成することで、木の形がランダムな二分探索木と同じ期待構造を持つようになる。

**定理:** ランダム化 Treap の期待高さは $O(\log n)$ である。

これは $n$ 個のキーをランダム順に挿入したBSTの期待高さと同じである。ランダムな優先度の割り当てが、キーの挿入順のランダム化と同等の効果を持つためである。

## 基本操作

### 挿入

1. BST挿入で葉にノードを追加 (優先度はランダム生成)
2. ヒープ性質が満たされるまで回転で上に持ち上げる

```python title="treap_insert.py"
import random

def insert(node, key):
    priority = random.random()
    return _insert(node, key, priority)

def _insert(node, key, priority):
    if node is None:
        return TreapNode(key, priority)
    if key < node.key:
        node.left = _insert(node.left, key, priority)
        if node.left.priority < node.priority:
            node = right_rotate(node)
    elif key > node.key:
        node.right = _insert(node.right, key, priority)
        if node.right.priority < node.priority:
            node = left_rotate(node)
    return node
```

### 削除

削除対象を回転で葉まで押し下げてから削除する。

```python title="treap_delete.py"
def delete(node, key):
    if node is None:
        return None
    if key < node.key:
        node.left = delete(node.left, key)
    elif key > node.key:
        node.right = delete(node.right, key)
    else:
        # Found: rotate down to leaf
        if node.left is None:
            return node.right
        if node.right is None:
            return node.left
        if node.left.priority < node.right.priority:
            node = right_rotate(node)
            node.right = delete(node.right, key)
        else:
            node = left_rotate(node)
            node.left = delete(node.left, key)
    return node
```

### Split と Merge

Treap は Split (分割) と Merge (併合) の操作を自然にサポートする。

**Split(T, k):** Treap $T$ をキー $k$ で分割し、$k$ 以下のノードからなる木 $L$ と $k$ より大きいノードからなる木 $R$ を返す。

**Merge(L, R):** $L$ の全キー $< R$ の全キーであるとき、$L$ と $R$ を1つの Treap に併合する。

```python title="split_merge.py"
def split(node, key):
    if node is None:
        return None, None
    if node.key <= key:
        left, right = split(node.right, key)
        node.right = left
        return node, right
    else:
        left, right = split(node.left, key)
        node.left = right
        return left, node

def merge(left, right):
    if left is None:
        return right
    if right is None:
        return left
    if left.priority < right.priority:
        left.right = merge(left.right, right)
        return left
    else:
        right.left = merge(left, right.left)
        return right
```

## 計算量

| 操作 | 期待計算量 |
|------|-----------|
| 探索 | $O(\log n)$ |
| 挿入 | $O(\log n)$ |
| 削除 | $O(\log n)$ |
| Split | $O(\log n)$ |
| Merge | $O(\log n)$ |

全ての操作が期待 $O(\log n)$ であることは、ランダム化 Treap の期待高さが $O(\log n)$ であることから直ちに従う。

## まとめ

| 項目 | 内容 |
|------|------|
| 提案者 | Aragon, Seidel (1989) |
| 性質 | BST + ヒープの二重性質 |
| 平衡保証 | 期待 $O(\log n)$ (ランダム優先度) |
| 核心 | ランダム優先度による暗黙的ランダム化 |
| 利点 | 実装が簡潔、Split/Merge が自然 |
| 用途 | 順序統計量、区間クエリなど |
