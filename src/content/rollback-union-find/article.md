---
title: "Rollback可能Union-Find 解説"
---

## Union-Find の復習

Union-Find (素集合データ構造 / Disjoint Set Union) は、$n$ 個の要素を互いに素な集合に分割して管理するデータ構造である。以下の操作を提供する:

- `find(x)`: 要素 $x$ が属する集合の代表元を返す
- `union(x, y)`: 要素 $x$ と $y$ が属する集合を併合する

通常の Union-Find では **union by rank** と **path compression (経路圧縮)** を併用することで、操作あたりならし $O(\alpha(n))$ ($\alpha$ は逆アッカーマン関数) という極めて高速な計算量を実現する。

## Rollback可能Union-Findとは

Rollback可能Union-Findは、通常のUnion-Find (素集合データ構造) に**ロールバック機能**を追加したものである。Union操作の履歴を保存し、任意の過去の状態に巻き戻すことができる。

### なぜ経路圧縮を使えないか

通常のUnion-Findでは経路圧縮 (path compression) を使うが、Rollback可能版では**経路圧縮を行わない**。

経路圧縮は `find(x)` の際にパス上のすべてのノードの親を直接ルートに書き換える操作である。これにより多数のノードの `parent` が一度に変更される。

```
Before find(4):     After find(4):
    0                  0
    |                / | \
    1               1  2  4
    |                  |
    2                  3
    |
    3
    |
    4
```

この変更を undo するには、書き換えられた全ノードの旧 parent を記録する必要があり、`find` 1 回あたり $O(n)$ の履歴を消費してしまう。これでは rollback の効率が著しく悪化する。

一方、union by rank のみを使う場合、`union` 1 回で変更されるのは:

- **parent の変更**: 1 箇所 (rank が小さい方の根の parent を書き換える)
- **rank の変更**: 高々 1 箇所 (同じ rank の場合のみ)

したがって、union 1 回あたり高々 2 エントリの履歴で undo が可能になる。

### union by rank の保証

経路圧縮なしでも union by rank を使えば、木の高さは $O(\log n)$ に抑えられる。

**命題:** union by rank で構築された $n$ 要素の Union-Find の木の高さは $O(\log n)$ である。

**証明の概略:** rank $r$ の根を持つ木は少なくとも $2^r$ 個のノードを含む (帰納法で示せる)。$n$ 個のノードがあるとき $2^r \leq n$ なので $r \leq \log_2 n$ 。したがって木の高さは $O(\log n)$ であり、`find` は $O(\log n)$ で動作する。

## データ構造

```python title="rollback_union_find.py"
class RollbackUnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.history = []  # (index, old_value, type)

    def find(self, x: int) -> int:
        # No path compression: just follow parent pointers
        while self.parent[x] != x:
            x = self.parent[x]
        return x

    def union(self, x: int, y: int) -> bool:
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return False
        # Union by rank: attach smaller rank tree under larger
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        # Record parent change for ry
        self.history.append((ry, self.parent[ry], 'p'))
        self.parent[ry] = rx
        # Record rank change if needed
        if self.rank[rx] == self.rank[ry]:
            self.history.append((rx, self.rank[rx], 'r'))
            self.rank[rx] += 1
        return True

    def snapshot(self) -> int:
        """Return current history size as a save point."""
        return len(self.history)

    def rollback(self, save_point: int):
        """Undo all operations back to save_point."""
        while len(self.history) > save_point:
            idx, old_val, typ = self.history.pop()
            if typ == 'p':
                self.parent[idx] = old_val
            else:
                self.rank[idx] = old_val
```

### 履歴の構造

`history` は `(index, old_value, type)` のタプルを格納するスタックである。

- `type = 'p'`: `parent[index]` の旧値が `old_value`
- `type = 'r'`: `rank[index]` の旧値が `old_value`

`rollback` はスタックの末尾から順に復元するため、操作を行った逆順に正しく undo される。

## 具体例による動作追跡

5 要素 $\{0, 1, 2, 3, 4\}$ で一連の union/rollback を追跡する。

**初期状態:**

```
parent: [0, 1, 2, 3, 4]
rank:   [0, 0, 0, 0, 0]
history: []
```

**操作 1: union(0, 1)**
- find(0)=0, find(1)=1, rank[0]==rank[1] → parent[1]=0, rank[0]=1
- 履歴: [(1, 1, 'p'), (0, 0, 'r')]

```
parent: [0, 0, 2, 3, 4]
rank:   [1, 0, 0, 0, 0]
    0
    |
    1
```

**操作 2: snapshot() → save_point = 2**

**操作 3: union(2, 3)**
- find(2)=2, find(3)=3, rank[2]==rank[3] → parent[3]=2, rank[2]=1
- 履歴に追加: [(3, 3, 'p'), (2, 0, 'r')]

```
parent: [0, 0, 2, 2, 4]
rank:   [1, 0, 1, 0, 0]
    0    2
    |    |
    1    3
```

**操作 4: union(0, 2)**
- find(0)=0, find(2)=2, rank[0]==rank[2] → parent[2]=0, rank[0]=2
- 履歴に追加: [(2, 2, 'p'), (0, 1, 'r')]

```
parent: [0, 0, 0, 2, 4]
rank:   [2, 0, 1, 0, 0]
      0
     / \
    1   2
        |
        3
```

**操作 5: rollback(2) — save_point=2 まで巻き戻す**

履歴を逆順に復元:
1. pop (0, 1, 'r') → rank[0] = 1
2. pop (2, 2, 'p') → parent[2] = 2
3. pop (2, 0, 'r') → rank[2] = 0
4. pop (3, 3, 'p') → parent[3] = 3

```
parent: [0, 0, 2, 3, 4]
rank:   [1, 0, 0, 0, 0]
    0    2    3    4
    |
    1
```

union(2,3) と union(0,2) の効果がきれいに取り消され、snapshot 時点の状態に戻った。

## 計算量

| 操作 | 計算量 |
|------|--------|
| find | $O(\log n)$ |
| union | $O(\log n)$ |
| snapshot | $O(1)$ |
| rollback | $O(k)$ ($k$ は巻き戻す履歴エントリ数) |

経路圧縮なしのため find は $O(\log n)$ だが、union by rank により木の高さが $O(\log n)$ に保たれるため十分高速である。

rollback 自体は各履歴エントリの復元が $O(1)$ なので、巻き戻すエントリ数に比例する。union 1 回あたりの履歴エントリは高々 2 つなので、$m$ 回の union を rollback するコストは $O(m)$ 。

## 応用

### Offline Dynamic Connectivity

辺の追加・削除をオフラインで処理する問題を考える。各辺が存在する時間区間 $[l, r)$ を時間軸上のセグメント木に載せ、DFS で各ノードを訪問する。

- ノードに入るとき: そのノードに割り当てられた辺を `union`
- ノードから出るとき: `rollback` で `union` を取り消す

これにより、各リーフ (各時刻) での連結成分情報を効率的に計算できる。全体の計算量は $O(Q \log^2 N)$ 。

### 分割統治による辺の管理

時間軸上の分割統治でも同様のパターンが使える。区間 $[l, r)$ を処理する再帰関数に入る際に union し、出る際に rollback する。

### 二部グラフ判定のオフライン版

辺の追加・削除がある中で各時刻のグラフが二部グラフかどうかを判定する問題。重み付き Union-Find (各辺にパリティ情報を持たせたもの) を rollback 可能にすることで解ける。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n$ 要素の集合、union/find/rollback 操作列 |
| find | $O(\log n)$ |
| union | $O(\log n)$ |
| snapshot | $O(1)$ |
| rollback | $O(k)$ |
| 核心 | 経路圧縮を使わず、操作履歴を差分記録 |
| 代表的応用 | Offline Dynamic Connectivity |
