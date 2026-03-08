---
title: "Grundy数 (Sprague-Grundy定理) 解説"
---

## Sprague-Grundy定理とは

Sprague-Grundy定理は、**不偏ゲーム (impartial game)** の勝敗を統一的に解析するための強力な理論である。

### 不偏ゲームの定義

以下の条件を満たすゲームを不偏ゲームと呼ぶ:

1. 2人のプレイヤーが交互に手番を行う
2. 両プレイヤーに同じ合法手が利用可能
3. 完全情報 (ランダム性なし)
4. 手が打てなくなったプレイヤーの負け (normal play convention)
5. 有限ステップで必ず終了する

## Grundy数 (nimber)

### 定義

ゲームの各状態 $s$ に対して、**Grundy数** $G(s)$ を以下のように再帰的に定義する。

$$
G(s) = \text{mex}(\{G(s') \mid s' \text{ は } s \text{ から到達可能な状態}\})
$$

ここで $\text{mex}$ (minimum excludant) は、与えられた非負整数の集合に含まれない最小の非負整数である。

$$
\text{mex}(S) = \min\{n \in \mathbb{N}_0 \mid n \notin S\}
$$

### 基本性質

- $G(s) = 0$ ならば状態 $s$ は **負け** (P-position, 後手必勝)
- $G(s) \neq 0$ ならば状態 $s$ は **勝ち** (N-position, 先手必勝)

### 具体例: Subtraction Game

取れる石の数が $\{1, 2, 3\}$ のゲーム:

| $n$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|-----|---|---|---|---|---|---|---|---|---|
| $G(n)$ | 0 | 1 | 2 | 3 | 0 | 1 | 2 | 3 | 0 |

周期4のパターンが現れる。$G(n) = n \bmod 4$ である。

## Sprague-Grundy定理

### 定理

独立な不偏ゲーム $G_1, G_2, \ldots, G_k$ の直和 (各手番でいずれか1つのゲームを選んで手を打つ) のGrundy数は、各ゲームのGrundy数の XOR で与えられる。

$$
G(G_1 + G_2 + \cdots + G_k) = G(G_1) \oplus G(G_2) \oplus \cdots \oplus G(G_k)
$$

### 証明のスケッチ

Grundy数がNimの山の大きさと等価であることを示す。任意の不偏ゲームは適切な大きさのNimの山と「同値」(等しいGrundy数を持つ) であり、複数のNimの山のXORがNim和に等しいことから定理が従う。

## 計算方法

### 再帰的計算

```python title="grundy.py"
def grundy(state, moves, memo={}):
    if state in memo:
        return memo[state]
    reachable = set()
    for m in moves:
        if state - m >= 0:
            reachable.add(grundy(state - m, moves, memo))
    g = mex(reachable)
    memo[state] = g
    return g

def mex(s):
    i = 0
    while i in s:
        i += 1
    return i
```

### ボトムアップ計算

```python title="grundy_dp.py"
def grundy_table(max_n, moves):
    g = [0] * (max_n + 1)
    for n in range(1, max_n + 1):
        reachable = set()
        for m in moves:
            if n - m >= 0:
                reachable.add(g[n - m])
        g[n] = mex(reachable)
    return g
```

## 応用例

### 複合ゲームの解析

3つの山にそれぞれ $a, b, c$ 個の石があり、各山から $\{1, 2, 3\}$ 個取れるゲーム:

$$
\text{先手必勝} \iff G(a) \oplus G(b) \oplus G(c) \neq 0
$$

$G(n) = n \bmod 4$ なので:

$$
\text{先手必勝} \iff (a \bmod 4) \oplus (b \bmod 4) \oplus (c \bmod 4) \neq 0
$$

## まとめ

| 項目 | 内容 |
|------|------|
| 適用対象 | 不偏ゲーム |
| Grundy数 | $G(s) = \text{mex}(\{G(s') \mid s \to s'\})$ |
| 勝敗判定 | $G(s) = 0$ なら負け、$G(s) > 0$ なら勝ち |
| 複合ゲーム | 各ゲームのGrundy数のXOR |
| 計算量 | 状態数 $\times$ 遷移数 |
