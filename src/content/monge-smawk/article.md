---
title: "Monge性とSMAWK 解説"
---

## Monge 行列とは

$n \times m$ 行列 $A$ が **Monge 行列** (inverse Monge 行列) であるとは、任意の $i < i'$, $j < j'$ に対して:

$$
A[i][j] + A[i'][j'] \leq A[i][j'] + A[i'][j]
$$

が成り立つことをいう。直感的には「左上 + 右下 $\leq$ 右上 + 左下」である。

### Totally Monotone 行列との関係

Monge 行列は **totally monotone** 行列のサブクラスである。totally monotone 行列では、各行の最小値の位置が単調非減少:

$$
\text{argmin}_j A[0][j] \leq \text{argmin}_j A[1][j] \leq \cdots
$$

## SMAWK アルゴリズム

SMAWK アルゴリズムは、$n \times m$ totally monotone 行列の全ての行の最小値を $O(n + m)$ で求める。

### アルゴリズムの3ステップ

1. **REDUCE**: 列数を $n$ 以下に削減 ($O(m)$)
2. **再帰**: 奇数行のみを取り出した部分行列 (これも totally monotone) に対して再帰的に行最小値を求める ($T(n/2)$)
3. **補間 (Interpolate)**: 奇数行の結果を使って偶数行の行最小値を求める ($O(n)$)

### REDUCE ステップ

$m > n$ のとき、不要な列を除去して $n$ 列にする:

```python title="smawk_reduce.py"
def reduce(matrix, rows, cols):
    stack = []
    for j in cols:
        while stack:
            i = rows[len(stack) - 1]
            if matrix[i][stack[-1]] > matrix[i][j]:
                stack.pop()
            elif len(stack) < len(rows):
                break
            else:
                stack.pop()
        if len(stack) < len(rows):
            stack.append(j)
    return stack
```

### 完全なSMAWK

```python title="smawk.py"
def smawk(matrix, rows, cols):
    # Base case
    if len(rows) == 0:
        return {}

    # REDUCE
    cols = reduce(matrix, rows, cols)

    # Recursive call on odd-indexed rows
    odd_rows = [rows[i] for i in range(1, len(rows), 2)]
    sub_result = smawk(matrix, odd_rows, cols)

    # Interpolate even rows
    result = dict(sub_result)
    col_idx = 0
    for i in range(0, len(rows), 2):
        row = rows[i]
        # Search between neighboring odd rows' results
        lo = 0
        hi = len(cols) - 1
        if i > 0:
            lo = cols.index(result[rows[i - 1]])
        if i + 1 < len(rows):
            hi = cols.index(result[rows[i + 1]])

        best_col = cols[lo]
        best_val = matrix[row][cols[lo]]
        for j_idx in range(lo + 1, hi + 1):
            if matrix[row][cols[j_idx]] < best_val:
                best_val = matrix[row][cols[j_idx]]
                best_col = cols[j_idx]
        result[row] = best_col

    return result
```

## 計算量

### 命題: SMAWK は $O(n + m)$

**証明:**

REDUCE は $O(m)$ で列を $n$ 以下にする。再帰は行数を半分にし、各再帰で $O(n)$ の補間を行う:

$$
T(n) = T(n/2) + O(n)
$$

これを解くと $T(n) = O(n)$。REDUCE の $O(m)$ を加えて全体は $O(n + m)$。 $\square$

## DPへの応用

1D/1D DP のコスト関数が Monge 条件を満たすとき、遷移行列が totally monotone になり、SMAWK (またはオンライン版の LARSCH) を適用して遷移全体を $O(n)$ で計算できる。

### Monge 条件の確認

コスト関数 $C(j, i)$ が以下を満たすか確認する:

$$
C(j, i) + C(j', i') \leq C(j, i') + C(j', i) \quad (j < j',\ i < i')
$$

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $n \times m$ totally monotone 行列 |
| 出力 | 各行の最小値位置 |
| 時間計算量 | $O(n + m)$ |
| 空間計算量 | $O(n + m)$ |
| 核心 | REDUCE + 奇数行の再帰 + 偶数行の補間 |
| 応用 | Monge コスト関数の 1D/1D DP |
