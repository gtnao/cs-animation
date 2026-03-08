---
title: "Edmonds' Blossom Algorithm 解説"
---

## Edmonds' Blossom Algorithm とは

Edmonds' Blossom Algorithm (花の縮約アルゴリズム) は、**一般グラフ** (二部グラフに限らない) の最大マッチングを多項式時間で求めるアルゴリズムである。1965年に Jack Edmonds によって提案された。

二部グラフでは増加パスを単純に探索できるが、一般グラフでは**奇数長サイクル** (花, blossom) の存在により状況が複雑になる。Edmonds のアルゴリズムはこの花を縮約することでこの問題を解決する。

## 一般グラフのマッチング問題

### 二部グラフとの違い

二部グラフでは、交互木 (alternating tree) の構築中に奇数長サイクルは生じない。しかし一般グラフでは、同じラベルの頂点同士が辺で結ばれると奇数長サイクルが発生する。

素朴に増加パスを探すだけでは、このサイクルの中で「行き止まり」になり、実際には存在する増加パスを見逃す可能性がある。

### 花 (Blossom) の定義

マッチング $M$ に対する**花** (blossom) とは、交互木の中に現れる奇数長サイクル $B = v_1, v_2, \ldots, v_{2k+1}, v_1$ であり、以下を満たす:

- $v_1$ がサイクルの基点 (base)
- 辺 $(v_2, v_3), (v_4, v_5), \ldots, (v_{2k}, v_{2k+1})$ がマッチング辺

直感的には、花は「マッチングを再配置する余地がある構造」である。

## アルゴリズムの概要

### 交互木の構築

1. 未マッチの頂点 $r$ をルートとする交互木を BFS で構築
2. 各頂点に偶数 (even) / 奇数 (odd) のラベルを付ける
3. 偶数頂点から非マッチング辺で隣接する頂点を探索

### 3つのケース

偶数頂点 $u$ から辺 $(u, v)$ を見たとき:

1. **$v$ が未マッチかつ木に含まれない**: 増加パスを発見。マッチングを反転して終了
2. **$v$ が木に含まれない (マッチ済み)**: $v$ と $v$ のマッチング相手を木に追加
3. **$v$ が木に含まれ偶数ラベル**: 花を検出。縮約して探索を続行

### 花の縮約

花 $B$ を検出したら:

1. $B$ の全頂点を1つの超頂点 $v_B$ に置き換える
2. $B$ に接続する辺を $v_B$ に接続し直す
3. 縮約後のグラフで増加パスの探索を続ける
4. 増加パスが見つかれば、花を展開してパスを復元

```python title="blossom.py"
def max_matching(graph):
    matching = set()

    while True:
        # Try to find augmenting path
        path = find_augmenting_path(graph, matching)
        if path is None:
            break
        # Augment matching along path
        matching = matching.symmetric_difference(set(path))

    return matching

def find_augmenting_path(graph, matching):
    for root in unmatched_vertices(graph, matching):
        forest = build_alternating_tree(root)
        # During tree construction:
        # - If augmenting path found: return it
        # - If blossom found: contract and continue
    return None
```

## 花の縮約の正当性

### 定理: 花の縮約は増加パスを保存する

元のグラフ $G$ のマッチング $M$ に関する増加パス $P$ が存在するならば、花 $B$ を縮約したグラフ $G/B$ のマッチング $M/B$ に関しても増加パスが存在する。逆も成り立つ。

**証明の概略**:

$(\Rightarrow)$ $P$ が花 $B$ を通る場合、$B$ 内のパスの部分を超頂点を通る辺に置き換えることで $G/B$ 上のパスが得られる。花の奇数長の性質により、交互の構造が保たれる。

$(\Leftarrow)$ $G/B$ 上の増加パスが超頂点 $v_B$ を通る場合、花を展開して $B$ 内の適切な経路を選ぶことで元のグラフ上の増加パスが復元できる。花の内部でマッチング辺の再配置が可能であることがポイント。 $\square$

## 計算量

### 基本実装

- 増加パスの探索: $O(V \cdot E)$ (花の縮約を含む)
- 増加回数: $O(V)$
- **全体: $O(V^2 E)$**

### Micali-Vazirani の改良

1980年に Micali と Vazirani が $O(E\sqrt{V})$ のアルゴリズムを発表。Hopcroft-Karp法の一般グラフへの拡張に相当する。

## 花の展開

花を展開する際の重要なポイント:

1. 増加パスが花の基点を通過する場合、花の中でどちらの方向に進むかを決定
2. 花のマッチング辺を適切に再配置して、増加パスの交互性を維持
3. ネストした花 (花の中に花がある場合) は再帰的に展開

## 応用

- **安定マッチング**: Gale-Shapley アルゴリズムの一般化
- **グラフ理論**: Tutte 行列によるマッチングの存在判定
- **化学**: 分子グラフの Kekule 構造の列挙
- **スケジューリング**: リソース制約付き割当問題

## Tutte-Berge 公式

一般グラフの最大マッチングのサイズに関する公式:

$$
\nu(G) = \min_{U \subseteq V} \frac{|V| + |U| - o(G - U)}{2}
$$

ここで $\nu(G)$ は最大マッチングのサイズ、$o(G - U)$ は $G - U$ の奇数成分の数。

この公式は Edmonds のアルゴリズムの正当性の別証明を与える。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 一般グラフ $G = (V, E)$ |
| 出力 | 最大マッチング |
| 時間計算量 | $O(V^2 E)$ (基本)、$O(E\sqrt{V})$ (Micali-Vazirani) |
| 空間計算量 | $O(V + E)$ |
| 核心 | 奇数長サイクル (花) の縮約による増加パスの発見 |
| 正当性 | 花の縮約が増加パスを保存する定理 |
