---
title: "Push-Relabel法 解説"
---

## Push-Relabel法とは

Push-Relabel法 (プッシュ・リラベル法) は、Andrew Goldberg と Robert Tarjan が1988年に提案した最大フローアルゴリズムである。Ford-Fulkerson系のアルゴリズムとは根本的に異なるアプローチを取り、$O(V^2 E)$ の計算量を達成する。

Ford-Fulkerson系が「増加パスを見つけてフローを流す」のに対し、Push-Relabel法は**プリフロー** (preflow) を管理し、各頂点で局所的な操作 (push と relabel) を行うことでフローを整える。

## プリフロー

### 定義

**プリフロー** $f$ は、フロー保存則を緩和したものである:

1. **容量制約**: $0 \leq f(u, v) \leq c(u, v)$
2. **緩和されたフロー保存則**: $s$ 以外の各頂点 $v$ について、流入量 $\geq$ 流出量

$$
\sum_{(u,v) \in E} f(u,v) \geq \sum_{(v,w) \in E} f(v,w) \quad (\forall v \in V \setminus \{s\})
$$

各頂点の **超過フロー** (excess flow) を次のように定義する:

$$
e(v) = \sum_{(u,v) \in E} f(u,v) - \sum_{(v,w) \in E} f(v,w)
$$

プリフローでは $e(v) \geq 0$ ($v \neq s$)。$e(v) > 0$ の頂点を**活性頂点** (active vertex) と呼ぶ。

## ラベル関数 (高さ関数)

### 定義

**ラベル関数** $h: V \to \mathbb{Z}_{\geq 0}$ は以下を満たす:

1. $h(s) = |V|$
2. $h(t) = 0$
3. 残余グラフの各辺 $(u,v) \in E_f$ について $h(u) \leq h(v) + 1$

条件 3 は**有効性条件** (validity condition) と呼ばれる。直感的には、フローは「高い場所から低い場所に流れる」というイメージである。

## 基本操作

### Push操作

活性頂点 $u$ と、$c_f(u,v) > 0$ かつ $h(u) = h(v) + 1$ を満たす辺 $(u,v)$ に対して:

$$
\delta = \min(e(u),\ c_f(u,v))
$$

だけフローを押し出す。

- $\delta = c_f(u,v)$ なら**飽和プッシュ** (saturating push)
- $\delta < c_f(u,v)$ なら**非飽和プッシュ** (non-saturating push)

### Relabel操作

活性頂点 $u$ に対して、残余グラフ上で $h(u) \leq h(v)$ となる辺 $(u,v)$ ばかりでプッシュできない場合:

$$
h(u) \leftarrow 1 + \min_{(u,v) \in E_f} h(v)
$$

## アルゴリズム

### 手順

1. **初期化**: $h(s) = |V|$、他の頂点は $h(v) = 0$。ソースからの全辺に容量いっぱいのプリフローを流す
2. 活性頂点が存在する間:
   - プッシュ可能な辺があれば Push
   - なければ Relabel
3. 活性頂点がなくなったら終了。$e(t)$ が最大フロー

```python title="push_relabel.py"
def push_relabel(graph, source, sink):
    n = len(graph.nodes)
    height = [0] * n
    excess = [0] * n
    height[source] = n

    # Initial preflow
    for edge in edges_from(source):
        edge.flow = edge.capacity
        excess[edge.to] += edge.capacity
        excess[source] -= edge.capacity

    while has_active_vertex():
        u = get_active_vertex()
        if not push(u):
            relabel(u)

    return excess[sink]
```

## 計算量の解析

### 補題1: Relabel 回数は $O(V^2)$

各頂点のラベルは最大 $2|V| - 1$ まで増加する (ラベルが $2|V|$ 以上になるとソースに到達可能であることと矛盾)。頂点数は $|V|$ なので、Relabel の総回数は $O(V^2)$。

### 補題2: 飽和プッシュの回数は $O(VE)$

辺 $(u,v)$ で飽和プッシュが行われた後、再び $(u,v)$ で飽和プッシュが行われるためには $(v,u)$ で逆プッシュが必要で、そのためには $h(v)$ が2以上増加する必要がある。$h(v)$ の上限は $O(V)$ なので、各辺の飽和プッシュ回数は $O(V)$。全体で $O(VE)$。

### 補題3: 非飽和プッシュの回数は $O(V^2 E)$

ポテンシャル関数 $\Phi = \sum_{v: \text{active}} h(v)$ を用いた償却解析により示される。

### 全体の計算量

$$
O(V^2 E)
$$

## 改良

### FIFO Push-Relabel

活性頂点をキューで管理し、先頭の頂点を処理する方式。計算量は $O(V^3)$。

### Highest Label Push-Relabel

最もラベルの高い活性頂点を優先的に処理する方式。実用上非常に高速で、計算量は $O(V^2 \sqrt{E})$。

### Gap Relabeling

あるラベル値 $k$ を持つ頂点が存在しない場合 (ギャップ)、ラベルが $k$ より大きい頂点はシンクに到達不可能であるため、それらのラベルを $|V|$ に引き上げる。実用上の高速化に大きく寄与する。

## Ford-Fulkerson系との比較

| 項目 | Ford-Fulkerson系 | Push-Relabel |
|------|-----------------|--------------|
| アプローチ | グローバル (パス探索) | ローカル (push/relabel) |
| 管理対象 | フロー | プリフロー |
| 計算量 (基本) | $O(VE^2)$ | $O(V^2 E)$ |
| 計算量 (最良) | $O(V^2 E)$ (Dinic) | $O(V^2 \sqrt{E})$ |
| 実装の複雑さ | 比較的単純 | やや複雑 |
| 実用性能 | 良好 | 密グラフで特に高速 |

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | フローネットワーク $G = (V, E)$、ソース $s$、シンク $t$ |
| 出力 | 最大フロー値 |
| 時間計算量 | $O(V^2 E)$ (基本)、$O(V^2 \sqrt{E})$ (Highest Label) |
| 空間計算量 | $O(V + E)$ |
| 核心 | プリフローの局所的操作による最大フローへの収束 |
| 応用 | 大規模ネットワークの最大フロー、画像セグメンテーション |
