---
title: "重心分解 解説"
---

## 重心分解とは

**重心分解 (centroid decomposition)** とは、木の重心を再帰的に求めて分割することで得られる木の分解である。分解によって得られる**分解木 (centroid decomposition tree)** は、元の木上のパスに関するクエリを効率的に処理するために使われる。

### アルゴリズムの概要

1. 現在の木 (成分) の重心 $c$ を求める
2. $c$ を削除して得られる各部分木に対して再帰的に重心分解を行う
3. 再帰で求まった各部分木の重心を $c$ の子とする分解木を構築する

### 分解木の性質

- 分解木の高さは $O(\log n)$
- 分解木の各ノードは元の木の頂点に対応する
- 分解木で頂点 $u$ と $v$ の LCA が $c$ なら、元の木で $u$-$v$ パスは $c$ を経由する

## 分解木の深さの保証

### 定理: 分解木の高さは $O(\log n)$

**証明:**

重心を削除すると、各部分木のサイズは元のサイズの $\lfloor n/2 \rfloor$ 以下である。したがって再帰の各レベルで成分サイズが半分以下に減る。

成分サイズが 1 になるまでの再帰の深さは高々 $\lfloor \log_2 n \rfloor + 1$ である。 $\square$

この性質が重心分解の強力さの源泉である。

## 実装

```python title="centroid_decomposition.py"
def centroid_decomposition(n: int, adj: list[list[int]]) -> list[int]:
    """Returns cd_parent array where cd_parent[v] is v's parent
    in the centroid decomposition tree (-1 for root)."""
    removed = [False] * n
    cd_parent = [-1] * n
    subtree_size = [0] * n

    def get_subtree_size(u: int, p: int) -> int:
        subtree_size[u] = 1
        for v in adj[u]:
            if v != p and not removed[v]:
                subtree_size[u] += get_subtree_size(v, u)
        return subtree_size[u]

    def find_centroid(u: int, p: int, tree_size: int) -> int:
        for v in adj[u]:
            if v != p and not removed[v]:
                if subtree_size[v] > tree_size // 2:
                    return find_centroid(v, u, tree_size)
        return u

    def decompose(u: int, p: int) -> None:
        tree_size = get_subtree_size(u, -1)
        c = find_centroid(u, -1, tree_size)
        cd_parent[c] = p
        removed[c] = True
        for v in adj[c]:
            if not removed[v]:
                decompose(v, c)

    decompose(0, -1)
    return cd_parent
```

### 計算量

| 項目 | 計算量 |
|------|--------|
| 前処理 (分解構築) | $O(n \log n)$ |
| 分解木の高さ | $O(\log n)$ |
| 空間計算量 | $O(n)$ |

各レベルで全頂点を合計 $O(n)$ で処理し、レベル数が $O(\log n)$ なので全体 $O(n \log n)$。

## 応用例

### パスに関するクエリ

木上の 2 頂点 $u, v$ 間のパスに関するクエリは、分解木上で $u$ と $v$ の LCA を利用して処理できる。

典型的なクエリ:
- パス上の頂点数/辺数
- パス上の重みの合計/最大値
- ある頂点から距離 $d$ 以内の頂点数

### 点更新パスクエリ

頂点の重みが更新され、2 頂点間のパス上の重みの合計を求めるクエリに対応できる。

各頂点 $v$ について、分解木上の $v$ から根までのパス上の各祖先 $c$ に対して $\text{dist}(v, c)$ ごとの情報を管理する。

- 更新: 分解木で $v$ から根まで ($O(\log n)$ 個) の祖先を更新
- クエリ: 分解木で $u, v$ から根まで辿り、LCA で集計

### 距離ごとの集計

全頂点対の距離分布を $O(n \log^2 n)$ (FFT 併用) や $O(n \log n)$ で求められる。

## 実装上の注意

- 重心を求める際は、必ず現在の成分のサイズを再計算する
- `removed` フラグで削除済みの頂点を管理する
- 再帰の深さが $O(\log n)$ であることを利用してスタックオーバーフローを回避できる

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n$ 頂点の木 |
| 出力 | 分解木 (各頂点の分解木における親) |
| 前処理 | $O(n \log n)$ |
| 分解木の高さ | $O(\log n)$ |
| 核心 | 重心で分割すると各成分サイズが半分以下 |
| 応用 | パスクエリ、距離集計、点更新クエリ |
