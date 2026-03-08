---
title: "Dominator Tree 解説"
---

## Dominator Tree とは

有向グラフ $G = (V, E)$ と始点 $s$ に対して、Dominator Tree は各頂点の**支配者 (dominator)** の関係を木構造で表したものである。

### 定義

頂点 $d$ が頂点 $v$ を**支配する** (dominate) とは、$s$ から $v$ への全てのパスが $d$ を通ることである。

$v$ の**即時支配者** (immediate dominator, idom) は、$v$ を支配する頂点のうち、$v$ 自身を除いて $v$ に最も近いものである。

## Lengauer-Tarjan アルゴリズム

### 概要

1. DFS で各頂点に DFS 番号を付与
2. 半支配者 (semi-dominator) を計算
3. 即時支配者を計算

### 半支配者 (Semi-dominator)

$$
\text{sdom}(v) = \min \{ u \mid u \text{ から } v \text{ へ DFS 木を使わずに到達可能} \}
$$

(DFS 番号の最小値)

### 簡易版 (Cooper et al.)

```python title="dominator_tree.py"
def compute_idom(n, edges, root):
    # 1. Build DFS tree
    # 2. Process nodes in reverse postorder
    # 3. For each node, intersect dominators of predecessors
    
    idom = [-1] * n
    idom[root] = root
    
    changed = True
    while changed:
        changed = False
        for v in reverse_postorder:
            if v == root:
                continue
            new_idom = first_processed_predecessor(v)
            for p in predecessors(v):
                if idom[p] != -1:
                    new_idom = intersect(new_idom, p)
            if idom[v] != new_idom:
                idom[v] = new_idom
                changed = True
    
    return idom
```

## 計算量

| アルゴリズム | 時間計算量 |
|------------|-----------|
| Lengauer-Tarjan (simple) | $O(E \log V)$ |
| Lengauer-Tarjan (sophisticated) | $O(E \cdot \alpha(V))$ |
| Cooper et al. (iterative) | $O(V^2)$ 最悪、実用的には高速 |

## 応用

- **コンパイラ最適化**: SSA 形式の構築に必須
- **制御フロー解析**: 支配境界 (dominance frontier) の計算
- **プログラム解析**: 到達可能性の構造的理解

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 有向グラフ、始点 |
| 出力 | 各頂点の即時支配者 (idom) |
| 時間計算量 | $O(E \cdot \alpha(V))$ (最良) |
| 核心 | 半支配者 + 即時支配者の計算 |
