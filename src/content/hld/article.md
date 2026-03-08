---
title: "Heavy-Light Decomposition 解説"
---

## Heavy-Light Decomposition (HL分解) とは

Heavy-Light Decomposition (HL分解、重軽分解) は、木を複数の**パス (チェーン)** に分解するテクニックである。この分解により、木上のパスクエリを列のデータ構造 (セグメント木など) で効率的に処理できるようになる。

## 定義

### ヘビー辺とライト辺

根付き木の各頂点 $u$ について、子 $c$ を選ぶ:

- **ヘビー辺 (Heavy edge):** $u$ の子のうち部分木サイズが最大の子 $c^*$ への辺。$c^* = \arg\max_{c \in \mathrm{children}(u)} \mathrm{size}(c)$
- **ライト辺 (Light edge):** それ以外の子への辺

葉のヘビー辺はない。

### ヘビーチェーン

ヘビー辺を連続的につないだパスを**ヘビーチェーン (Heavy chain)** と呼ぶ。各チェーンの先頭 (最も浅い頂点) を**チェーンヘッド**と呼ぶ。

### 重要な性質

**命題:** 任意の頂点 $v$ から根までのパスは、高々 $O(\log n)$ 本のチェーンを横断する。

**証明:** ライト辺を上に辿るとき、移動先の親の部分木サイズは現在の頂点の部分木サイズの 2 倍以上になる (ライト辺の子は部分木サイズ最大でないため)。部分木サイズは最大 $n$ なので、ライト辺を辿る回数は高々 $\lfloor \log_2 n \rfloor$ 回。ヘビー辺はチェーン内で消化されるため、横断するチェーン数は $O(\log n)$。 $\square$

## アルゴリズム

### ステップ 1: 部分木サイズの計算

DFS で各頂点の部分木サイズを計算する。

```python title="hld.py"
def compute_size(u, parent, adj, size):
    size[u] = 1
    for v in adj[u]:
        if v != parent:
            compute_size(v, u, adj, size)
            size[u] += size[v]
```

### ステップ 2: ヘビー辺の決定

各頂点について、部分木サイズが最大の子をヘビーチルドとする。

### ステップ 3: チェーンへの分解

DFS でヘビーチルドを優先的に辿ることで、各頂点をチェーンに割り当て、同時にオイラーツアー順の番号 (pos) を振る。

```python title="hld.py"
pos = [0]  # counter

def decompose(u, head, parent, adj, chain_head, position, heavy):
    chain_head[u] = head
    position[u] = pos[0]
    pos[0] += 1
    # Heavy child first
    if heavy[u] != -1:
        decompose(heavy[u], head, u, adj, chain_head, position, heavy)
    # Light children
    for v in adj[u]:
        if v != parent and v != heavy[u]:
            decompose(v, v, u, adj, chain_head, position, heavy)
```

ヘビーチルドを最初に辿ることで、同じチェーン内の頂点が pos 配列上で連続になる。

## パスクエリの処理

$u$ から $v$ へのパスクエリは以下のように処理する:

1. $u$ と $v$ が異なるチェーンにいる間:
   - チェーンヘッドが深い方の頂点 (仮に $u$) を選ぶ
   - $[\mathrm{pos}(\mathrm{head}(u)), \mathrm{pos}(u)]$ 区間のクエリを列のデータ構造で処理
   - $u$ を $\mathrm{parent}(\mathrm{head}(u))$ に移動
2. 同じチェーンに入ったら、$[\mathrm{pos}(u), \mathrm{pos}(v)]$ (深さの浅い方が先) の区間クエリを処理

```python title="hld_query.py"
def path_query(u, v, chain_head, position, depth, parent, query_func):
    result = identity  # identity element for the operation
    while chain_head[u] != chain_head[v]:
        # Ensure u is in the deeper chain head
        if depth[chain_head[u]] < depth[chain_head[v]]:
            u, v = v, u
        result = combine(result, query_func(position[chain_head[u]], position[u]))
        u = parent[chain_head[u]]
    # Same chain
    if depth[u] > depth[v]:
        u, v = v, u
    result = combine(result, query_func(position[u], position[v]))
    return result
```

## 計算量

| 項目 | 計算量 |
|------|--------|
| 前計算 (分解) | $O(n)$ |
| パスクエリ | $O(\log^2 n)$ (セグメント木使用時) |
| 空間計算量 | $O(n)$ |

パスクエリが $O(\log^2 n)$ なのは、$O(\log n)$ 本のチェーンを横断し、各チェーンでセグメント木の $O(\log n)$ クエリを実行するためである。

## 応用

### LCA の計算

HL分解を使って LCA を $O(\log n)$ で計算できる:

```python
def lca(u, v, chain_head, depth, parent):
    while chain_head[u] != chain_head[v]:
        if depth[chain_head[u]] < depth[chain_head[v]]:
            u, v = v, u
        u = parent[chain_head[u]]
    return u if depth[u] <= depth[v] else v
```

### パス上の集約クエリ

セグメント木と組み合わせることで、以下のクエリを $O(\log^2 n)$ で処理できる:

- パス上の最大値/最小値
- パス上の合計
- パス上の辺/頂点の更新

### 部分木クエリ

HL分解の DFS 順で pos を振ると、部分木の頂点が連続した区間になる。これにより部分木クエリもセグメント木で処理できる。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n$ 頂点の根付き木 |
| 出力 | チェーン分解、パスクエリの効率的な処理 |
| 前計算 | $O(n)$ |
| パスクエリ | $O(\log^2 n)$ |
| 核心 | 部分木サイズ最大の子へのヘビー辺でチェーンを形成し、チェーン横断回数を $O(\log n)$ に抑える |
