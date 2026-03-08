---
title: "Tim Sort 解説"
---

## Tim Sort とは

Tim Sort は、Tim Peters が 2002 年に Python の標準ソートとして設計した**ハイブリッドソートアルゴリズム**である。Merge Sort と Insertion Sort を組み合わせ、現実世界のデータに含まれる既存の整列パターンを活用して高い性能を発揮する。

Python の `list.sort()` と `sorted()`、Java の `Arrays.sort(Object[])` など、多くの言語の標準ライブラリで採用されている。

## アルゴリズムの概要

### 2 つのフェーズ

1. **Run 生成フェーズ:** 配列を "run" (既にソートされた部分列) に分割する。短い run は Insertion Sort で最低長 (minRun) まで拡張する
2. **マージフェーズ:** run をマージルールに従ってマージする

### minRun の決定

minRun は通常 32 ~ 64 の範囲で、$n / \text{minRun}$ が 2 の累乗またはそれに近くなるように選ばれる。これによりマージフェーズでの効率が最大化される。

```python
def compute_min_run(n: int) -> int:
    r = 0
    while n >= 64:
        r |= n & 1
        n >>= 1
    return n + r
```

### Run の検出

自然な run (昇順または降順の連続部分列) を検出する。降順の run は反転して昇順にする。run が minRun より短ければ、Insertion Sort で minRun まで拡張する。

## マージルール

Tim Sort の核心は、run スタック上で以下の不変条件を維持するマージルールである:

1. $|Z| > |Y| + |X|$
2. $|Y| > |X|$

ここで $X, Y, Z$ はスタックの上位 3 つの run の長さ。この条件が崩れたら、$Y$ を $X$ または $Z$ のうち小さい方とマージする。

### なぜこのルールか

この不変条件により、run の長さがフィボナッチ数列のように増加し、スタック上の run 数は $O(\log n)$ に抑えられる。また、似た長さの run 同士がマージされるため効率が良い。

## 最適化テクニック

### Galloping Mode

マージ中、一方の run から連続して要素が選ばれる場合、**ギャロッピングモード**に切り替える。二分探索を用いて、もう一方の run から一度に多くの要素をコピーする。

これにより、一方が明らかに小さい場合のマージコストが $O(n)$ から $O(\log n)$ に改善される。

### 一時バッファの最適化

マージ時に、小さい方の run のみを一時バッファにコピーする。これにより使用メモリが半減する。

## 実装の概要

```python title="tim_sort_simplified.py"
MIN_RUN = 32

def tim_sort(a: list[int]) -> list[int]:
    n = len(a)

    # Phase 1: Create runs with insertion sort
    for start in range(0, n, MIN_RUN):
        end = min(start + MIN_RUN, n)
        insertion_sort(a, start, end)

    # Phase 2: Merge runs
    size = MIN_RUN
    while size < n:
        for left in range(0, n, 2 * size):
            mid = min(left + size, n)
            right = min(left + 2 * size, n)
            if mid < right:
                merge(a, left, mid, right)
        size *= 2

    return a
```

## 計算量

| ケース | 時間計算量 | 説明 |
|--------|-----------|------|
| 最良 | $O(n)$ | 既にソート済み (1つの run) |
| 平均 | $O(n \log n)$ | |
| 最悪 | $O(n \log n)$ | |

**空間計算量:** $O(n)$

### 最良ケースが $O(n)$ である理由

入力が既にソート済みの場合、全体が 1 つの run として検出される。マージが不要なため、$O(n)$ で完了する。

## 安定性

Tim Sort は**安定ソート**である。Insertion Sort もマージ操作も安定であり、等しい要素の相対順序が保存される。

## 特徴と応用

### 長所

- 最悪でも $O(n \log n)$ 保証
- 既にほぼソート済みのデータで $O(n)$ に近い性能
- 安定ソート
- 実データの既存パターンを活用

### 短所

- 実装が複雑
- $O(n)$ の追加メモリが必要
- 純粋にランダムなデータでは Quick Sort より遅いことがある

### 採用実績

- Python: `list.sort()`, `sorted()`
- Java: `Arrays.sort(Object[])`
- Android: `Arrays.sort()`
- Rust: `slice::sort()` (の基盤の一部)

## まとめ

| 項目 | 内容 |
|------|------|
| 時間計算量 (最良/平均/最悪) | $O(n)$ / $O(n \log n)$ / $O(n \log n)$ |
| 空間計算量 | $O(n)$ |
| 安定性 | 安定 |
| in-place | いいえ |
| 手法 | Insertion Sort + Merge Sort のハイブリッド |
