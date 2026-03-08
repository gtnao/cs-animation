---
title: "Offline Query (クエリ先読み) 解説"
---

## Offline Query とは

Offline Query (オフラインクエリ / クエリ先読み) は、全てのクエリを事前に読み込み、**処理順序を最適化**することで効率的に回答する手法の総称である。

## オンラインとオフラインの違い

- **オンライン**: クエリが1つずつ到着し、即座に回答する
- **オフライン**: 全クエリを事前に知った上で、好きな順序で処理できる

オフラインが許される場合、クエリの順序を並べ替えることで計算量を大幅に削減できることがある。

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

Mo's Algorithm は区間クエリをオフラインで効率的に処理する代表的なアルゴリズムである。以下で詳しく解説する。

### 3. 平方分割によるその他の手法

クエリを $\sqrt{N}$ サイズのブロックでまとめて処理するパターンは Mo's Algorithm 以外にも存在する。例えば、区間更新クエリを平方分割でバッチ処理する手法がある。

## Mo's Algorithm

### 概要

Mo's Algorithm は、配列上の**区間クエリ** $[l, r]$ を多数処理する問題に適用できる。各クエリに対して区間の「答え」を求めるが、区間の左端・右端を 1 つ動かすごとに $O(f)$ で答えを更新できるとき、全体を $O((N + Q)\sqrt{N} \cdot f)$ で処理する。

**適用条件:**

- 全クエリが事前に分かっている (オフライン)
- 区間 $[l, r]$ を $[l \pm 1, r]$ や $[l, r \pm 1]$ に変更したときの答えの差分を高速に計算できる

### ブロック分割とソート

配列のインデックスを $B = \lceil \sqrt{N} \rceil$ ごとのブロックに分割する。クエリ $(l_i, r_i)$ を次の基準でソートする:

1. 左端 $l_i$ が属するブロック番号 $\lfloor l_i / B \rfloor$ の昇順
2. 同じブロック内では、右端 $r_i$ の昇順 (偶数ブロックでは昇順、奇数ブロックでは降順にすると定数倍の改善になる)

```python title="mos_algorithm.py"
import math

def mos_algorithm(n: int, queries: list[tuple[int, int]]) -> list[int]:
    B = max(1, int(math.sqrt(n)))
    q = len(queries)

    # Sort queries by (block of l, r)
    order = sorted(range(q), key=lambda i: (queries[i][0] // B, queries[i][1]))

    answers = [0] * q
    cur_l, cur_r = 0, -1  # current window [cur_l, cur_r]
    current_answer = 0

    def add(idx):
        nonlocal current_answer
        # Update current_answer when adding a[idx] to the window
        pass

    def remove(idx):
        nonlocal current_answer
        # Update current_answer when removing a[idx] from the window
        pass

    for qi in order:
        l, r = queries[qi]
        # Expand or shrink the window to [l, r]
        while cur_r < r:
            cur_r += 1
            add(cur_r)
        while cur_l > l:
            cur_l -= 1
            add(cur_l)
        while cur_r > r:
            remove(cur_r)
            cur_r -= 1
        while cur_l < l:
            remove(cur_l)
            cur_l += 1
        answers[qi] = current_answer

    return answers
```

### add/remove 操作の実装パターン

Mo's Algorithm の核心は `add` と `remove` の実装にある。典型的な例を示す。

**例: 区間内の異なる値の数**

配列 $a$ に対して、$[l, r]$ 内に何種類の値があるかを求める問題:

```python title="distinct_count.py"
cnt = {}  # value -> count
distinct = 0

def add(idx):
    global distinct
    v = a[idx]
    cnt[v] = cnt.get(v, 0) + 1
    if cnt[v] == 1:
        distinct += 1

def remove(idx):
    global distinct
    v = a[idx]
    cnt[v] -= 1
    if cnt[v] == 0:
        distinct -= 1
        del cnt[v]
```

### 具体例による動作追跡

配列 $a = [1, 3, 2, 1, 3, 2, 1, 3, 2, 1]$ (長さ $N = 10$) に対して、以下の 5 つのクエリ (区間内の異なる値の数) を処理する。$B = \lceil \sqrt{10} \rceil = 4$ とする。

| クエリ番号 | $l$ | $r$ | ブロック $\lfloor l/4 \rfloor$ |
|-----------|-----|-----|------|
| Q0 | 0 | 3 | 0 |
| Q1 | 6 | 9 | 1 |
| Q2 | 1 | 5 | 0 |
| Q3 | 4 | 7 | 1 |
| Q4 | 2 | 4 | 0 |

ソート後の処理順: Q0 → Q2 → Q4 → Q1 → Q3

**ステップ 1: Q0 $[0, 3]$**
- ウィンドウを $[0, 3]$ に拡張: $\{1, 3, 2, 1\}$ → 異なる値 = **3**

**ステップ 2: Q2 $[1, 5]$**
- 左端を 0→1 に移動 (remove $a[0] = 1$)、右端を 3→5 に拡張 (add $a[4] = 3$, $a[5] = 2$)
- ウィンドウ: $\{3, 2, 1, 3, 2\}$ → 異なる値 = **3**

**ステップ 3: Q4 $[2, 4]$**
- 左端を 1→2 に移動、右端を 5→4 に収縮
- ウィンドウ: $\{2, 1, 3\}$ → 異なる値 = **3**

**ステップ 4: Q1 $[6, 9]$**
- 左端を 2→6 に移動、右端を 4→9 に拡張
- ウィンドウ: $\{1, 3, 2, 1\}$ → 異なる値 = **3**

**ステップ 5: Q3 $[4, 7]$**
- 左端を 6→4 に移動、右端を 9→7 に収縮
- ウィンドウ: $\{3, 2, 1, 3\}$ → 異なる値 = **3**

### 計算量の証明

#### 命題: Mo's Algorithm の時間計算量は $O((N + Q)\sqrt{N})$

**証明:**

ブロックサイズを $B = \sqrt{N}$ とする。右端と左端のポインタの移動量をそれぞれ評価する。

**右端 $r$ の移動量:**

同一ブロック内のクエリはソート後に $r$ が昇順になるため、各ブロック内で $r$ の移動は合計 $O(N)$ 。ブロック数は $O(N/B) = O(\sqrt{N})$ なので、$r$ の総移動量は:

$$
O(N \cdot \sqrt{N}) = O(N\sqrt{N})
$$

ブロックが切り替わるときに $r$ が最大 $N$ 移動するが、ブロックの切り替わりは $O(\sqrt{N})$ 回なので、ブロック間の移動は $O(N\sqrt{N})$ 。

**左端 $l$ の移動量:**

同一ブロック内のクエリ間では、$l$ は同じブロック内にあるため最大 $B$ しか移動しない。同一ブロック内のクエリが $k_j$ 個あるとき、左端の移動は $O(k_j \cdot B)$ 。全ブロックについて合計すると:

$$
\sum_j O(k_j \cdot B) = O(Q \cdot B) = O(Q\sqrt{N})
$$

**全体:**

$$
O(N\sqrt{N} + Q\sqrt{N}) = O((N + Q)\sqrt{N})
$$

各 add/remove が $O(f)$ かかる場合は $O((N + Q)\sqrt{N} \cdot f)$ となる。 $\square$

#### ブロックサイズの最適化

$B = \sqrt{N}$ は $N$ と $Q$ が同程度のときに最適である。一般には $B = N / \sqrt{Q}$ とすると:

$$
O(N\sqrt{Q} + Q \cdot N / \sqrt{Q}) = O(N\sqrt{Q})
$$

となり、$Q$ が $N$ と大きく異なる場合に改善できる。

### Mo's Algorithm with Rollback

通常の Mo's Algorithm では `add` と `remove` の両方が必要だが、**remove が困難** (例えば区間最大値の管理) な場合がある。Mo's Algorithm with Rollback (Mo with Undo) では remove を使わず、**add のみ**で動作する変種である。

基本的なアイデア:

1. 同一ブロック内のクエリは愚直に計算する
2. ブロック境界から右に向かって $r$ を伸ばしていく
3. 左端の分は一時的に追加してから、ブロック境界まで rollback する

この手法には rollback 可能なデータ構造が必要であり、Undo 可能データ構造と自然に組み合わせられる。

### 木上の Mo's Algorithm

木上のパスクエリに Mo's Algorithm を適用することもできる。Euler Tour による展開を用いて、木上のパスを配列上の区間に変換する。

## 計算量

手法により異なるが、典型的には:

- ソート基準の処理: $O(Q \log Q + N)$
- Mo's Algorithm: $O((N + Q)\sqrt{N})$

## 応用

- **区間クエリ**: 区間和、区間中の異なる値の数
- **動的グラフ問題**: 辺の追加・削除を時系列でセグメント木に載せる
- **永続データ構造の代替**: オフラインなら永続化不要な場合がある
- **区間の最頻値**: add/remove で頻度配列を更新
- **区間内の転倒数**: BIT と組み合わせる

## まとめ

| 項目 | 内容 |
|------|------|
| 前提 | 全クエリが事前に既知 |
| 核心 | 処理順序の最適化 |
| 代表手法 | ソート, Mo's Algorithm, セグメント木 |
| Mo's の計算量 | $O((N + Q)\sqrt{N})$ |
| ブロックサイズ | $B = \sqrt{N}$ (一般には $N / \sqrt{Q}$) |
| 変種 | Mo with Rollback, 木上の Mo |
