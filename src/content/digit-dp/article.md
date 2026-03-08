---
title: "桁DP 解説"
---

## 桁DP とは

桁DP (Digit DP) は、ある上限 $N$ 以下の非負整数のうち、特定の条件を満たすものを数え上げるための動的計画法のテクニックである。

「1 以上 $N$ 以下で、桁和が $K$ の倍数である数の個数」のような問題に適用される。

### 核心アイデア

数を上位桁から 1 桁ずつ決めていく。各桁を決める際に、これまで決めた桁が $N$ の対応する桁と完全に一致しているか (tight 状態) を管理する。

- **tight = true**: これまでの桁が $N$ と完全一致しているので、次の桁は $N$ の対応する桁以下に制限される
- **tight = false**: これまでのどこかの桁で $N$ より小さい値を選んだので、次の桁は 0〜9 の任意の値を選べる

## 問題例: 桁和が K の倍数

1 以上 $N$ 以下の整数で、桁和が $K$ の倍数であるものの個数を求める。

### 状態の定義

$dp[\text{pos}][\text{tight}][\text{rem}]$ を「上位から $\text{pos}$ 桁まで決めた時点で、tight 状態が $\text{tight}$、桁和の $K$ での余りが $\text{rem}$ であるような数の個数」と定義する。

### 漸化式

桁 $\text{pos}$ に数字 $d$ を置くとき:

$$
dp[\text{pos}+1][\text{newTight}][\text{newRem}] \mathrel{+}= dp[\text{pos}][\text{tight}][\text{rem}]
$$

ここで:
- $d$ の範囲: $0 \leq d \leq (\text{tight} \text{ なら } N[\text{pos}] \text{, そうでなければ } 9)$
- $\text{newTight} = \text{tight} \land (d = N[\text{pos}])$
- $\text{newRem} = (\text{rem} + d) \mod K$

### 初期条件

$$
dp[0][1][0] = 1
$$

### 求める答え

$$
dp[n][0][0] + dp[n][1][0] - 1
$$

$-1$ は数 0 を除外するため (1 以上を数えたい場合)。

## 実装

```python title="digit_dp.py"
def count_digit_sum_div(N: str, K: int) -> int:
    digits = [int(c) for c in N]
    n = len(digits)
    # dp[tight][rem]
    dp = [[0] * K for _ in range(2)]
    dp[1][0] = 1

    for pos in range(n):
        new_dp = [[0] * K for _ in range(2)]
        for tight in range(2):
            for rem in range(K):
                if dp[tight][rem] == 0:
                    continue
                limit = digits[pos] if tight else 9
                for d in range(limit + 1):
                    new_tight = 1 if tight and d == limit else 0
                    new_rem = (rem + d) % K
                    new_dp[new_tight][new_rem] += dp[tight][rem]
        dp = new_dp

    return dp[0][0] + dp[1][0] - 1  # -1 to exclude 0
```

## 計算量

### 命題: 桁DPは $O(D \cdot |\text{states}| \cdot B)$ で計算できる

ここで $D$ は桁数、$|\text{states}|$ は追加の状態数、$B$ は基数 (通常 10)。

**証明:**

桁数 $D$ は $\lfloor\log_{10} N\rfloor + 1$ である。各桁で tight (2状態) と余り ($K$ 状態) の全組み合わせを処理し、各状態から $B$ 通りの遷移がある。

したがって時間計算量は $O(D \cdot 2 \cdot K \cdot 10) = O(DK)$ である。 $\square$

$N$ が非常に大きくても ($10^{18}$ など)、桁数は高々 19 なので高速に処理できる。

## 桁DPの一般的なパターン

桁DPは以下のような問題に広く適用できる:

1. **桁和に関する条件**: 桁和が $K$ の倍数、桁和が一定範囲内
2. **特定の桁の出現回数**: 数字 $d$ がちょうど $k$ 回現れる数
3. **隣接桁の関係**: 隣り合う桁の差が一定以上
4. **桁の積**: 桁の積に関する条件

### 状態拡張のテンプレート

```python title="digit_dp_template.py"
def digit_dp_template(N: str):
    digits = [int(c) for c in N]
    n = len(digits)
    # Adjust state as needed
    # dp[tight][...additional states...]
    # Transition: for each digit d in range(0, limit+1)
    pass
```

## まとめ

| 項目 | 内容 |
|------|------|
| 適用対象 | 1〜N で条件を満たす数の数え上げ |
| 時間計算量 | $O(D \cdot |\text{states}| \cdot B)$ |
| 空間計算量 | $O(|\text{states}|)$ |
| 核心 | tight フラグで上限制約を管理、上位桁から順に決定 |
| 応用 | 桁和条件、特定桁の出現回数、数の数え上げ全般 |
