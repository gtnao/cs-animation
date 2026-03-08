---
title: "最小全域有向木 (Edmonds' Algorithm) 解説"
---

## 最小全域有向木とは

有向グラフ $G = (V, E)$ と根 $r \in V$ が与えられたとき、$r$ から全頂点に到達可能な最小コストの有向木 (arborescence) を求める問題である。

## Edmonds' Algorithm (Chu-Liu/Edmonds' Algorithm)

### 手順

1. 各非根頂点 $v$ について、$v$ への最小コスト入辺を選ぶ
2. 選んだ辺の集合に閉路がなければ、それが最小全域有向木
3. 閉路がある場合、閉路を1頂点に縮約し、辺のコストを調整して再帰

### コスト調整

閉路 $C$ を縮約する際、閉路外から $v \in C$ への辺のコストを以下のように調整する:

$$
w'(u, C) = w(u, v) - w(\text{min\_edge}(v)) + 0
$$

ここで $w(\text{min\_edge}(v))$ は $v$ への選ばれた最小入辺のコスト。

```python title="edmonds.py"
def min_spanning_arborescence(n, edges, root):
    # 1. Select minimum incoming edge for each non-root vertex
    # 2. Check for cycles
    # 3. If cycle found, contract and recurse
    # 4. Expand solution
    pass  # Simplified pseudocode
```

## 計算量

$$
T = O(EV)
$$

Tarjan の改良版では $O(E + V \log V)$ も可能。

## 応用

- **ネットワーク設計**: 放送ネットワークの最小コスト設計
- **系統樹の推定**: 進化的関係の最小コスト木
- **依存関係の最適化**: ビルドシステムの依存グラフ

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 有向重み付きグラフ、根 |
| 出力 | 根からの最小全域有向木 |
| 時間計算量 | $O(EV)$ |
| 核心 | 最小入辺選択 + 閉路縮約 + 再帰 |
