---
title: "凸包 (Convex Hull) 解説"
---

## 凸包とは

平面上に $n$ 個の点が与えられたとき、全ての点を内部または境界上に含む最小の凸多角形を **凸包 (Convex Hull)** と呼ぶ。

直感的には、全ての点に釘を打ち、輪ゴムで囲んだときにできる多角形が凸包である。

### 定義

点集合 $P = \{p_1, p_2, \ldots, p_n\}$ に対して、$P$ を含む全ての凸集合の共通部分を $P$ の凸包と定義する。

$$
\text{conv}(P) = \bigcap \{C \mid C \text{ は凸集合}, P \subseteq C\}
$$

## 素朴なアプローチ

全ての点の対 $(p_i, p_j)$ について、残りの全ての点が直線 $p_i p_j$ の同じ側にあるかを調べる方法がある。しかし、この方法は $O(n^3)$ の計算量を要する。

## Andrew's Monotone Chain アルゴリズム

Andrew's Monotone Chain は、凸包を上側と下側に分けて構築する $O(n \log n)$ のアルゴリズムである。

### アルゴリズムの手順

1. 点を $x$ 座標でソートする (同じなら $y$ 座標で)
2. 下側凸包を左から右へ構築する
3. 上側凸包を右から左へ構築する
4. 2つを連結して凸包を得る

### 核心: 外積による左折判定

3点 $O, A, B$ について、外積

$$
\text{cross}(O, A, B) = (A_x - O_x)(B_y - O_y) - (A_y - O_y)(B_x - O_x)
$$

の値が正なら左折 (反時計回り)、負なら右折 (時計回り)、0なら一直線上にある。

凸包構築では、新しい点を追加するたびに右折が発生したらスタックの頂点を除去する。これにより常に凸性が保たれる。

### 実装

```python title="convex_hull.py"
def convex_hull(points: list[tuple[int, int]]) -> list[tuple[int, int]]:
    points = sorted(set(points))
    if len(points) <= 1:
        return points

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    # Lower hull
    lower = []
    for p in points:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)

    # Upper hull
    upper = []
    for p in reversed(points):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)

    return lower[:-1] + upper[:-1]
```

## 計算量

| 項目 | 計算量 |
|------|--------|
| ソート | $O(n \log n)$ |
| 凸包構築 | $O(n)$ |
| 合計 | $O(n \log n)$ |
| 空間計算量 | $O(n)$ |

### 凸包構築が $O(n)$ である理由

各点はスタックに高々1回追加され、高々1回除去される。したがって、push/pop の操作回数の合計は $O(n)$ である。

## Graham Scan との比較

Graham Scan も $O(n \log n)$ で凸包を構築するアルゴリズムである。偏角ソートを使う点が Andrew's Monotone Chain と異なる。

| | Andrew's Monotone Chain | Graham Scan |
|--|-------------------------|-------------|
| ソート基準 | $x$ 座標 | 偏角 |
| 実装の簡潔さ | 簡潔 | やや複雑 |
| 数値的安定性 | 良好 | $\mathrm{atan2}$ に依存 |

## 応用

- 衝突判定
- 最遠点対 (回転キャリパー法の前処理)
- 最小包含円の計算
- 計算幾何の様々な問題の前処理

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 平面上の $n$ 点 |
| 出力 | 凸包の頂点列 |
| 時間計算量 | $O(n \log n)$ |
| 空間計算量 | $O(n)$ |
| 核心 | 外積による左折/右折判定 |
