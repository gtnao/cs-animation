---
title: "Radix Sort 解説"
---

## Radix Sort とは

Radix Sort (基数ソート) は、数値の各桁に対して安定ソートを適用することで全体を整列する**非比較ベース**のソートアルゴリズムである。最下位桁 (LSD: Least Significant Digit) から順に処理する LSD Radix Sort が一般的である。

## アルゴリズムの概要

### LSD Radix Sort の手順

1. 最下位桁 (1の位) から順に処理する
2. 各桁について安定ソート (通常 Counting Sort) を適用する
3. 最上位桁まで処理したらソート完了

### なぜ最下位桁から処理するのか

最下位桁から処理する理由は**安定性**にある。下位桁でソートした結果が、上位桁のソート時に同じキーの要素間で保存されるため、最終的に全桁を考慮したソートが得られる。

### 具体例

配列 `[170, 45, 75, 90, 802, 24, 2, 66]` をソートする:

**1の位でソート:**
`[170, 90, 802, 2, 24, 45, 75, 66]`

**10の位でソート:**
`[802, 2, 24, 45, 66, 170, 75, 90]`

**100の位でソート:**
`[2, 24, 45, 66, 75, 90, 170, 802]`

## 実装

```python title="radix_sort.py"
def radix_sort(a: list[int]) -> list[int]:
    if not a:
        return a
    max_val = max(a)
    exp = 1
    while max_val // exp > 0:
        a = counting_sort_by_digit(a, exp)
        exp *= 10
    return a

def counting_sort_by_digit(a: list[int], exp: int) -> list[int]:
    n = len(a)
    output = [0] * n
    count = [0] * 10

    # Count occurrences of each digit
    for x in a:
        digit = (x // exp) % 10
        count[digit] += 1

    # Cumulative sum
    for i in range(1, 10):
        count[i] += count[i - 1]

    # Place elements (right to left for stability)
    for i in range(n - 1, -1, -1):
        digit = (a[i] // exp) % 10
        count[digit] -= 1
        output[count[digit]] = a[i]

    return output
```

## 計算量

| ケース | 時間計算量 | 説明 |
|--------|-----------|------|
| 全ケース | $O(d \cdot (n + k))$ | $d$ は桁数、$k$ は基数 |

十進数の場合 $k = 10$, $d = \lfloor \log_{10}(\max) \rfloor + 1$ なので:

$$
O(d \cdot (n + 10)) = O(d \cdot n)
$$

$d$ が定数とみなせる場合、$O(n)$ となる。

**空間計算量:** $O(n + k)$

## 正当性の証明

### 帰納法

$d$ 桁目までのソートが正しいことを帰納法で証明する。

**基底ケース:** 1桁目 (最下位桁) のソート後、1桁目に関してソート済み。

**帰納ステップ:** $d-1$ 桁目まで正しくソートされていると仮定する。$d$ 桁目で安定ソートを適用すると:
- $d$ 桁目が異なる要素は $d$ 桁目の順序で並ぶ
- $d$ 桁目が同じ要素は安定性により $d-1$ 桁目までの順序が保存される

したがって、$d$ 桁目までのソートが正しい。

## 安定性

Radix Sort は**安定ソート**である (各桁のソートに安定ソートを使用する場合)。

## MSD Radix Sort

最上位桁 (MSD: Most Significant Digit) から処理する方式もある。MSD Radix Sort は文字列のソートに適しているが、再帰的な実装が必要であり、各バケットを独立にソートする。

## 特徴と応用

### 長所

- 桁数が定数なら $O(n)$ の線形時間
- 安定ソート
- 非比較ベース

### 短所

- 整数や固定長文字列にのみ適用可能
- $O(n + k)$ の追加メモリが必要
- 桁数が多いと遅くなる

### 応用場面

- 整数データの高速ソート
- 文字列のソート (MSD)
- 基数木 (Radix Tree) との組み合わせ

## まとめ

| 項目 | 内容 |
|------|------|
| 時間計算量 | $O(d \cdot (n + k))$ |
| 空間計算量 | $O(n + k)$ |
| 安定性 | 安定 |
| in-place | いいえ |
| 手法 | 桁ごとの安定ソートの繰り返し |
