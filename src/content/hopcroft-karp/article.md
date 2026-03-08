---
title: "Hopcroft-Karp法 解説"
---

## Hopcroft-Karp法とは

Hopcroft-Karp法は、**二部グラフの最大マッチング**を $O(E\sqrt{V})$ で求めるアルゴリズムである。1973年に John Hopcroft と Richard Karp によって提案された。

素朴な増加パスによるマッチングアルゴリズムが $O(VE)$ であるのに対し、Hopcroft-Karp法は各フェーズで**複数の増加パスを同時に処理**することで計算量を改善する。

## 前提知識

### 二部グラフ

**二部グラフ** $G = (L \cup R, E)$ は頂点集合を左集合 $L$ と右集合 $R$ に分割でき、辺は $L$ と $R$ の間のみに存在するグラフである。

### マッチング

**マッチング** $M \subseteq E$ は、どの頂点も高々1つの辺にしか含まれない辺の集合。$|M|$ が最大であるマッチングを**最大マッチング**と呼ぶ。

### 増加パス

マッチング $M$ に関する**増加パス** (augmenting path) は、未マッチの頂点から始まり未マッチの頂点で終わる、マッチング辺と非マッチング辺が交互に現れるパスである。

### Berge の定理

マッチング $M$ が最大であることと、$M$ に関する増加パスが存在しないことは同値。

## アルゴリズムの概要

### フェーズベースの処理

Hopcroft-Karp法は以下を繰り返す:

1. **BFS フェーズ**: 未マッチの左頂点全てから同時に BFS を行い、最短の増加パスの長さを求める
2. **DFS フェーズ**: その長さの増加パスを可能な限り多く見つけ、マッチングを更新する

```python title="hopcroft_karp.py"
def hopcroft_karp(graph):
    match_left = [-1] * len(L)
    match_right = [-1] * len(R)

    matching = 0
    while True:
        # BFS: find shortest augmenting path length
        dist = bfs(match_left, match_right, adj)
        if not found_augmenting:
            break

        # DFS: find vertex-disjoint augmenting paths
        for u in L:
            if match_left[u] == -1:
                if dfs(u, match_left, match_right, dist, adj):
                    matching += 1

    return matching
```

### BFS の詳細

BFS は全ての未マッチの左頂点をソースとして同時に探索する。交互パスに沿って探索し、未マッチの右頂点に到達したら増加パスを発見した印とする。

```python title="bfs.py"
def bfs(match_left, match_right, adj):
    dist = [INF] * len(L)
    queue = deque()

    for u in L:
        if match_left[u] == -1:
            dist[u] = 0
            queue.append(u)

    found = False
    while queue:
        u = queue.popleft()
        for v in adj[u]:  # v is in R
            w = match_right[v]
            if w == -1:
                found = True
            elif dist[w] == INF:
                dist[w] = dist[u] + 1
                queue.append(w)

    return dist, found
```

### DFS の詳細

DFS はレベルグラフ上で増加パスを探索し、見つかったパスに沿ってマッチングを反転する。一度探索に失敗した頂点は以後の探索から除外する。

## 計算量の解析

### フェーズ数の上界

**定理**: $k$ フェーズ後に残る増加パスの最短長は $2k + 1$ 以上。

**証明の概略**: 各フェーズで最短長 $\ell$ の増加パスを全て処理した後、残る増加パスの長さは $\ell + 2$ 以上になることを示す。最短増加パスに沿ってマッチングを反転すると、それより短い増加パスは生じない (Hopcroft-Karp の補題)。

### $O(\sqrt{V})$ フェーズの証明

最大マッチングのサイズを $|M^*|$ とする。$k$ フェーズ後のマッチングサイズを $|M_k|$ とすると:

- 残る増加パスの長さは $2k + 1$ 以上
- $|M^*| - |M_k|$ 本の頂点非交叉な増加パスが存在
- 各パスの長さが $2k + 1$ 以上なので、$|M^*| - |M_k| \leq V / (2k + 1)$

$k = \sqrt{V}$ とすると $|M^*| - |M_k| \leq \sqrt{V}$。残りの増加パスは各 $O(E)$ で処理できるので、追加 $O(\sqrt{V})$ フェーズで終了。

### 各フェーズの計算量

各フェーズは BFS ($O(E)$) + DFS ($O(E)$) = $O(E)$。

### 全体の計算量

$$
O(\sqrt{V} \cdot E) = O(E\sqrt{V})
$$

## 素朴なアルゴリズムとの比較

| 項目 | 素朴 (増加パス反復) | Hopcroft-Karp |
|------|-------------------|---------------|
| 1反復 | 1本の増加パス | 複数の増加パス (同じ長さ) |
| 反復回数 | $O(V)$ | $O(\sqrt{V})$ |
| 全体 | $O(VE)$ | $O(E\sqrt{V})$ |

## Dinic法との関係

Hopcroft-Karp法は、二部グラフの最大フロー問題に対する Dinic法の特殊化と見なせる。

二部グラフにソース $s$ とシンク $t$ を追加し、$s$ から全ての左頂点へ、全ての右頂点から $t$ へ容量 1 の辺を張ると、最大フロー = 最大マッチングとなる。

Dinic法の各フェーズがレベルグラフ上のブロッキングフローに対応し、Hopcroft-Karp法のフェーズに一致する。

## 応用

- **ジョブスケジューリング**: タスクを作業員に割り当てる
- **ネットワーク設計**: リソースの割当最適化
- **コンパイラ最適化**: レジスタ割当
- **Konig の定理**: 二部グラフの最小頂点被覆 = 最大マッチング

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 二部グラフ $G = (L \cup R, E)$ |
| 出力 | 最大マッチング |
| 時間計算量 | $O(E\sqrt{V})$ |
| 空間計算量 | $O(V + E)$ |
| 核心 | BFS+DFS による最短増加パスの一括処理 |
| 正当性 | Berge の定理 |
