---
title: "Offline Query (クエリ先読み) 解説"
---

## Offline Query とは

Offline Query (オフラインクエリ / クエリ先読み) は、全てのクエリを事前に読み込み、**処理順序を最適化**することで効率的に回答する手法の総称である。

## オンラインとオフラインの違い

- **オンライン**: クエリが1つずつ到着し、即座に回答する
- **オフライン**: 全クエリを事前に知った上で、好きな順序で処理できる

## 代表的手法

### 1. ソートによるクエリ処理

クエリを特定の基準でソートし、走査と同期させる。

```python title="offline_sort.py"
def range_sum_offline(a: list[int], queries: list[tuple[int, int]]) -> list[int]:
    n = len(a)
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + a[i]
    
    answers = [0] * len(queries)
    for i, (l, r) in enumerate(queries):
        answers[i] = prefix[r + 1] - prefix[l]
    return answers
```

### 2. Mo's Algorithm

区間クエリを $\sqrt{n}$ のブロックサイズで分割・ソートし、$O((N + Q)\sqrt{N})$ で処理する。

### 3. 平方分割

## 計算量

手法により異なるが、典型的には:

- ソート基準の処理: $O(Q \log Q + N)$
- Mo's Algorithm: $O((N + Q)\sqrt{N})$

## 応用

- **区間クエリ**: 区間和、区間中の異なる値の数
- **動的グラフ問題**: 辺の追加・削除を時系列でセグメント木に載せる
- **永続データ構造の代替**: オフラインなら永続化不要な場合がある

## まとめ

| 項目 | 内容 |
|------|------|
| 前提 | 全クエリが事前に既知 |
| 核心 | 処理順序の最適化 |
| 代表手法 | ソート, Mo's Algorithm, セグメント木 |
