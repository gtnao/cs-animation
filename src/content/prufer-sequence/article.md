---
title: "Prufer Sequence 解説"
---

## Prufer Sequence とは

**Prufer 列 (Prufer sequence)** は、$n$ 頂点のラベル付き木を長さ $n - 2$ の整数列にエンコードする方法である。この対応は全単射であり、Cayley の公式 $n^{n-2}$ (ラベル付き木の数) の証明に使われる。

### 定義

$n$ 頂点のラベル付き木 $T$ に対して、以下の手順で長さ $n - 2$ の列 $a_1, a_2, \ldots, a_{n-2}$ を生成する:

1. 現在の木のラベル最小の葉 $v$ を選ぶ
2. $v$ の唯一の隣接頂点 $u$ を列に追加する ($a_i = u$)
3. $v$ を木から削除する
4. 木に 2 頂点が残るまで繰り返す

得られた列 $a_1, a_2, \ldots, a_{n-2}$ を **Prufer 列** と呼ぶ。各 $a_i \in \{0, 1, \ldots, n-1\}$ である。

### 具体例

木: 0-1, 0-2, 0-3, 3-4

| ステップ | 最小の葉 | 隣接ノード | Prufer列 |
|----------|----------|------------|----------|
| 1 | 1 | 0 | [0] |
| 2 | 2 | 0 | [0, 0] |
| 3 | 4 | 3 | [0, 0, 3] |

Prufer 列: [0, 0, 3]

## エンコード

### 実装

```python title="prufer_encode.py"
def prufer_encode(n: int, adj: list[list[int]]) -> list[int]:
    degree = [len(adj[v]) for v in range(n)]
    prufer = []
    removed = [False] * n

    for _ in range(n - 2):
        # Find smallest leaf
        leaf = -1
        for v in range(n):
            if not removed[v] and degree[v] == 1:
                leaf = v
                break

        # Find its neighbor
        for u in adj[leaf]:
            if not removed[u]:
                prufer.append(u)
                degree[u] -= 1
                break

        removed[leaf] = True
        degree[leaf] = 0

    return prufer
```

### 計算量

素朴な実装は $O(n^2)$ だが、最小葉を効率的に管理すれば $O(n)$ にできる。

```python title="prufer_encode_linear.py"
def prufer_encode_linear(n: int, adj: list[list[int]]) -> list[int]:
    degree = [len(adj[v]) for v in range(n)]
    prufer = []
    removed = [False] * n
    ptr = 0

    # Find first leaf
    while degree[ptr] != 1:
        ptr += 1
    leaf = ptr

    for _ in range(n - 2):
        # Find neighbor
        neighbor = -1
        for u in adj[leaf]:
            if not removed[u]:
                neighbor = u
                break

        prufer.append(neighbor)
        removed[leaf] = True
        degree[neighbor] -= 1

        if degree[neighbor] == 1 and neighbor < ptr:
            leaf = neighbor
        else:
            ptr += 1
            while ptr < n and (removed[ptr] or degree[ptr] != 1):
                ptr += 1
            leaf = ptr

    return prufer
```

## デコード

### アルゴリズム

Prufer 列 $a_1, a_2, \ldots, a_{n-2}$ から木を復元する手順:

1. 各頂点の次数を計算: 頂点 $v$ の次数は Prufer 列での出現回数 $+ 1$
2. $i = 1, 2, \ldots, n-2$ について:
   - 次数 1 の最小の頂点 $v$ を選ぶ
   - 辺 $(v, a_i)$ を追加する
   - $v$ と $a_i$ の次数を 1 減らす
3. 最後に次数 1 の 2 頂点を結ぶ辺を追加

### 実装

```python title="prufer_decode.py"
def prufer_decode(n: int, prufer: list[int]) -> list[tuple[int, int]]:
    degree = [1] * n
    for v in prufer:
        degree[v] += 1

    edges = []
    for v in prufer:
        # Find smallest vertex with degree 1
        leaf = -1
        for u in range(n):
            if degree[u] == 1:
                leaf = u
                break

        edges.append((leaf, v))
        degree[leaf] -= 1
        degree[v] -= 1

    # Last edge
    last = [v for v in range(n) if degree[v] == 1]
    edges.append((last[0], last[1]))

    return edges
```

### 計算量

| 項目 | 素朴 | 最適化 |
|------|------|--------|
| エンコード | $O(n^2)$ | $O(n)$ |
| デコード | $O(n^2)$ | $O(n)$ |
| 空間 | $O(n)$ | $O(n)$ |

## 全単射の証明

### 定理: Prufer 列は $n$ 頂点のラベル付き木と $\{0, 1, \ldots, n-1\}^{n-2}$ の間の全単射を与える

**証明:**

エンコードとデコードが互いの逆写像であることを示す。

1. **エンコード → デコードで元に戻る**: エンコード時に削除される葉の順番は、Prufer 列と次数情報から一意に復元できる。デコードアルゴリズムはまさにこの復元を行っている。

2. **デコード → エンコードで元に戻る**: デコードで構成した木をエンコードすると、元の Prufer 列が得られる。これは構成過程で追加した辺が、エンコード時の葉の削除と逆の対応をしていることから従う。

したがって、Prufer 列のエンコードとデコードは全単射である。 $\square$

## Cayley の公式

### 定理 (Cayley): $n$ 頂点のラベル付き木の数は $n^{n-2}$ である

**Prufer 列による証明:**

Prufer 列は木から $\{0, 1, \ldots, n-1\}^{n-2}$ への全単射を与える。$\{0, 1, \ldots, n-1\}^{n-2}$ の要素数は $n^{n-2}$ であるから、ラベル付き木の数も $n^{n-2}$ である。 $\square$

### 具体例

| $n$ | $n^{n-2}$ | 木の例 |
|-----|-----------|--------|
| 2 | 1 | 0-1 |
| 3 | 3 | 0-1-2, 0-2-1, 1-0-2 |
| 4 | 16 | 16通りのラベル付き木 |
| 5 | 125 | 125通りのラベル付き木 |

## 性質

### 頂点の次数

Prufer 列において頂点 $v$ の出現回数を $c(v)$ とすると、元の木における $v$ の次数は $c(v) + 1$ である。

$$
\deg(v) = c(v) + 1
$$

この性質から、次数指定のある木の数え上げが可能になる。

### 列に現れない頂点

Prufer 列に現れない頂点は、元の木の葉 (次数 1 の頂点) である。

## 応用

| 応用 | 説明 |
|------|------|
| Cayley の公式 | ラベル付き木の数え上げ |
| ランダム木生成 | 一様ランダムなラベル付き木の生成 |
| 次数制約付き木の数え上げ | 多項定理との組み合わせ |
| 木の符号化 | 木のコンパクトな表現 |

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n$ 頂点のラベル付き木 |
| 出力 | 長さ $n-2$ の Prufer 列 |
| エンコード | $O(n)$ |
| デコード | $O(n)$ |
| 核心 | ラベル付き木と整数列の全単射 |
| 応用 | Cayley の公式、ランダム木生成 |
