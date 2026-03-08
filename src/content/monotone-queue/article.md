---
title: "Monotone Queue (Sliding Window Minimum) 解説"
---

## Monotone Queue とは

Monotone Queue (単調キュー / 単調デック) は、両端キュー (deque) を使い、スライディングウィンドウ上の最小値 (または最大値) を各位置 $O(1)$ 償却で求めるデータ構造である。

## 問題

長さ $n$ の配列 $A$ とウィンドウサイズ $k$ が与えられたとき、各ウィンドウ $[i, i+k-1]$ の最小値を求めよ。

## アルゴリズム

```python title="monotone_queue.py"
from collections import deque

def sliding_window_min(a: list[int], k: int) -> list[int]:
    dq = deque()  # indices
    result = []
    for i in range(len(a)):
        # Remove elements outside window
        while dq and dq[0] <= i - k:
            dq.popleft()
        # Maintain monotonicity
        while dq and a[dq[-1]] >= a[i]:
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            result.append(a[dq[0]])
    return result
```

### 不変条件

デック内のインデックスに対応する値は常に単調増加を維持する。デックの先頭が常にウィンドウ内の最小値を指す。

## 計算量

各要素は高々1回追加・1回削除されるため、全体で $O(n)$ である。

$$
T(n) = O(n)
$$

## 応用

- **DP の高速化**: $dp[i] = \min_{j \in [i-k, i-1]} dp[j] + C(i)$ の形の遷移
- **最大長方形問題**: 各行ごとにヒストグラムを構築し、スライディングウィンドウ最小値で解く
- **制約付き最適化**: ウィンドウ内の最大・最小の差が閾値以下の最長区間

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n$ の配列、ウィンドウサイズ $k$ |
| 出力 | 各ウィンドウの最小値 |
| 時間計算量 | $O(n)$ |
| 空間計算量 | $O(k)$ |
