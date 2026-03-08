---
title: "マージテク (Small to Large) 解説"
---

## マージテクとは

マージテク (Small to Large merging / DSU on tree) は、集合をマージする際に**常に小さい方を大きい方にマージする**ことで、全体の計算量を $O(n \log n)$ に抑える手法である。

## 核心アイデア

ナイーブに集合をマージすると、各要素が何度も移動される可能性がある。しかし、小さい方を大きい方に統合すると、**各要素が移動するたびに属する集合のサイズが2倍以上になる**。したがって各要素の移動回数は $O(\log n)$ 回以下である。

## 計算量の証明

### 命題: 総移動回数は $O(n \log n)$

**証明:** 任意の要素 $x$ について、$x$ がマージにより移動するたびに $x$ が属する集合のサイズは少なくとも2倍になる。集合の最大サイズは $n$ なので、$x$ の移動回数は高々 $\lfloor \log_2 n \rfloor$ 回。$n$ 個の要素があるので、総移動回数は $O(n \log n)$。 $\square$

## 実装

```python title="small_to_large.py"
def merge(sets: list[set], a: int, b: int) -> None:
    if len(sets[a]) < len(sets[b]):
        a, b = b, a
    for x in sets[b]:
        sets[a].add(x)
    sets[b] = sets[a]  # Reference sharing
```

## 応用

- **木上のDSU (DSU on tree)**: 各頂点の部分木の情報をマージ
- **Union-Find の union by size**: 実はマージテクの一種
- **連結成分ごとの情報管理**

## まとめ

| 項目 | 内容 |
|------|------|
| 核心 | 小を大にマージ |
| 時間計算量 | $O(n \log n)$ (総移動回数) |
| 各要素の移動回数 | $O(\log n)$ |
