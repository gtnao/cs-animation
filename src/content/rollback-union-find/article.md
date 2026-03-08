---
title: "Rollback可能Union-Find 解説"
---

## Rollback可能Union-Findとは

Rollback可能Union-Findは、通常のUnion-Find (素集合データ構造) に**ロールバック機能**を追加したものである。Union操作の履歴を保存し、任意の過去の状態に巻き戻すことができる。

### 制約

通常のUnion-Findでは経路圧縮 (path compression) を使うが、Rollback可能版では**経路圧縮を行わない** (union by rank/size のみ)。これは経路圧縮が非可逆な変更を行うためである。

## データ構造

```python title="rollback_union_find.py"
class RollbackUnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.history = []  # (index, old_value, type)
    
    def find(self, x: int) -> int:
        while self.parent[x] != x:
            x = self.parent[x]
        return x
    
    def union(self, x: int, y: int) -> bool:
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return False
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.history.append((ry, self.parent[ry], 'p'))
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]:
            self.history.append((rx, self.rank[rx], 'r'))
            self.rank[rx] += 1
        return True
    
    def snapshot(self) -> int:
        return len(self.history)
    
    def rollback(self, save_point: int):
        while len(self.history) > save_point:
            idx, old_val, typ = self.history.pop()
            if typ == 'p':
                self.parent[idx] = old_val
            else:
                self.rank[idx] = old_val
```

## 計算量

| 操作 | 計算量 |
|------|--------|
| find | $O(\log n)$ |
| union | $O(\log n)$ |
| rollback | $O(k)$ ($k$ は巻き戻す操作数) |

経路圧縮なしのため find は $O(\log n)$ だが、union by rank により十分高速である。

## 応用

- **Offline Dynamic Connectivity**: 辺の追加・削除をセグメント木上で管理し、各ノードでunion/rollbackする
- **分割統治**: 時間軸上の分割統治でUnion-Findの状態を管理
- **二部グラフ判定のオフライン版**

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n$ 要素の集合、union/find/rollback 操作列 |
| find | $O(\log n)$ |
| union | $O(\log n)$ |
| rollback | $O(k)$ |
| 核心 | 経路圧縮を使わず、操作履歴を保存 |
