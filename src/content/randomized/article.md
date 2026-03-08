---
title: "Randomized Algorithm (乱択) 解説"
---

## 乱択アルゴリズムとは

乱択アルゴリズム (Randomized Algorithm) は、計算過程で乱数を使用するアルゴリズムの総称である。確率的な選択により、最悪ケースを回避したり、期待計算量を改善したりする。

## 分類

### Las Vegas アルゴリズム

出力は常に正しい。実行時間がランダム。

- 例: 乱択QuickSort (期待 $O(n \log n)$、最悪 $O(n^2)$)

### Monte Carlo アルゴリズム

実行時間は確定的だが、出力が確率的に正しい。

- 例: Miller-Rabin 素数判定

## 例: 乱択QuickSelect

$k$ 番目に小さい要素を期待 $O(n)$ で求める。

```python title="quickselect.py"
import random

def quickselect(a: list[int], k: int) -> int:
    if len(a) == 1:
        return a[0]
    pivot = random.choice(a)
    lo = [x for x in a if x < pivot]
    eq = [x for x in a if x == pivot]
    hi = [x for x in a if x > pivot]
    if k < len(lo):
        return quickselect(lo, k)
    elif k < len(lo) + len(eq):
        return pivot
    else:
        return quickselect(hi, k - len(lo) - len(eq))
```

## 計算量解析

ピボットが「良い」 (全体の $1/4$ ~ $3/4$ の位置) 確率は $1/2$。期待的に $O(\log n)$ 回の良いピボット選択で問題サイズが定数倍に縮小する。

$$
E[T(n)] = O(n)
$$

## 応用

- **QuickSort/QuickSelect**: ピボットの乱択選択
- **ハッシュ関数**: 衝突回避
- **Treap**: 乱択優先度による平衡二分探索木
- **最小カット**: Karger のアルゴリズム

## まとめ

| 項目 | 内容 |
|------|------|
| 核心 | 乱数による最悪ケース回避 |
| Las Vegas | 常に正しい結果、ランダムな実行時間 |
| Monte Carlo | 確定的な実行時間、確率的に正しい結果 |
