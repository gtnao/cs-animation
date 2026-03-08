---
title: "Matroid (マトロイド) 解説"
---

## マトロイドとは

マトロイド (Matroid) は、貪欲法の正当性を保証する組合せ構造を抽象化した概念である。

### 定義

台集合 $E$ とその部分集合族 $\mathcal{I} \subseteq 2^E$ の組 $M = (E, \mathcal{I})$ がマトロイドであるとは、以下の3条件を満たすことをいう:

1. $\emptyset \in \mathcal{I}$
2. $A \in \mathcal{I}$ かつ $B \subseteq A$ ならば $B \in \mathcal{I}$ (遺伝性)
3. $A, B \in \mathcal{I}$ かつ $|A| < |B|$ ならば、ある $x \in B \setminus A$ が存在して $A \cup \{x\} \in \mathcal{I}$ (増大性 / 交換公理)

$\mathcal{I}$ の元を**独立集合**、極大独立集合を**基**という。

## 代表的なマトロイド

### 一様マトロイド $U_{r,n}$

$|E| = n$ の台集合上で、サイズ $r$ 以下の全ての部分集合が独立。

### グラフィックマトロイド

台集合は辺集合。独立集合は森 (閉路を含まない辺の集合)。

### パーティションマトロイド

台集合を $E_1, E_2, \ldots, E_k$ に分割し、各 $E_i$ から高々 $d_i$ 個選べる。

## 貪欲法の最適性

### 定理 (Rado-Edmonds)

重み付きマトロイド上で、重みの大きい順に要素を貪欲に選ぶと、最大重み独立集合が得られる。

```python title="greedy_matroid.py"
def greedy_matroid(elements, weights, is_independent):
    sorted_elems = sorted(zip(weights, elements), reverse=True)
    selected = set()
    for w, e in sorted_elems:
        if is_independent(selected | {e}):
            selected.add(e)
    return selected
```

## 計算量

貪欲法は $O(n \log n + n \cdot f(n))$ ($f(n)$ は独立性判定の計算量)。

## まとめ

| 項目 | 内容 |
|------|------|
| 核心 | 貪欲法の正当性を保証する構造 |
| 3公理 | 空集合、遺伝性、増大性 |
| 応用 | 最小全域木 (Kruskal)、スケジューリング |
