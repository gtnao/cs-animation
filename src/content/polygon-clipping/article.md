---
title: "凸多角形の切断 解説"
---

## 凸多角形の切断とは

凸多角形を直線で切断し、直線の片側にある部分を求める操作である。半平面交差や計算幾何の多くの問題で基本操作として用いられる。

## Sutherland-Hodgman アルゴリズム

### アイデア

凸多角形の各辺について、切断線に対する始点と終点の位置関係を調べ、結果の頂点列を構築する。

### 4つのケース

辺の始点を $S$、終点を $E$ とする:

1. **$S$ が内側、$E$ が内側**: $E$ を出力に追加
2. **$S$ が内側、$E$ が外側**: 交点を出力に追加
3. **$S$ が外側、$E$ が外側**: 何も追加しない
4. **$S$ が外側、$E$ が内側**: 交点と $E$ を出力に追加

### 内側/外側の判定

直線を通る2点 $P_1, P_2$ に対して、点 $Q$ の位置は外積で判定する:

$$
\text{cross}(P_1, P_2, Q) = (P_2 - P_1) \times (Q - P_1)
$$

- 値が正 (または 0): 左側 (内側)
- 値が負: 右側 (外側)

### 交点の計算

辺 $SE$ と切断線 $P_1P_2$ の交点は、パラメータ $t$ を用いて:

$$
t = \frac{d_S}{d_S - d_E}, \quad \text{intersection} = S + t(E - S)
$$

ここで $d_S = \text{cross}(P_1, P_2, S)$, $d_E = \text{cross}(P_1, P_2, E)$ である。

### 実装

```python title="polygon_clipping.py"
def cross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def line_intersect(p1, p2, p3, p4):
    d1 = cross(p3, p4, p1)
    d2 = cross(p3, p4, p2)
    t = d1 / (d1 - d2)
    return (p1[0] + t * (p2[0] - p1[0]),
            p1[1] + t * (p2[1] - p1[1]))

def clip_polygon(polygon, line_p1, line_p2):
    result = []
    n = len(polygon)
    for i in range(n):
        cur = polygon[i]
        nxt = polygon[(i + 1) % n]
        cur_side = cross(line_p1, line_p2, cur)
        nxt_side = cross(line_p1, line_p2, nxt)

        if cur_side >= 0:
            result.append(cur)
        if (cur_side >= 0) != (nxt_side >= 0):
            result.append(line_intersect(cur, nxt, line_p1, line_p2))

    return result
```

## 計算量

1回の切断は $O(n)$ で行える ($n$ は多角形の頂点数)。

$k$ 本の直線で切断する場合、逐次切断は $O(nk)$ だが、各切断で頂点数は最大1増えるため最終的な頂点数は $O(n + k)$ である。

## 応用

- 半平面交差 (逐次切断法)
- 可視領域の計算
- シャドウボリュームの切断
- コンピュータグラフィックスのクリッピング

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 凸多角形と切断線 |
| 出力 | 切断後の凸多角形 |
| 時間計算量 | $O(n)$ |
| 核心 | 辺ごとの内側/外側判定と交点計算 |
