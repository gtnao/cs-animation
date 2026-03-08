---
title: "編集距離 (Levenshtein) 解説"
---

## 編集距離 (Levenshtein 距離) とは

編集距離 (Levenshtein 距離) は、2つの文字列間の「距離」を、一方の文字列を他方に変換するために必要な**最小操作回数**で測る指標である。許される操作は以下の3つ:

1. **挿入** (Insert): 文字を1つ挿入する
2. **削除** (Delete): 文字を1つ削除する
3. **置換** (Replace): 文字を別の文字に置き換える

### 定義

文字列 $s$ を $t$ に変換する最小操作回数を $d(s, t)$ と書く。これは距離の公理を満たす:

- $d(s, t) \geq 0$ (非負性)
- $d(s, t) = 0 \iff s = t$ (同一性)
- $d(s, t) = d(t, s)$ (対称性)
- $d(s, u) \leq d(s, t) + d(t, u)$ (三角不等式)

### 具体例

"kitten" を "sitting" に変換するには:

1. kitten → sitten (k を s に置換)
2. sitten → sittin (e を i に置換)
3. sittin → sitting (末尾に g を挿入)

編集距離 = 3。

## 動的計画法

### 状態と遷移

$dp[i][j]$ を「$s$ の先頭 $i$ 文字を $t$ の先頭 $j$ 文字に変換する最小操作回数」と定義する。

$$
dp[i][j] = \begin{cases}
j & \text{if } i = 0 \\
i & \text{if } j = 0 \\
dp[i-1][j-1] & \text{if } s_i = t_j \\
1 + \min(dp[i-1][j-1],\, dp[i-1][j],\, dp[i][j-1]) & \text{if } s_i \neq t_j
\end{cases}
$$

各遷移の意味:

- $dp[i-1][j-1]$: 置換 (一致なら操作不要)
- $dp[i-1][j]$: $s$ から文字を削除
- $dp[i][j-1]$: $t$ の文字を挿入

### 実装

```python title="edit_distance.py"
def edit_distance(s: str, t: str) -> int:
    m, n = len(s), len(t)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s[i - 1] == t[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j - 1],  # replace
                    dp[i - 1][j],       # delete
                    dp[i][j - 1],       # insert
                )
    return dp[m][n]
```

### 空間最適化

2行分のみ保持すれば $O(\min(m, n))$ の空間で計算できる。

```python title="edit_distance_opt.py"
def edit_distance_opt(s: str, t: str) -> int:
    if len(s) < len(t):
        s, t = t, s
    m, n = len(s), len(t)
    prev = list(range(n + 1))
    curr = [0] * (n + 1)
    for i in range(1, m + 1):
        curr[0] = i
        for j in range(1, n + 1):
            if s[i - 1] == t[j - 1]:
                curr[j] = prev[j - 1]
            else:
                curr[j] = 1 + min(prev[j - 1], prev[j], curr[j - 1])
        prev, curr = curr, prev
    return prev[n]
```

## 計算量

| 項目 | 値 |
|------|------|
| 時間計算量 | $O(mn)$ |
| 空間計算量 | $O(mn)$ (最適化で $O(\min(m, n))$) |

## 操作列の復元

DPテーブルを逆にたどることで、具体的な操作列を復元できる。

```python title="edit_distance_trace.py"
def edit_operations(s: str, t: str) -> list[str]:
    m, n = len(s), len(t)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s[i - 1] == t[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1])
    # Traceback
    ops = []
    i, j = m, n
    while i > 0 or j > 0:
        if i > 0 and j > 0 and s[i-1] == t[j-1]:
            i -= 1; j -= 1
        elif i > 0 and j > 0 and dp[i][j] == dp[i-1][j-1] + 1:
            ops.append(f"Replace s[{i-1}]='{s[i-1]}' with '{t[j-1]}'")
            i -= 1; j -= 1
        elif i > 0 and dp[i][j] == dp[i-1][j] + 1:
            ops.append(f"Delete s[{i-1}]='{s[i-1]}'")
            i -= 1
        else:
            ops.append(f"Insert '{t[j-1]}'")
            j -= 1
    return ops[::-1]
```

## 変種

### 重み付き編集距離

各操作に異なるコストを割り当てる場合:

$$
dp[i][j] = \min(dp[i-1][j-1] + c_{\text{rep}},\, dp[i-1][j] + c_{\text{del}},\, dp[i][j-1] + c_{\text{ins}})
$$

### Damerau-Levenshtein 距離

隣接2文字の**転置** (transposition) も許す。

### ハミング距離

同じ長さの文字列に対して、置換のみを考える。

## 応用

- スペルチェック
- DNA 配列比較 (バイオインフォマティクス)
- 機械翻訳の評価 (WER: Word Error Rate)
- ファジー文字列マッチング
- 自然言語処理 (類似文検出)

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 2つの文字列 $s$ (長さ $m$), $t$ (長さ $n$) |
| 出力 | 最小編集距離 |
| 時間計算量 | $O(mn)$ |
| 空間計算量 | $O(\min(m, n))$ (最適化時) |
| 核心 | 3つの操作の最小コストを再帰的に選択 |
