---
title: "Cartesian Tree 解説"
---

## Cartesian Tree とは

Cartesian Tree は、配列 $A[0..n-1]$ から構築される二分木で、以下の2つの性質を同時に満たす:

1. **ヒープ性**: 各ノードの値はその子孫の値以下 (最小ヒープの場合)
2. **BST性 (中間順序)**: 中間順走査 (inorder traversal) が元の配列と一致

### 一意性

配列の全要素が異なる場合、Cartesian Tree は一意に定まる。

## 構築アルゴリズム

### スタックを使った $O(n)$ 構築

```python title="cartesian_tree.py"
def build_cartesian_tree(a: list[int]):
    n = len(a)
    parent = [-1] * n
    left = [-1] * n
    right = [-1] * n
    stack = []
    
    for i in range(n):
        last_popped = -1
        while stack and a[stack[-1]] > a[i]:
            last_popped = stack.pop()
        
        if last_popped != -1:
            left[i] = last_popped
            parent[last_popped] = i
        
        if stack:
            right[stack[-1]] = i
            parent[i] = stack[-1]
        
        stack.append(i)
    
    root = stack[0]
    return root, left, right
```

### 動作原理

右背骨 (right spine) 上にスタックを維持する。新しい要素がスタックの先頭より小さければ pop し、最後に pop した要素を新しいノードの左の子にする。

## 計算量

各要素は高々1回 push、1回 pop されるため:

$$
T(n) = O(n)
$$

## RMQ との関係

Cartesian Tree の根は配列の最小値であり、任意の区間 $[l, r]$ の最小値は $l$ と $r$ の LCA (最近共通祖先) に対応する。

$$
\text{RMQ}(l, r) = \text{LCA}_{\text{Cartesian}}(l, r)
$$

## 応用

- **RMQ (Range Minimum Query)**: Cartesian Tree + LCA で $O(n)$ 前処理、$O(1)$ クエリ
- **ヒストグラム中の最大長方形**
- **Treap**: ランダムな優先度を使った Cartesian Tree

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n$ の配列 |
| 構築 | $O(n)$ |
| 性質 | ヒープ性 + 中間順序 = 元配列 |
| 応用 | RMQ、最大長方形 |
