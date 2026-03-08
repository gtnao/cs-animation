---
title: "Matroid Intersection 解説"
---

## Matroid Intersection とは

Matroid Intersection は、2つのマトロイド $M_1 = (E, \mathcal{I}_1)$ と $M_2 = (E, \mathcal{I}_2)$ の**最大共通独立集合** (maximum common independent set) を求める問題である。

$$
\max \{ |S| \mid S \in \mathcal{I}_1 \cap \mathcal{I}_2 \}
$$

## 重要性

マトロイド1つでは貪欲法で解けるが、2つのマトロイドの交差は**貪欲法では解けない**。しかし多項式時間アルゴリズムが存在する (3つ以上は NP 困難)。

## アルゴリズム: 増大法

### 交換グラフ

現在の共通独立集合 $S$ に対して、有向グラフ $D_S = (E, A)$ を構築する:

- $S$ 内の要素 $y$ から $S$ 外の要素 $x$ へ辺: $S - y + x \in \mathcal{I}_1$
- $S$ 外の要素 $x$ から $S$ 内の要素 $y$ へ辺: $S - y + x \in \mathcal{I}_2$

### 増大パス

$X_1 = \{x \notin S \mid S + x \in \mathcal{I}_1\}$ から $X_2 = \{x \notin S \mid S + x \in \mathcal{I}_2\}$ への最短パスを BFS で見つける。パスに沿って $S$ に要素を追加・削除する。

```python title="matroid_intersection.py"
def matroid_intersection(E, ind1, ind2):
    S = set()
    while True:
        # Build exchange graph and find augmenting path
        # from X1 to X2
        path = find_augmenting_path(E, S, ind1, ind2)
        if path is None:
            break
        S = S.symmetric_difference(set(path))
    return S
```

## 計算量

$$
T = O(r \cdot n \cdot (n + f))
$$

ここで $r$ はランク、$n = |E|$、$f$ は独立性判定の計算量。

## 応用

- **二部グラフの最大マッチング**: グラフィックマトロイド $\cap$ パーティションマトロイド
- **彩色的全域木**: 色ごとに1辺の全域木
- **有向グラフの互いに素なパス**

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 2つのマトロイド |
| 出力 | 最大共通独立集合 |
| 時間計算量 | $O(r \cdot n \cdot (n + f))$ |
| 核心 | 交換グラフ上の増大パス |
