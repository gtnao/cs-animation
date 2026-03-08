---
title: "Link-Cut Tree 解説"
---

## Link-Cut Tree とは

**Link-Cut Tree** は、Sleator と Tarjan が 1983 年に提案した、**動的な森** (辺の追加・削除が可能な森) を管理するデータ構造である。以下の操作を償却 $O(\log n)$ で処理できる。

| 操作 | 説明 |
|------|------|
| `link(u, v)` | 異なる木に属する頂点 $u$, $v$ を辺で接続 |
| `cut(u, v)` | 辺 $(u, v)$ を削除して木を分割 |
| `find_root(u)` | 頂点 $u$ が属する木の根を返す |
| `path_query(u, v)` | $u$ から $v$ へのパス上の集約値を求める |
| `lca(u, v)` | $u$ と $v$ の最小共通祖先を求める |

## 基本構造

### Preferred Edge と Preferred Path

各頂点 $v$ について、子のうち高々 1 つを**preferred child** (優先子) として選ぶ。$v$ から preferred child への辺を **preferred edge** と呼ぶ。preferred edge を連続的につないだパスを **preferred path** と呼ぶ。

全ての preferred path は互いに頂点を共有しないので、木の頂点集合は preferred path に分割される。

### Splay Tree による表現

各 preferred path は **Splay Tree** で管理される。Splay Tree のキーは元の木での深さ順 (パス上の位置) である。

異なる preferred path の Splay Tree は **path-parent pointer** で接続される。具体的には、preferred path の最も浅い頂点の Splay Tree の根は、元の木でのその頂点の親 (別の preferred path 上の頂点) へのポインタを持つ。

## 核心操作: Access

**`access(v)`** は Link-Cut Tree の最も重要な操作で、頂点 $v$ から根への preferred path を再構築する。

### アルゴリズム

```python title="access.py"
def access(v):
    splay(v)
    # Disconnect right child (cut preferred edge below v)
    v.right = None
    # Walk up to root
    while v.path_parent is not None:
        u = v.path_parent
        splay(u)
        u.right = v  # Set v's path as preferred
        v.path_parent = None
        splay(v)
```

### 直感的な理解

`access(v)` は以下を行う:

1. $v$ を Splay して、現在の preferred path の Splay Tree の根にする
2. $v$ より深い部分の preferred edge を切断 (右の子を外す)
3. path-parent pointer を辿って根に向かいながら、通過する各 preferred path を $v$ の preferred path に統合する

結果として、$v$ から根までの全ての辺が preferred edge になり、一つの Splay Tree で管理される。

## 各操作の実装

### link(u, v)

$u$ を根にしてから、$u$ の path-parent を $v$ に設定する。

```python title="link_cut_operations.py"
def link(u, v):
    make_root(u)  # u's tree is re-rooted at u
    access(u)
    access(v)
    u.path_parent = v
```

### cut(u, v)

$u$ を根にしてから、$v$ を access し、$v$ の左の子 ($u$) を切り離す。

```python title="link_cut_operations.py"
def cut(u, v):
    make_root(u)
    access(v)
    v.left = None  # Disconnect u from v
```

### find_root(u)

$u$ を access した後、Splay Tree の最も左の頂点 (最も浅い = 根) を返す。

### make_root(u)

`access(u)` 後に Splay Tree 全体を反転 (reverse) する。これにより、$u$ を木の根にする。反転操作は遅延伝播で $O(1)$ で行える。

## Splay Tree

Link-Cut Tree の内部で使用される **Splay Tree** は自己調整型の二分探索木である。

### Splay 操作

頂点 $v$ を根まで回転させる操作。3 つの場合がある:

1. **Zig:** $v$ の親が根のとき、1 回の回転
2. **Zig-Zig:** $v$、親、祖父が同じ方向に連なるとき、祖父→親→$v$ の順に回転
3. **Zig-Zag:** $v$、親、祖父がジグザグのとき、親→祖父の順に回転

Zig-Zig のケースで祖父から先に回転させる点が重要で、これにより償却計算量が $O(\log n)$ になる。

## 計算量

### 償却計算量

**定理 (Sleator-Tarjan):** Link-Cut Tree の各操作の償却計算量は $O(\log n)$ である。

**証明の概要:**

ポテンシャル関数 $\Phi = \sum_{v} \log(\mathrm{size}(v))$ を用いる。ここで $\mathrm{size}(v)$ は $v$ を根とする Splay Tree の部分木サイズである。

`access` 操作では、preferred path の変更回数に比例する Splay 操作を行う。Splay 操作の償却計算量は $O(\log n)$ (Splay Tree の標準的な解析) であり、preferred path の変更によるポテンシャルの減少がこれを相殺する。

| 操作 | 償却計算量 |
|------|-----------|
| `access` | $O(\log n)$ |
| `link` | $O(\log n)$ |
| `cut` | $O(\log n)$ |
| `find_root` | $O(\log n)$ |
| `path_query` | $O(\log n)$ |

## Heavy-Light Decomposition との比較

| 項目 | Link-Cut Tree | Heavy-Light Decomposition |
|------|--------------|--------------------------|
| 構造変更 | 動的 (link/cut) | 静的 |
| パスクエリ | $O(\log n)$ 償却 | $O(\log^2 n)$ |
| 実装の複雑さ | 高い | 中程度 |
| 空間計算量 | $O(n)$ | $O(n)$ |
| 定数倍 | 大きめ | 小さめ |

Link-Cut Tree は動的な森の管理が必要な場合に不可欠だが、静的な木では Heavy-Light Decomposition の方が実装が簡単で定数倍も良い。

## 応用

- **最大流 (Dinic's algorithm):** blocking flow の構築にブロッキングフローで使用
- **動的連結性判定:** 辺の追加・削除に対してグラフの連結性を管理
- **動的 LCA:** 木の構造が変化する場合の LCA クエリ
- **最小全域木の動的更新**

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n$ 頂点の動的な森 |
| 操作 | link, cut, find_root, path_query |
| 計算量 | 各操作 償却 $O(\log n)$ |
| 空間 | $O(n)$ |
| 核心 | Preferred path を Splay Tree で管理し、access 操作で path を再構築 |
