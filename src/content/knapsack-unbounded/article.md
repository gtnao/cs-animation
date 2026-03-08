---
title: "ナップサック問題 (個数無制限) 解説"
---

## ナップサック問題 (個数無制限) とは

個数無制限ナップサック問題 (Unbounded Knapsack Problem) は、各品物を**何個でも**選べる条件下で、ナップサックの容量内で価値を最大化する問題である。

### 定式化

$n$ 種類の品物があり、品物 $i$ の重さを $w_i$、価値を $v_i$ とする。ナップサックの容量を $W$ とする。

$$
\max \sum_{i=1}^{n} v_i x_i \quad \text{subject to} \quad \sum_{i=1}^{n} w_i x_i \leq W, \quad x_i \in \mathbb{Z}_{\geq 0}
$$

0-1 ナップサック問題との違いは $x_i \in \{0, 1\}$ ではなく $x_i \geq 0$ (非負整数) である点にある。

### 具体例

品物: (重さ=2, 価値=3), (重さ=3, 価値=5), (重さ=4, 価値=6)。容量 $W = 8$。

最適解は品物2を2個と品物1を1個選ぶ (重さ=3+3+2=8, 価値=5+5+3=13)。

## 動的計画法

### 状態と遷移

$dp[w]$ を「容量 $w$ で得られる最大価値」と定義する。

遷移は以下の通り:

$$
dp[w] = \max_{i : w_i \leq w} (dp[w - w_i] + v_i)
$$

基底条件: $dp[0] = 0$。

### 0-1 ナップサックとの違い

0-1 ナップサックでは逆順にループしたが、個数無制限では**順方向**にループする。これにより、同じ品物を複数回使うことが可能になる。

### 実装

```python title="knapsack_unbounded.py"
def knapsack_unbounded(weights: list[int], values: list[int], W: int) -> int:
    dp = [0] * (W + 1)
    for w in range(1, W + 1):
        for i in range(len(weights)):
            if weights[i] <= w:
                dp[w] = max(dp[w], dp[w - weights[i]] + values[i])
    return dp[W]
```

別の書き方として、品物ごとにループする方法もある:

```python title="knapsack_unbounded_v2.py"
def knapsack_unbounded_v2(weights: list[int], values: list[int], W: int) -> int:
    dp = [0] * (W + 1)
    for i in range(len(weights)):
        for w in range(weights[i], W + 1):  # forward order
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])
    return dp[W]
```

順方向のループにより、$dp[w - w_i]$ の時点で品物 $i$ が既に使われている可能性がある。これが「同じ品物を何度でも使える」ことに対応する。

## 計算量

| 項目 | 値 |
|------|------|
| 時間計算量 | $O(nW)$ |
| 空間計算量 | $O(W)$ |

## 0-1 ナップサックとの比較

| | 0-1 ナップサック | 個数無制限ナップサック |
|---|---|---|
| 制約 | 各品物最大1個 | 各品物何個でも |
| DP遷移のループ順 | 逆順 ($w: W \to w_i$) | 順方向 ($w: w_i \to W$) |
| 空間計算量 | $O(W)$ | $O(W)$ |

## 正当性の証明

**命題:** 上記のDPは最適解を求める。

**証明の概要:** $dp[w]$ は容量 $w$ での最大価値を正しく計算する。帰納法で示す。

$dp[0] = 0$ は自明に正しい。$dp[w]$ ($w \geq 1$) が正しいと仮定する。最適解で最後に入れた品物を $i$ とすれば、残りの部分の最適値は $dp[w - w_i]$ であり (帰納法の仮定)、全体の価値は $dp[w - w_i] + v_i$ である。アルゴリズムは全ての品物についてこの値を試すので、最大値を正しく見つける。 $\square$

## 応用

- コイン問題 (最大価値バージョン)
- ロッド切断問題 (Rod Cutting)
- 在庫の仕入れ最適化

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n$ 種類の品物 (重さ $w_i$, 価値 $v_i$) と容量 $W$ |
| 出力 | 最大価値 |
| 時間計算量 | $O(nW)$ |
| 空間計算量 | $O(W)$ |
| 核心 | 順方向ループにより品物の再利用を許可 |
