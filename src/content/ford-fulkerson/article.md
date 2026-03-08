---
title: "Ford-Fulkerson法 解説"
---

## Ford-Fulkerson法とは

Ford-Fulkerson法は、フローネットワーク上で**最大フロー** (Maximum Flow) を求めるアルゴリズムの枠組みである。1956年に L.R. Ford Jr. と D.R. Fulkerson によって提案された。

基本的なアイデアは非常にシンプルで、**増加パス (augmenting path)** が存在する限り、そのパスに沿ってフローを流し続けるというものである。

## 前提知識：フローネットワーク

### 定義

**フローネットワーク** $G = (V, E)$ は有向グラフであり、以下を持つ:

- **ソース** (source) $s \in V$: フローの湧き出し点
- **シンク** (sink) $t \in V$: フローの吸い込み点
- **容量関数** $c: E \to \mathbb{R}_{\geq 0}$: 各辺の容量

### フロー

**フロー** $f: E \to \mathbb{R}_{\geq 0}$ は以下の2つの条件を満たす:

1. **容量制約**: 各辺 $(u, v) \in E$ について $0 \leq f(u, v) \leq c(u, v)$
2. **フロー保存則**: $s, t$ 以外の各頂点 $v$ について、流入量 = 流出量

$$
\sum_{(u,v) \in E} f(u,v) = \sum_{(v,w) \in E} f(v,w) \quad (\forall v \in V \setminus \{s, t\})
$$

**フロー値** $|f|$ はソースからの総流出量 (= シンクへの総流入量) として定義される。

## 残余グラフと増加パス

### 残余グラフ

フロー $f$ に対する**残余グラフ** (residual graph) $G_f = (V, E_f)$ は以下の辺を持つ:

- **順辺** $(u, v) \in E_f$: $c(u,v) - f(u,v) > 0$ のとき、残余容量 $c_f(u,v) = c(u,v) - f(u,v)$
- **逆辺** $(v, u) \in E_f$: $f(u,v) > 0$ のとき、残余容量 $c_f(v,u) = f(u,v)$

逆辺は「フローの取り消し」を表す。これにより、一度流したフローを再分配できるようになる。

### 増加パス

残余グラフ $G_f$ 上での $s$ から $t$ への単純パスを**増加パス**と呼ぶ。増加パス $P$ の**ボトルネック容量**は:

$$
\Delta(P) = \min_{(u,v) \in P} c_f(u,v)
$$

## アルゴリズム

### 手順

1. 全辺のフローを $0$ に初期化する
2. 残余グラフ上で $s$ から $t$ への増加パスを探す
3. パスが見つかれば、ボトルネック容量だけフローを流す
4. パスが見つからなくなるまで 2-3 を繰り返す

```python title="ford_fulkerson.py"
def ford_fulkerson(graph, source, sink):
    # Initialize flow to 0
    flow = {(u, v): 0 for u, v in graph.edges}
    max_flow = 0

    while True:
        # Find augmenting path using DFS/BFS
        path = find_augmenting_path(graph, flow, source, sink)
        if path is None:
            break

        # Find bottleneck capacity
        bottleneck = min(
            capacity(u, v) - flow[(u, v)]
            for u, v in path
        )

        # Augment flow along path
        for u, v in path:
            flow[(u, v)] += bottleneck

        max_flow += bottleneck

    return max_flow
```

### 増加パスの探索方法

Ford-Fulkerson法は増加パスの探索方法を規定していない。代表的な選択肢:

| 方法 | 名称 | 計算量 |
|------|------|--------|
| DFS | Ford-Fulkerson (素朴) | $O(E \cdot |f^*|)$ |
| BFS | Edmonds-Karp | $O(VE^2)$ |

ここで $|f^*|$ は最大フロー値である。

## 計算量の解析

### DFS による探索 (素朴な Ford-Fulkerson)

各反復で少なくとも 1 のフローが増加する (容量が整数の場合)。したがって:

- 増加パスの探索: $O(E)$ (DFS/BFS)
- 反復回数: 最大 $|f^*|$ 回
- **全体**: $O(E \cdot |f^*|)$

容量が整数でない場合、アルゴリズムが停止しない可能性がある。

### BFS による探索 (Edmonds-Karp)

BFS で最短の増加パスを選ぶと:

- 各反復でいずれかの辺が飽和する
- 飽和した辺が再び残余グラフに現れるとき、パスの長さが増加する
- パスの長さの上限は $V - 1$

**反復回数は $O(VE)$ に抑えられ、全体で $O(VE^2)$** となる。

## 最大フロー最小カット定理

Ford-Fulkerson法の正当性の根拠となる重要な定理。

### カット

**$s$-$t$ カット** $(S, T)$ は $V$ の分割で、$s \in S$, $t \in T$ を満たす。カットの**容量**は:

$$
c(S, T) = \sum_{\substack{u \in S, v \in T \\ (u,v) \in E}} c(u, v)
$$

### 定理

以下の3つは同値である:

1. $f$ は最大フローである
2. 残余グラフ $G_f$ に $s$ から $t$ への増加パスが存在しない
3. ある $s$-$t$ カット $(S, T)$ が存在して $|f| = c(S, T)$

**証明の概略:**

$(1) \Rightarrow (2)$: 増加パスが存在すればフローを増加できるため、$f$ は最大でない。対偶により成立。

$(2) \Rightarrow (3)$: $S$ を残余グラフで $s$ から到達可能な頂点の集合、$T = V \setminus S$ とする。増加パスがないので $t \notin S$。$S$ から $T$ への各辺 $(u,v)$ について $f(u,v) = c(u,v)$ (そうでなければ $v$ は $S$ に含まれる)。同様に $T$ から $S$ への各辺について $f(v,u) = 0$。よって $|f| = c(S,T)$。

$(3) \Rightarrow (1)$: 任意のフロー $f$ と任意のカット $(S,T)$ について $|f| \leq c(S,T)$。等号が成立するので $f$ は最大フロー。 $\square$

## 注意点

- **整数性**: 容量が全て整数なら、最大フローも整数になる (整数性定理)
- **停止性**: 容量が有理数なら必ず停止する。無理数の場合、停止しない例が知られている
- **実用上**: BFS を使う Edmonds-Karp法や、さらに高速な Dinic法が使われることが多い

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | フローネットワーク $G = (V, E)$、ソース $s$、シンク $t$ |
| 出力 | 最大フロー値 $|f^*|$ |
| 時間計算量 | $O(E \cdot |f^*|)$ (DFS)、$O(VE^2)$ (BFS/Edmonds-Karp) |
| 空間計算量 | $O(V + E)$ |
| 核心 | 増加パスに沿ったフロー増加の反復 |
| 正当性 | 最大フロー最小カット定理 |
