---
title: "SOS DP 解説"
---

## SOS DP とは

SOS DP (Sum over Subsets DP) は、$n$ ビットのマスク $S$ に対して、$S$ の全部分集合にわたる値の総和を $O(n \cdot 2^n)$ で計算するテクニックである。

$$
F[S] = \sum_{T \subseteq S} a[T]
$$

素朴に全部分集合を列挙すると $O(3^n)$ かかるが、SOS DP はこれを $O(n \cdot 2^n)$ に改善する。

## アルゴリズム

高速ゼータ変換とも呼ばれる。各ビット位置を 1 つずつ処理する:

```python title="sos_dp.py"
def sos(a: list[int], n: int) -> list[int]:
    dp = list(a)
    for bit in range(n):
        for mask in range(1 << n):
            if mask & (1 << bit):
                dp[mask] += dp[mask ^ (1 << bit)]
    return dp
```

### なぜ正しいか

ビット $bit$ の処理後、$dp[S]$ には「$S$ のうちビット $0$ から $bit$ までの任意の部分集合を含む全ての $T$ に対する $a[T]$ の和」が格納されている。全ビットを処理すると、$dp[S] = \sum_{T \subseteq S} a[T]$ が得られる。

## 計算量

### 命題: SOS DP は $O(n \cdot 2^n)$

**証明:**

外側のループが $n$ 回、内側のループが $2^n$ 回で、各反復は $O(1)$。したがって全体は $O(n \cdot 2^n)$。 $\square$

## メビウス変換 (逆変換)

SOS (ゼータ変換) の逆変換であるメビウス変換は、加算を減算に変えるだけ:

```python title="mobius.py"
def mobius(dp: list[int], n: int) -> list[int]:
    for bit in range(n):
        for mask in range(1 << n):
            if mask & (1 << bit):
                dp[mask] -= dp[mask ^ (1 << bit)]
    return dp
```

## 応用

1. **集合の畳み込み**: AND/OR 畳み込みの前処理としてゼータ/メビウス変換を使用
2. **部分集合の最大値/最小値**: 和の代わりに max/min を使う変種
3. **包除原理の高速化**: メビウス変換として解釈

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $2^n$ の配列 |
| 出力 | 各マスクの全部分集合の総和 |
| 時間計算量 | $O(n \cdot 2^n)$ |
| 空間計算量 | $O(2^n)$ |
| 核心 | 各ビットを 1 つずつ処理して差分更新 |
| 応用 | 集合畳み込み、包除原理、競プロ全般 |
