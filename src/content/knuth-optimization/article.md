---
title: "Knuth's Optimization 解説"
---

## Knuth's Optimization とは

Knuth's Optimization は、区間DP:

$$
dp[i][j] = \min_{i \leq k < j} (dp[i][k] + dp[k+1][j]) + C(i, j)
$$

において、コスト関数 $C$ が**四辺形不等式** (quadrangle inequality) を満たすとき、計算量を $O(n^3)$ から $O(n^2)$ に改善するテクニックである。

1971年に Donald Knuth が最適二分探索木の問題で発見し、1980年に F. Frances Yao が一般化した。

## 適用条件

コスト関数 $C(i, j)$ が以下を満たすこと:

### 四辺形不等式

$$
C(a, c) + C(b, d) \leq C(a, d) + C(b, c) \quad (a \leq b \leq c \leq d)
$$

### 直感的な意味

四辺形不等式は「区間を広げるコストの増分が、開始位置が遅いほど大きくない」ことを表す。言い換えると、区間を 1 つ広げたときの追加コストが、もともと狭い区間のほうが大きい (または等しい) という性質である。

不等式を変形すると:

$$
C(a, d) - C(a, c) \geq C(b, d) - C(b, c) \quad (a \leq b \leq c \leq d)
$$

左辺は「区間 $[a, \cdot]$ を $c$ から $d$ に広げるコスト増分」、右辺は「区間 $[b, \cdot]$ を同様に広げるコスト増分」である。$a \leq b$ なので、始点が早い (区間が広い) ほうがコスト増分が大きいことを意味する。これは「広い区間にさらに要素を追加するほどコストの上昇が顕著になる」という自然な性質に対応している。

### 単調性

$$
C(b, c) \leq C(a, d) \quad (a \leq b \leq c \leq d)
$$

これは「より狭い区間のコストは、それを含む広い区間のコスト以下」という自然な条件である。

## 最適分割点の単調性

### 命題

$C$ が四辺形不等式と単調性を満たすとき、$dp$ も四辺形不等式を満たし、最適分割点 $\text{opt}[i][j]$ は以下を満たす:

$$
\text{opt}[i][j-1] \leq \text{opt}[i][j] \leq \text{opt}[i+1][j]
$$

### 証明スケッチ

**Step 1: $dp$ が四辺形不等式を満たすことの帰納法**

区間の長さ $j - i$ に関する帰納法で示す。基底ケースは区間長 0 または 1 で自明。

帰納ステップでは、$a \leq b \leq c \leq d$ に対して $dp[a][c] + dp[b][d] \leq dp[a][d] + dp[b][c]$ を示す。$p = \text{opt}[a][d]$, $q = \text{opt}[b][c]$ とおく。$p \leq q$ の場合と $p > q$ の場合に分けて、帰納法の仮定と $C$ の四辺形不等式を組み合わせて不等式を得る。

**Step 2: $dp$ の四辺形不等式から最適分割点の単調性を導出**

$\text{opt}[i][j] = k^*$ とする。任意の $k < k^*$ に対して $dp[i][k^*] + dp[k^*+1][j] \leq dp[i][k] + dp[k+1][j]$ が成り立つ。$dp$ の四辺形不等式を使うと、$j$ を $j+1$ に増やしたとき、$k^*$ 以上の分割点のほうが有利であることが示せる。これにより $\text{opt}[i][j] \leq \text{opt}[i][j+1]$ が従う。同様に $\text{opt}[i][j] \leq \text{opt}[i+1][j]$ も示される。

## アルゴリズム

```python title="knuth_optimization.py"
def knuth(C, n):
    INF = float('inf')
    dp = [[0] * n for _ in range(n)]
    opt = [[0] * n for _ in range(n)]

    # Base case: length 1
    for i in range(n):
        opt[i][i] = i

    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = INF
            lo = opt[i][j - 1]
            hi = opt[i + 1][j] if i + 1 <= j else j
            for k in range(lo, hi + 1):
                val = dp[i][k] + dp[k + 1][j] + C(i, j)
                if val < dp[i][j]:
                    dp[i][j] = val
                    opt[i][j] = k

    return dp[0][n - 1]
```

### 実装上の注意

- 区間長の短い順 (ボトムアップ) に計算する必要がある。$\text{opt}[i][j-1]$ と $\text{opt}[i+1][j]$ が先に計算されている必要があるため
- $\text{opt}[i+1][j]$ の参照で $i+1 > j$ となる場合のガードが必要
- $C(i, j)$ の計算は分割点 $k$ によらないので、$k$ ループの外に出せる

## 計算量

### 命題: Knuth's Optimization は $O(n^2)$

**証明:**

固定した区間長 $\text{len}$ について、全ての区間 $[i, j]$ ($j = i + \text{len} - 1$) にわたって分割点の探索範囲のサイズの和を評価する。区間 $[i, j]$ における探索範囲は $[\text{opt}[i][j-1], \text{opt}[i+1][j]]$ であり、そのサイズは $\text{opt}[i+1][j] - \text{opt}[i][j-1] + 1$ 以下である。

$i = 0, 1, \ldots, n - \text{len}$ にわたって和を取る:

$$
\sum_{i=0}^{n-\text{len}} (\text{opt}[i+1][j] - \text{opt}[i][j-1] + 1)
$$

ここで $j = i + \text{len} - 1$ なので、$\text{opt}[i+1][j] = \text{opt}[i+1][i+\text{len}-1]$ かつ $\text{opt}[i][j-1] = \text{opt}[i][i+\text{len}-2]$ である。

この和をテレスコーピング (telescoping) で評価する。$+1$ の項は $O(n)$ 個。残りの項について、$\text{opt}[i+1][i+\text{len}-1]$ の部分を $h(i) = \text{opt}[i+1][i+\text{len}-1]$ と書くと:

$$
\sum_{i} (h(i) - \text{opt}[i][i+\text{len}-2]) = h(n-\text{len}) - \text{opt}[0][\text{len}-2] + \sum_{i=0}^{n-\text{len}-1}(h(i) - h(i)) = O(n)
$$

より正確にはテレスコーピングの結果、和は $\text{opt}[n-\text{len}+1][n-1] - \text{opt}[0][\text{len}-2] + (n - \text{len} + 1) \leq n + (n - \text{len} + 1) = O(n)$ となる。

区間長は $2$ から $n$ まであるので、全体は $O(n^2)$。 $\square$

## 代表的な問題

### 最適二分探索木

$n$ 個のキー $1, 2, \ldots, n$ があり、キー $i$ のアクセス頻度を $w_i$ とする。これらのキーを二分探索木に格納し、アクセスコスト (ルートからの深さ $\times$ 頻度) の総和を最小化したい。

#### 定式化

$dp[i][j]$ を「キー $i$ からキー $j$ で構成される最適な部分木のコスト」とする。$C(i, j) = \sum_{t=i}^{j} w_t$ (区間の頻度の和) とすると:

$$
dp[i][j] = \min_{i \leq k \leq j} (dp[i][k-1] + dp[k+1][j]) + C(i, j)
$$

ここで $C(i, j)$ が加算されるのは、部分木の根として $k$ を選ぶと、$i$ から $j$ までの全ノードの深さが 1 増えるためである。

#### 具体的数値例

キーが $1, 2, 3, 4$ で、アクセス頻度がそれぞれ $w = [2, 3, 1, 1]$ の場合を考える。累積和 $C(i, j) = \sum_{t=i}^{j} w_t$ は:

| | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| 1 | 2 | 5 | 6 | 7 |
| 2 | - | 3 | 4 | 5 |
| 3 | - | - | 1 | 2 |
| 4 | - | - | - | 1 |

区間長 1: $dp[i][i] = 0$, $\text{opt}[i][i] = i$

区間長 2:
- $dp[1][2] = dp[1][0] + dp[2][2] + C(1,2) = 0 + 0 + 5 = 5$ (根=$1$) と $dp[1][1] + dp[3][2] + C(1,2) = 0 + 0 + 5 = 5$ (根=$2$)。$\text{opt}[1][2] = 1$
- $dp[2][3] = \min(3 + 0, 0 + 3) + 4 = 4$。$\text{opt}[2][3] = 3$
- $dp[3][4] = \min(1 + 0, 0 + 1) + 2 = 2$。$\text{opt}[3][4] = 3$

区間長 3:
- $dp[1][3]$: $\text{opt}$ の探索範囲は $[\text{opt}[1][2], \text{opt}[2][3]] = [1, 3]$
  - $k=1$: $0 + 4 + 6 = 10$
  - $k=2$: $5 + 0 + 6 = 11$
  - $k=3$: $5 + 0 + 6 = 11$
  - 最小は $k=1$ で $dp[1][3] = 10$, $\text{opt}[1][3] = 1$
- $dp[2][4]$: 探索範囲 $[\text{opt}[2][3], \text{opt}[3][4]] = [3, 3]$
  - $k=3$: $3 + 0 + 5 = 8$
  - $dp[2][4] = 8$, $\text{opt}[2][4] = 3$

区間長 4:
- $dp[1][4]$: 探索範囲 $[\text{opt}[1][3], \text{opt}[2][4]] = [1, 3]$
  - $k=1$: $0 + 8 + 7 = 15$
  - $k=2$: $5 + 2 + 7 = 14$
  - $k=3$: $10 + 0 + 7 = 17$
  - 最小は $k=2$ で $dp[1][4] = 14$, $\text{opt}[1][4] = 2$

最適解: 根がキー $2$ で、左部分木にキー $1$、右部分木の根がキー $3$ でその右にキー $4$ という構造。コストは $3 \cdot 1 + 2 \cdot 2 + 1 \cdot 2 + 1 \cdot 3 = 14$ と確認できる (深さ 1, 2, 2, 3)。

#### 四辺形不等式の確認

$C(i, j) = \sum_{t=i}^{j} w_t$ (ただし $w_t \geq 0$) が四辺形不等式を満たすことを確認する。$a \leq b \leq c \leq d$ として:

$$
C(a, c) + C(b, d) - C(a, d) - C(b, c) = -\sum_{t=a}^{b-1} w_t - \sum_{t=c+1}^{d} w_t + \sum_{t=a}^{b-1} w_t + \sum_{t=c+1}^{d} w_t
$$

整理すると $C(a, c) + C(b, d) = C(a, d) + C(b, c)$ となり、等号で四辺形不等式が成立する。

## D&C Optimization との違い・使い分け

Knuth's Optimization と Divide & Conquer (D&C) Optimization はどちらも最適分割点の単調性を利用するが、対象とするDPの形が異なる。

| | Knuth's Optimization | D&C Optimization |
|---|---|---|
| DPの形 | $dp[i][j] = \min_k (dp[i][k] + dp[k+1][j]) + C(i,j)$ | $dp[k][j] = \min_t (dp[k-1][t] + C(t,j))$ |
| 問題の種類 | 区間DP (区間の分割) | 層DP ($k$ 個のグループへの分割) |
| 計算量改善 | $O(n^3) \to O(n^2)$ | $O(kn^2) \to O(kn \log n)$ |
| 最適分割点の関係 | $\text{opt}[i][j-1] \leq \text{opt}[i][j] \leq \text{opt}[i+1][j]$ | $\text{opt}(j_1) \leq \text{opt}(j_2)$ ($j_1 \leq j_2$) |

**使い分けの指針:**
- 区間の分割 (任意の位置で2つに分割) を繰り返す形の問題には **Knuth's Optimization**
- 配列を先頭から $k$ 個の連続区間に分割する形の問題には **D&C Optimization**

## まとめ

| 項目 | 内容 |
|------|------|
| 適用条件 | コスト関数が四辺形不等式と単調性を満たす |
| 時間計算量 | $O(n^2)$ |
| 空間計算量 | $O(n^2)$ |
| 核心 | 最適分割点の探索範囲を前後の区間の値で制限 |
| 応用 | 最適BST、括弧付け問題 |
