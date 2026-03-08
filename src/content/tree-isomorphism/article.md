---
title: "木の同型判定 解説"
---

## 木の同型とは

2 つの木 $T_1 = (V_1, E_1)$ と $T_2 = (V_2, E_2)$ が**同型 (isomorphic)** であるとは、頂点間の全単射 $f: V_1 \to V_2$ が存在して、$(u, v) \in E_1 \Leftrightarrow (f(u), f(v)) \in E_2$ が成り立つことである。

直感的には、ラベルを無視した木の「形」が同じかどうかの判定問題である。

## 一般グラフとの違い

一般のグラフ同型判定は、計算量的に難しい問題 (P に属するかも NP 完全かも未解決) であるが、木の場合は $O(n)$ で判定可能である。これは木の構造が制約されていることによる。

## 木の中心

### 定義

木の**中心 (center)** とは、偏心度 (最遠頂点までの距離) が最小の頂点のことである。

$$
\text{ecc}(v) = \max_{u \in V} d(v, u)
$$
$$
\text{center}(T) = \arg\min_{v \in V} \text{ecc}(v)
$$

### 性質

- 木の中心は 1 つまたは 2 つ (隣接する場合) である
- 葉を繰り返し除去していくと中心が残る

### 中心の計算

```python title="tree_center.py"
def find_center(n: int, adj: list[list[int]]) -> list[int]:
    if n == 1:
        return [0]
    degree = [len(adj[v]) for v in range(n)]
    leaves = [v for v in range(n) if degree[v] <= 1]
    remaining = n
    while remaining > 2:
        new_leaves = []
        for leaf in leaves:
            remaining -= 1
            for v in adj[leaf]:
                degree[v] -= 1
                if degree[v] == 1:
                    new_leaves.append(v)
        leaves = new_leaves
    return leaves
```

## 正規形 (AHU アルゴリズム)

### 核心アイデア

木を中心で根付き木にし、各部分木の「正規形」を葉から根へボトムアップで計算する。同型な木は同じ正規形を持つ。

### 正規形の定義

根付き木 $T$ の頂点 $v$ の正規形 $\text{canon}(v)$ を以下のように再帰的に定義する:

- $v$ が葉なら $\text{canon}(v) = \text{"()"}$
- $v$ の子を $c_1, c_2, \ldots, c_k$ とする。$\text{canon}(c_1), \ldots, \text{canon}(c_k)$ を辞書順にソートし、連結して括弧で囲む

$$
\text{canon}(v) = \text{"("} + \text{sort}(\text{canon}(c_1), \ldots, \text{canon}(c_k)) + \text{")"}
$$

### 例

木:
```
    0
   / \
  1   2
 /
3
```

- $\text{canon}(3) = \text{"()"}$
- $\text{canon}(1) = \text{"(())"}$
- $\text{canon}(2) = \text{"()"}$
- $\text{canon}(0) = \text{"(()())"}$ (子の正規形 "(())" と "()" をソートして連結)

### 同型判定の手順

1. 両方の木の中心を求める
2. 中心を根として正規形を計算
3. 根の正規形が一致すれば同型

中心が 2 つある場合は、両方の根で試す。

### 実装

```python title="tree_isomorphism.py"
def canonical_form(root: int, adj: list[list[int]], parent: int) -> str:
    children_forms = []
    for v in adj[root]:
        if v != parent:
            children_forms.append(canonical_form(v, adj, root))
    children_forms.sort()
    return "(" + "".join(children_forms) + ")"

def are_isomorphic(
    n1: int, adj1: list[list[int]],
    n2: int, adj2: list[list[int]]
) -> bool:
    if n1 != n2:
        return False

    center1 = find_center(n1, adj1)
    center2 = find_center(n2, adj2)

    forms1 = set()
    for c in center1:
        forms1.add(canonical_form(c, adj1, -1))

    for c in center2:
        if canonical_form(c, adj2, -1) in forms1:
            return True

    return False
```

## 計算量

### 素朴な実装

正規形文字列の長さは $O(n)$ であり、各ノードで子の正規形をソートする。素朴にはソートに $O(n \log n)$ かかり得るが、全体では $O(n \log n)$ に収まる。

### AHU アルゴリズム

AHU (Aho, Hopcroft, Ullman) アルゴリズムは、正規形を文字列ではなく整数のタプルで表現し、ハッシュを使って $O(n)$ で同型判定を行う。

| 項目 | 計算量 |
|------|--------|
| 中心の計算 | $O(n)$ |
| 正規形 (文字列) | $O(n \log n)$ |
| AHU アルゴリズム | $O(n)$ |

## ハッシュによる高速化

文字列の比較は長さ $O(n)$ かかるが、ハッシュを使えば各ノードのハッシュ値を $O(1)$ で比較できる。

```python title="tree_hash.py"
import random

def tree_hash(root: int, adj: list[list[int]], parent: int) -> int:
    child_hashes = []
    for v in adj[root]:
        if v != parent:
            child_hashes.append(tree_hash(v, adj, root))
    child_hashes.sort()
    # Use polynomial hashing
    h = 1
    for ch in child_hashes:
        h = h * 1000000007 + ch + 1
    return h
```

衝突の可能性があるため、複数のハッシュ関数を組み合わせるか、正規形の完全比較で検証するのが安全である。

## 応用

| 応用 | 説明 |
|------|------|
| 化学構造比較 | 分子構造 (木) の同型判定 |
| コンパイラ | 式木の等価性判定 |
| データベース | XML/JSON ツリーの比較 |
| 対称性検出 | 木の自己同型群の計算 |

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 2 つの木 $T_1, T_2$ |
| 出力 | 同型かどうかの判定 |
| 時間計算量 | $O(n)$ (AHU) / $O(n \log n)$ (正規形文字列) |
| 空間計算量 | $O(n)$ |
| 核心 | 中心で根付き木にして正規形を比較 |
| 応用 | 構造比較、対称性検出 |
