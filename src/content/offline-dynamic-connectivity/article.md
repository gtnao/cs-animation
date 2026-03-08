---
title: "オフライン削除 (Offline Dynamic Connectivity) 解説"
---

## Offline Dynamic Connectivity とは

Offline Dynamic Connectivity は、無向グラフに対する辺の追加・削除・連結性クエリをオフラインで効率的に処理する手法である。

## 問題設定

時刻 $1, 2, \ldots, T$ にわたる以下の操作列が事前に全て与えられる:

- `add(u, v)`: 辺 $(u, v)$ を追加
- `remove(u, v)`: 辺 $(u, v)$ を削除
- `query(u, v)`: $u$ と $v$ が連結か判定

## アルゴリズム

### セグメント木 + Rollback可能Union-Find

1. 各辺の「生存区間」 $[t_{add}, t_{remove})$ を求める
2. 時間軸上のセグメント木に辺を追加 (区間への辺の登録)
3. セグメント木をDFSし、各ノードで辺をunion、葉でクエリに回答、帰りがけにrollback

```python title="offline_dynamic_connectivity.py"
def solve(n: int, operations):
    # Build segment tree on time axis
    # For each edge, determine [add_time, remove_time)
    # DFS the segment tree with rollback union-find
    pass
```

## 計算量

$$
T(Q) = O(Q \log^2 Q)
$$

- セグメント木の深さ: $O(\log T)$
- 各辺は $O(\log T)$ 個のノードに登録される
- 各union/find: $O(\log N)$

## 応用

- **動的な連結成分の管理**
- **二部グラフ性の動的判定**
- **最小全域木のオフライン更新**

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 辺の追加・削除・クエリ列 |
| 出力 | 各クエリ時点での連結性 |
| 時間計算量 | $O(Q \log^2 Q)$ |
| 核心 | セグメント木 + Rollback可能Union-Find |
