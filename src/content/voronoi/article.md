---
title: "ボロノイ図 解説"
---

## ボロノイ図とは

平面上に $n$ 個の点 (母点、サイト) $S = \{s_1, s_2, \ldots, s_n\}$ が与えられたとき、各母点 $s_i$ に対して「$s_i$ に最も近い点の集合」を定める空間分割を **ボロノイ図 (Voronoi Diagram)** と呼ぶ。

### 定義

母点 $s_i$ の **ボロノイ領域 (Voronoi cell)** は:

$$
V(s_i) = \{x \in \mathbb{R}^2 \mid \|x - s_i\| \leq \|x - s_j\| \text{ for all } j \neq i\}
$$

ボロノイ領域の境界を **ボロノイ辺**、3つ以上のボロノイ領域が交わる点を **ボロノイ頂点** と呼ぶ。

### 基本的な性質

- 各ボロノイ領域は凸多角形 (無限領域の場合もある)
- ボロノイ辺は2つの母点の垂直二等分線の一部
- ボロノイ頂点は3つの母点から等距離にある点

## 構築アルゴリズム

### Fortune's Algorithm (スイープライン法)

Fortune's Algorithm は $O(n \log n)$ でボロノイ図を構築するスイープラインアルゴリズムである。

水平な走査線を上から下へ動かしながら、**ビーチライン (beach line)** と呼ばれる放物線の集合を管理する。

#### イベントの種類

1. **サイトイベント**: 走査線が新しい母点に到達したとき
2. **サークルイベント**: ビーチラインの弧が消滅するとき

#### 擬似コード

```python title="fortune_pseudo.py"
def fortune_voronoi(sites):
    # Initialize priority queue with site events
    pq = PriorityQueue()
    for s in sites:
        pq.push(SiteEvent(s))

    beach_line = BalancedBST()

    while not pq.empty():
        event = pq.pop()
        if isinstance(event, SiteEvent):
            handle_site_event(event, beach_line, pq)
        else:
            handle_circle_event(event, beach_line, pq)

    return extract_voronoi_edges(beach_line)
```

### 分割統治法

点集合を左右に分割し、それぞれのボロノイ図を再帰的に構築してからマージする。計算量は $O(n \log n)$ だが、実装は Fortune's Algorithm より複雑である。

## ドロネー三角形分割との関係

ボロノイ図とドロネー三角形分割は **双対 (dual)** の関係にある。

- ボロノイ頂点 → ドロネー三角形の外接円の中心
- ボロノイ辺 → ドロネー辺に直交
- ドロネー辺で結ばれた2つの母点 → 隣接するボロノイ領域

## 計算量

| 手法 | 時間計算量 | 空間計算量 |
|------|-----------|-----------|
| Fortune's Algorithm | $O(n \log n)$ | $O(n)$ |
| 分割統治 | $O(n \log n)$ | $O(n)$ |
| 逐次挿入 | $O(n^2)$ 最悪 | $O(n)$ |

## 応用

- 最近傍探索
- 施設配置問題
- 自然科学でのセル構造のモデリング
- ロボティクスの経路計画

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 平面上の $n$ 個の母点 |
| 出力 | ボロノイ図 (辺と頂点) |
| 最適計算量 | $O(n \log n)$ |
| 空間計算量 | $O(n)$ |
| 核心 | 各母点に最も近い領域の分割 |
