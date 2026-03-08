---
title: "Minimax / Alpha-Beta剪定 解説"
---

## Minimaxアルゴリズムとは

Minimax は二人零和ゲーム (チェス、オセロ等) でゲーム木を探索し、最適な手を見つけるアルゴリズムである。

### 基本的な考え方

- **MAXプレイヤー**: 評価値を最大化しようとする (自分の手番)
- **MINプレイヤー**: 評価値を最小化しようとする (相手の手番)

ゲーム木の葉ノードに評価値が与えられたとき、各内部ノードの値を以下で計算する。

$$
V(s) = \begin{cases}
\max_{s' \in \text{children}(s)} V(s') & \text{if } s \text{ はMAXノード} \\
\min_{s' \in \text{children}(s)} V(s') & \text{if } s \text{ はMINノード}
\end{cases}
$$

### 実装

```python title="minimax.py"
def minimax(node, depth, is_maximizing):
    if depth == 0 or node.is_terminal():
        return node.evaluate()

    if is_maximizing:
        value = -float('inf')
        for child in node.children():
            value = max(value, minimax(child, depth - 1, False))
        return value
    else:
        value = float('inf')
        for child in node.children():
            value = min(value, minimax(child, depth - 1, True))
        return value
```

## Alpha-Beta剪定

### 問題点

Minimaxの計算量は $O(b^d)$ ($b$: 分岐数、$d$: 深さ) であり、深いゲーム木では実用的でない。

### Alpha-Beta剪定の核心

探索中にそのノードの値が既に親ノードの判断に影響しないことが判明した場合、そのノード以下の探索を省略 (剪定) できる。

- **Alpha ($\alpha$)**: MAXノードで保証される最低値
- **Beta ($\beta$)**: MINノードで保証される最高値

$\alpha \geq \beta$ となったとき、**枝刈り (pruning)** が発生する。

### アルゴリズム

```python title="alpha_beta.py"
def alpha_beta(node, depth, alpha, beta, is_maximizing):
    if depth == 0 or node.is_terminal():
        return node.evaluate()

    if is_maximizing:
        value = -float('inf')
        for child in node.children():
            value = max(value, alpha_beta(child, depth - 1, alpha, beta, False))
            alpha = max(alpha, value)
            if alpha >= beta:
                break  # Beta cutoff
        return value
    else:
        value = float('inf')
        for child in node.children():
            value = min(value, alpha_beta(child, depth - 1, alpha, beta, True))
            beta = min(beta, value)
            if alpha >= beta:
                break  # Alpha cutoff
        return value

# Initial call
best_value = alpha_beta(root, max_depth, -float('inf'), float('inf'), True)
```

## 計算量

### Minimax

ゲーム木の分岐数を $b$、深さを $d$ とする。

$$
T_{\text{minimax}} = O(b^d)
$$

### Alpha-Beta剪定

最良の場合 (手が最適な順序で並んでいる場合):

$$
T_{\text{alpha-beta (best)}} = O(b^{d/2})
$$

これは Minimax の平方根に相当する。最悪の場合は Minimax と同じ $O(b^d)$ だが、平均的には大きな改善がある。

### Move Ordering の重要性

Alpha-Beta剪定の効率は手の探索順序に強く依存する。良い手を先に探索するほど枝刈りの効果が大きくなる。

## 発展的な最適化

### Negamax

MAXとMINを分けず、評価値の符号を反転することで統一的に記述する方法。

### 反復深化 (Iterative Deepening)

深さ制限を段階的に増やしながら探索する。前の反復で得られた最善手を使って Move Ordering を改善できる。

### トランスポジションテーブル

同じ局面が異なる手順で到達される場合、ハッシュテーブルで結果を記憶して再計算を避ける。

## まとめ

| 項目 | 内容 |
|------|------|
| 適用対象 | 二人零和完全情報ゲーム |
| Minimax | $O(b^d)$ |
| Alpha-Beta (最良) | $O(b^{d/2})$ |
| Alpha-Beta (最悪) | $O(b^d)$ |
| 核心 | $\alpha \geq \beta$ での枝刈り |
