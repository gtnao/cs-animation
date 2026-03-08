---
title: "回転キャリパー法 解説"
---

## 回転キャリパー法とは

回転キャリパー法 (Rotating Calipers) は、凸多角形に関する各種問題を効率的に解くためのテクニックである。最も典型的な応用は、凸多角形の **直径** (最遠点対の距離) を $O(n)$ で求めることである。

## 凸多角形の直径

### 定義

凸多角形 $P$ の直径は:

$$
\text{diam}(P) = \max_{p, q \in P} \|p - q\|
$$

直径を達成する点の組 $(p, q)$ を **対蹠点対 (antipodal pair)** と呼ぶ。

## アルゴリズム

### 直感的な説明

2本の平行な支持線 (キャリパー = ノギスの意味) で凸多角形を挟み、同時に回転させていく。各角度で支持線が接する頂点の組が対蹠点対の候補となる。

### 手順

1. 凸包を求める ($O(n \log n)$)
2. $y$ 座標が最小の頂点 $p$ と最大の頂点 $q$ を見つける
3. 2つのキャリパーを水平に配置する
4. 辺の角度が小さい方のキャリパーを回転させる
5. 各ステップで $\|p - q\|$ を計算し、最大値を更新する
6. 一周するまで繰り返す

### 回転の判定

辺 $p_i p_{i+1}$ と辺 $q_j q_{j+1}$ の角度を比較する。外積を用いて:

$$
\vec{e_p} = p_{i+1} - p_i, \quad \vec{e_q} = q_{j+1} - q_j
$$

$$
\vec{e_p} \times \vec{e_q} > 0 \implies q \text{ を進める}
$$
$$
\vec{e_p} \times \vec{e_q} < 0 \implies p \text{ を進める}
$$
$$
\vec{e_p} \times \vec{e_q} = 0 \implies \text{両方進める}
$$

### 実装

```python title="rotating_calipers.py"
def rotating_calipers_diameter(hull):
    """hull は凸包の頂点リスト (反時計回り)"""
    n = len(hull)
    if n <= 1:
        return 0
    if n == 2:
        return dist(hull[0], hull[1])

    # Find antipodal starting point
    q = 1
    while cross_edge(hull, 0, q) < cross_edge(hull, 0, q + 1):
        q += 1

    best = 0
    p = 0
    p0, q0 = p, q

    while p != q0 or q != p0:
        d = dist(hull[p % n], hull[q % n])
        best = max(best, d)

        ep = (hull[(p+1) % n][0] - hull[p % n][0],
              hull[(p+1) % n][1] - hull[p % n][1])
        eq = (hull[(q+1) % n][0] - hull[q % n][0],
              hull[(q+1) % n][1] - hull[q % n][1])
        cross_val = ep[0] * eq[1] - ep[1] * eq[0]

        if cross_val > 0:
            q += 1
        elif cross_val < 0:
            p += 1
        else:
            p += 1
            q += 1

    return best
```

## 計算量

- 凸包構築: $O(n \log n)$
- 回転キャリパー: $O(n)$ ($p$ と $q$ がそれぞれ凸包を1周するだけ)
- 合計: $O(n \log n)$

凸包が既に与えられている場合は $O(n)$ で直径が求まる。

## その他の応用

回転キャリパー法は直径以外にも以下の問題を効率的に解ける。

- **最小幅**: 凸多角形の最小の幅 (= 平行な2直線で挟んだ最小距離)
- **最小面積外接矩形**: 凸多角形に外接する最小面積の矩形
- **2つの凸多角形間の最大/最小距離**

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 凸多角形 ($n$ 頂点) |
| 出力 | 直径 (最遠点対の距離) |
| 時間計算量 | $O(n)$ (凸包が既知の場合) |
| 核心 | 2つの支持線の同時回転 |
