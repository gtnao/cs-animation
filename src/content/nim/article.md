---
title: "Nim 解説"
---

## Nimとは

Nim は最も古典的な組合せゲームの一つである。複数の山に石が積まれており、2人のプレイヤーが交互に任意の山から1個以上の石を取り除く。最後の石を取ったプレイヤーが勝ちとなる。

### ゲームのルール

- $k$ 個の山があり、山 $i$ には $n_i$ 個の石がある
- 各手番で、1つの山を選び、1個以上 (全てでも可) の石を取る
- 石を取れなくなったプレイヤーの負け

## Nim和 (Nim-sum)

### 定義

Nim和は各山の石数のビット単位 XOR である。

$$
\text{Nim和} = n_1 \oplus n_2 \oplus \cdots \oplus n_k
$$

### Bouton の定理

**定理 (Bouton, 1901):** Nim の局面 $(n_1, n_2, \ldots, n_k)$ が先手必勝であるための必要十分条件は、Nim和が $0$ でないことである。

$$
\text{先手必勝} \iff n_1 \oplus n_2 \oplus \cdots \oplus n_k \neq 0
$$

### 証明

以下の3つの事実を示せばよい。

1. **終局状態はNim和が0:** $(0, 0, \ldots, 0)$ のNim和は $0$ (後手必勝 = 手番プレイヤーの負け)

2. **Nim和が0でない局面からはNim和を0にできる:** $s = n_1 \oplus \cdots \oplus n_k \neq 0$ とする。$s$ の最上位ビットを含む山 $n_i$ が存在する。$n_i' = n_i \oplus s$ とすると $n_i' < n_i$ であり、山 $i$ から $n_i - n_i'$ 個取ることでNim和を0にできる。

3. **Nim和が0の局面からはどう動いてもNim和が0でなくなる:** 山 $i$ から石を取って $n_i' < n_i$ とすると、新しいNim和は $0 \oplus n_i \oplus n_i' = n_i \oplus n_i' \neq 0$ (異なる正整数のXORは0にならない)。

## 具体例

### 例1: $(3, 5, 7)$

$$
3 \oplus 5 \oplus 7 = 011_2 \oplus 101_2 \oplus 111_2 = 001_2 = 1 \neq 0
$$

先手必勝。Nim和を0にするには、例えば山3 (7個) から $7 - (7 \oplus 1) = 7 - 6 = 1$ 個取り、$(3, 5, 6)$ にすればよい。

$$
3 \oplus 5 \oplus 6 = 011_2 \oplus 101_2 \oplus 110_2 = 000_2 = 0
$$

### 例2: $(1, 1)$

$$
1 \oplus 1 = 0
$$

後手必勝。先手がどちらの山から取っても、後手が同じ数だけ反対の山から取ればよい。

## 実装

```python title="nim.py"
def nim_analysis(piles: list[int]) -> tuple[bool, int | None]:
    """Nimの勝敗判定と必勝手を返す"""
    nim_sum = 0
    for p in piles:
        nim_sum ^= p

    if nim_sum == 0:
        return False, None  # Losing position

    # Find winning move
    for i, p in enumerate(piles):
        new_val = p ^ nim_sum
        if new_val < p:
            return True, (i, p - new_val)  # Take (p - new_val) from pile i

    return True, None
```

## 変種

### Misere Nim

最後の石を取ったプレイヤーが **負け** となる変種。

必勝戦略は通常のNimとほぼ同じだが、全ての山が1以下の場合のみ異なる:

- 全山が1以下で山の数が奇数 → 後手必勝 (通常Nimと逆)
- それ以外 → 通常Nimと同じNim和判定

### Wythoff's Game

2つの山から「両方の山から同数取る」という追加の手が許されるNimの変種。黄金比 $\phi = \frac{1+\sqrt{5}}{2}$ を用いた解析が知られている。

## まとめ

| 項目 | 内容 |
|------|------|
| ゲーム | $k$ 個の山から石を取る |
| 勝敗判定 | Nim和 ($\oplus$) が0なら後手必勝 |
| 必勝手 | Nim和を0にする手 |
| 計算量 | $O(k)$ ($k$: 山の数) |
| 核心 | XOR によるNim和 |
