---
title: "最長増加部分列 (LIS) 解説"
---

## 最長増加部分列 (LIS) とは

最長増加部分列 (Longest Increasing Subsequence, LIS) は、与えられた数列から要素を (連続とは限らず) 選び出して作れる**狭義単調増加な部分列**のうち、最長のものを求める問題である。

### 定義

数列 $a_1, a_2, \ldots, a_n$ に対して、$a_{i_1} < a_{i_2} < \cdots < a_{i_k}$ ($i_1 < i_2 < \cdots < i_k$) を満たす部分列のうち $k$ が最大のものを求める。

### 具体例

数列 $[3, 1, 4, 1, 5, 9, 2, 6]$ の LIS の1つは $[1, 4, 5, 9]$ (長さ4) である。$[1, 2, 6]$ も増加部分列だが長さ3なので最長ではない。

## 素朴なアプローチ: $O(n^2)$ DP

$dp[i]$ を「$a_i$ を末尾とする LIS の長さ」と定義する。

$$
dp[i] = 1 + \max_{j < i,\, a_j < a_i} dp[j]
$$

該当する $j$ がなければ $dp[i] = 1$。答えは $\max_i dp[i]$。

```python title="lis_naive.py"
def lis_dp(a: list[int]) -> int:
    n = len(a)
    dp = [1] * n
    for i in range(1, n):
        for j in range(i):
            if a[j] < a[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)
```

時間計算量は $O(n^2)$、空間計算量は $O(n)$。

## 高速なアプローチ: $O(n \log n)$

### tails 配列

配列 $\text{tails}$ を管理する。$\text{tails}[k]$ は「長さ $k+1$ の増加部分列の末尾の最小値」を表す。

**重要な性質:** $\text{tails}$ は常にソートされている (狭義単調増加)。

### アルゴリズム

各要素 $a_i$ について:

1. $a_i$ が $\text{tails}$ の全要素より大きければ、末尾に追加 (LIS が延長される)
2. そうでなければ、$\text{tails}$ 中の $a_i$ 以上の最小の要素を $a_i$ で置換

ステップ2の探索は二分探索で $O(\log n)$ で行える。

### 実装

```python title="lis.py"
import bisect

def lis_length(a: list[int]) -> int:
    tails = []
    for x in a:
        pos = bisect.bisect_left(tails, x)
        if pos == len(tails):
            tails.append(x)
        else:
            tails[pos] = x
    return len(tails)
```

### 具体的な実行例

$a = [3, 1, 4, 1, 5, 9, 2, 6]$:

| 処理する要素 | 操作 | tails |
|---|---|---|
| 3 | 追加 | [3] |
| 1 | tails[0]=3 を 1 に置換 | [1] |
| 4 | 追加 | [1, 4] |
| 1 | tails[0]=1 は同じ | [1, 4] |
| 5 | 追加 | [1, 4, 5] |
| 9 | 追加 | [1, 4, 5, 9] |
| 2 | tails[1]=4 を 2 に置換 | [1, 2, 5, 9] |
| 6 | tails[2]=5 を 6 に... ではなく tails[3]=9 を 6 に置換 | [1, 2, 5, 6] |

LIS の長さ = 4。

**注意:** 最終的な $\text{tails}$ 配列は LIS そのものではない。LIS を復元するには追加の情報が必要。

### なぜ正しいか

$\text{tails}$ の不変条件: $\text{tails}[k]$ は「長さ $k+1$ の増加部分列の末尾として取りうる最小値」。

置換操作は LIS の長さを変えないが、将来より長い LIS を作れる可能性を最大化する。末尾が小さいほど、後続の要素を追加しやすいからである。

## 計算量

| アルゴリズム | 時間計算量 | 空間計算量 |
|---|---|---|
| $O(n^2)$ DP | $O(n^2)$ | $O(n)$ |
| 二分探索法 | $O(n \log n)$ | $O(n)$ |

## LIS の復元

二分探索法で LIS 自体を復元するには、各要素が tails のどの位置に入ったかを記録する。

```python title="lis_restore.py"
import bisect

def lis_sequence(a: list[int]) -> list[int]:
    n = len(a)
    tails = []
    pos = [0] * n  # pos[i] = a[i] が tails の何番目に入ったか
    for i, x in enumerate(a):
        p = bisect.bisect_left(tails, x)
        pos[i] = p
        if p == len(tails):
            tails.append(x)
        else:
            tails[p] = x
    # Reconstruct
    lis_len = len(tails)
    result = [0] * lis_len
    k = lis_len - 1
    for i in range(n - 1, -1, -1):
        if pos[i] == k:
            result[k] = a[i]
            k -= 1
    return result
```

## 応用

- 最長非減少部分列 (`bisect_right` を使う)
- パーミュテーションの最長増加部分列 (Young 盤との関連)
- 最小パス被覆問題 (Dilworth の定理)
- 封筒の入れ子問題 (2次元 LIS)

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n$ の数列 |
| 出力 | LIS の長さ |
| 時間計算量 | $O(n \log n)$ |
| 空間計算量 | $O(n)$ |
| 核心 | tails 配列と二分探索による効率的な末尾管理 |
