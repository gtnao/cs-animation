---
title: "Union-Find 解説"
---

## Union-Find とは

Union-Find (素集合データ構造、Disjoint Set Union / DSU) は、要素の集まりを互いに素な (重複のない) 集合に分割して管理するデータ構造である。

以下の 2 つの操作を効率的に実行できる:

| 操作 | 説明 |
|------|------|
| `find(x)` | 要素 $x$ が属する集合の代表元 (根) を返す |
| `union(x, y)` | 要素 $x$ と $y$ が属する集合を統合する |

### 具体例

$\{0, 1, 2, 3, 4, 5\}$ の 6 要素から始めて `union` を適用する:

- 初期状態: $\{0\}, \{1\}, \{2\}, \{3\}, \{4\}, \{5\}$
- `union(0, 1)`: $\{0, 1\}, \{2\}, \{3\}, \{4\}, \{5\}$
- `union(2, 3)`: $\{0, 1\}, \{2, 3\}, \{4\}, \{5\}$
- `union(0, 2)`: $\{0, 1, 2, 3\}, \{4\}, \{5\}$

## 素朴な実装

各集合を根付き木で表現する。各要素は親へのポインタを持ち、根 (代表元) は自分自身を親とする。

```python title="union_find_naive.py"
class NaiveUnionFind:
    def __init__(self, n):
        self.parent = list(range(n))

    def find(self, x):
        while self.parent[x] != x:
            x = self.parent[x]
        return x

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx != ry:
            self.parent[rx] = ry
```

この実装では木が偏ると `find` が $O(n)$ になる。

## 最適化

2 つの最適化を組み合わせることで、ほぼ定数時間の操作を実現できる。

### 1. Union by Rank (ランクによる統合)

木の高さ (rank) が小さい方を大きい方に接続する。これにより木の高さが $O(\log n)$ に抑えられる。

```python title="union_find_rank.py"
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        while self.parent[x] != x:
            x = self.parent[x]
        return x

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1
```

#### rank が $O(\log n)$ に抑えられる証明

**補題:** rank $r$ の根を持つ木は少なくとも $2^r$ 個の要素を含む。

**証明 (帰納法):** rank が増加するのは同じ rank $r$ の 2 つの木を統合するときのみ。帰納法の仮定より、各木は少なくとも $2^r$ 個の要素を含むので、統合後は少なくとも $2^{r+1}$ 個の要素を含む。 $\square$

よって $2^r \leq n$ なので $r \leq \log_2 n$。

### 2. 経路圧縮 (Path Compression)

`find(x)` の際に、根までのパス上の全ての要素の親を直接根に付け替える。

```python title="union_find_optimized.py"
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1

    def same(self, x, y):
        return self.find(x) == self.find(y)
```

## 計算量

Union by Rank と経路圧縮を組み合わせた場合:

| 操作 | 償却計算量 |
|------|------------|
| `find(x)` | $O(\alpha(n))$ |
| `union(x, y)` | $O(\alpha(n))$ |
| 初期化 | $O(n)$ |

ここで $\alpha(n)$ は **逆アッカーマン関数** である。$\alpha(n)$ は極めてゆっくり増加する関数で、実用的な全ての $n$ に対して $\alpha(n) \leq 4$ である。

つまり、**事実上 $O(1)$** と見なせる。

### 逆アッカーマン関数について

アッカーマン関数 $A(m, n)$ は以下のように定義される:

$$
A(m, n) = \begin{cases}
n + 1 & \text{if } m = 0 \\
A(m-1, 1) & \text{if } m > 0 \text{ and } n = 0 \\
A(m-1, A(m, n-1)) & \text{if } m > 0 \text{ and } n > 0
\end{cases}
$$

$A(m, n)$ は非常に急速に増加する。例えば $A(4, 2)$ は宇宙の原子数をはるかに超える。

逆アッカーマン関数 $\alpha(n) = \min\{k : A(k, k) \geq n\}$ は、その逆関数なので非常にゆっくり増加する。$\alpha(2^{2^{2^{65536}}}) = 4$ 程度である。

## 応用

### クラスカル法

最小全域木を求めるクラスカル法では、辺を重み順に処理し、異なる連結成分を繋ぐ辺だけを採用する。Union-Find を使えば、2 つの頂点が同じ連結成分かどうかを効率的に判定できる。

### 連結成分の管理

グラフに辺を逐次追加する動的なシナリオで、連結成分の管理に Union-Find が適している。

### 等価クラスの管理

要素間の「同値関係」を管理する問題 (例: 画像処理のラベリング) に利用される。

## Union by Size

Union by Rank の代わりに、木のサイズ (要素数) で統合先を決める方法もある。

```python title="union_find_size.py"
class UnionFindSize:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return
        if self.size[rx] < self.size[ry]:
            rx, ry = ry, rx
        self.parent[ry] = rx
        self.size[rx] += self.size[ry]

    def get_size(self, x):
        return self.size[self.find(x)]
```

Union by Size も $O(\alpha(n))$ の計算量を達成する。さらに、各集合のサイズを取得できるという利点がある。

## まとめ

| 項目 | 内容 |
|------|------|
| データ構造 | Union-Find (素集合データ構造) |
| 基本操作 | find, union |
| 償却計算量 | $O(\alpha(n)) \approx O(1)$ |
| 空間計算量 | $O(n)$ |
| 最適化 | Union by Rank + 経路圧縮 |
| 主な応用 | クラスカル法、連結成分管理、等価クラス |
