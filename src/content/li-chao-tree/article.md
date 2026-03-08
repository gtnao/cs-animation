---
title: "Li Chao Tree 解説"
---

## Li Chao Tree とは

Li Chao Tree (李超セグメント木) は、**直線の追加**と**任意の $x$ 座標での最小値 (最大値) クエリ**を効率的に処理するセグメント木の変種である。Convex Hull Trick の一般化とみなせる。

## 問題設定

以下の2種類の操作を処理する:

- `add(a, b)`: 直線 $y = ax + b$ を追加
- `query(x)`: 現在登録されている全直線の中で、$x$ における最小値を返す

## アルゴリズム

各ノードには1本の直線を保存する。新しい直線を追加する際、区間の中点で比較し、中点で勝つ方をそのノードに残し、負ける方を再帰的に適切な子に送る。

```python title="li_chao_tree.py"
class LiChaoTree:
    def __init__(self, lo: int, hi: int):
        self.lo, self.hi = lo, hi
        self.line = None
        self.left = self.right = None
    
    def add(self, a: int, b: int):
        self._add(a, b, self.lo, self.hi)
    
    def _add(self, a, b, lo, hi):
        mid = (lo + hi) // 2
        if self.line is None:
            self.line = (a, b)
            return
        
        ca, cb = self.line
        left_better = a * lo + b < ca * lo + cb
        mid_better = a * mid + b < ca * mid + cb
        
        if mid_better:
            self.line, (a, b) = (a, b), (ca, cb)
            left_better = not left_better
        
        if lo + 1 >= hi:
            return
        
        if left_better:
            if self.left is None:
                self.left = LiChaoTree(lo, mid)
            self.left._add(a, b, lo, mid)
        else:
            if self.right is None:
                self.right = LiChaoTree(mid, hi)
            self.right._add(a, b, mid, hi)
    
    def query(self, x: int) -> float:
        return self._query(x, self.lo, self.hi)
    
    def _query(self, x, lo, hi):
        mid = (lo + hi) // 2
        val = float('inf')
        if self.line:
            a, b = self.line
            val = a * x + b
        if lo + 1 >= hi:
            return val
        if x < mid and self.left:
            val = min(val, self.left._query(x, lo, mid))
        elif x >= mid and self.right:
            val = min(val, self.right._query(x, mid, hi))
        return val
```

## 計算量

| 操作 | 計算量 |
|------|--------|
| add | $O(\log C)$ ($C$ は座標範囲) |
| query | $O(\log C)$ |

## Convex Hull Trick との違い

- CHT: 直線の傾きに単調性が必要な場合がある
- Li Chao Tree: 任意の順序で直線を追加可能

## まとめ

| 項目 | 内容 |
|------|------|
| 操作 | 直線追加、最小値クエリ |
| 時間計算量 | $O(\log C)$ per operation |
| 空間計算量 | $O(N \log C)$ |
