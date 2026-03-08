---
title: "Parallel Binary Search 解説"
---

## Parallel Binary Search とは

Parallel Binary Search (並列二分探索) は、複数の独立した二分探索を同時に行う手法である。各二分探索を個別に行うと合計 $O(Q \cdot M \cdot \text{check})$ かかるところ、並列化により $O((M + Q) \log M \cdot \text{check})$ に削減できる。

## 問題設定

$M$ 個のイベントが時系列で発生し、$Q$ 個のクエリそれぞれについて「条件が初めて満たされるイベント番号」を求めたい。

## アルゴリズム

```python title="parallel_binary_search.py"
def parallel_binary_search(queries, events, check):
    q = len(queries)
    lo = [0] * q
    hi = [len(events) - 1] * q
    
    for _ in range(20):  # log2(M) iterations
        buckets = {}
        for i in range(q):
            if lo[i] <= hi[i]:
                mid = (lo[i] + hi[i]) // 2
                buckets.setdefault(mid, []).append(i)
        
        # Process events and check queries at each mid point
        state = initialize()
        for t in range(len(events)):
            apply(state, events[t])
            if t in buckets:
                for qi in buckets[t]:
                    if check(state, queries[qi]):
                        hi[qi] = t - 1
                    else:
                        lo[qi] = t + 1
    
    return lo  # answers
```

## 計算量

各ラウンドで全イベントを1回走査する。ラウンド数は $O(\log M)$ 回。

$$
T = O((M + Q) \log M)
$$

## 応用

- **動的グラフの連結時刻**: 各クエリ対が初めて連結になる時刻
- **閾値問題**: 各クエリについて条件を満たす最小の閾値

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $M$ 個のイベント、$Q$ 個のクエリ |
| 出力 | 各クエリの答え |
| 時間計算量 | $O((M+Q) \log M)$ |
| 核心 | 二分探索の中間点をバケットに分けて一括処理 |
