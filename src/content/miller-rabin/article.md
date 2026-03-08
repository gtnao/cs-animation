---
title: "Miller-Rabin 素数判定 解説"
---

## Miller-Rabin 素数判定とは

Miller-Rabin 素数判定 (Miller-Rabin primality test) は、与えられた整数が素数かどうかを高速に判定する確率的アルゴリズムである。Gary Miller (1976) の決定的アルゴリズムを Michael Rabin (1980) が確率的に改良した。

## 前提知識

### フェルマーの小定理

$p$ が素数で $\gcd(a, p) = 1$ のとき:

$$
a^{p-1} \equiv 1 \pmod{p}
$$

### フェルマーの小定理の限界

$a^{n-1} \equiv 1 \pmod{n}$ が全ての $a$ ($\gcd(a,n)=1$) に対して成り立つにもかかわらず合成数である数がある。これを**カーマイケル数** (Carmichael number) と呼ぶ。最小のカーマイケル数は $561 = 3 \times 11 \times 17$。

## アルゴリズム

### 核心アイデア

奇数 $n > 2$ に対して $n - 1 = 2^r \cdot d$ ($d$ は奇数) と分解する。$n$ が素数なら、任意の $a$ ($1 < a < n$) に対して次のいずれかが成り立つ:

1. $a^d \equiv 1 \pmod{n}$
2. ある $i$ ($0 \leq i < r$) が存在して $a^{2^i d} \equiv -1 \pmod{n}$

**なぜか:** $a^{n-1} = a^{2^r d} \equiv 1 \pmod{n}$。$1$ の平方根は $\pm 1$ のみ (素数の場合)。$a^{2^r d} \equiv 1$ から逆に辿ると、$a^{2^{r-1} d} \equiv \pm 1$。$+1$ ならさらに遡り、$-1$ なら停止。最終的に $a^d$ まで遡って $\pm 1$ でなければ合成数。

### 手順

1. $n - 1 = 2^r \cdot d$ と分解
2. ランダムに $a$ を選ぶ ($2 \leq a \leq n - 2$)
3. $x = a^d \bmod n$ を計算
4. $x = 1$ または $x = n - 1$ なら「おそらく素数」
5. $r - 1$ 回まで $x = x^2 \bmod n$ を繰り返す:
   - $x = n - 1$ なら「おそらく素数」
   - $x = 1$ なら「合成数」
6. 全てのラウンドで $n - 1$ に到達しなければ「合成数」

### 確率的保証

1回のテストで合成数を素数と誤判定する確率は高々 $1/4$。$k$ 回のテストで誤判定確率は高々 $(1/4)^k$。

## 決定的判定

特定の証人 (witness) の組合せを使うと、一定範囲内で決定的に判定できる。

| 範囲 | 証人 |
|------|------|
| $< 2{,}047$ | $\{2\}$ |
| $< 1{,}373{,}653$ | $\{2, 3\}$ |
| $< 3{,}215{,}031{,}751$ | $\{2, 3, 5, 7\}$ |
| $< 3.3 \times 10^{24}$ | $\{2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37\}$ |

競技プログラミングでは $n < 2^{64}$ の場合、$\{2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37\}$ の 12 個の証人で確定的に判定できる。

## 実装

```python title="miller_rabin.py"
def is_prime(n: int) -> bool:
    if n < 2:
        return False
    if n < 4:
        return True
    if n % 2 == 0:
        return False
    # n - 1 = 2^r * d
    d, r = n - 1, 0
    while d % 2 == 0:
        d //= 2
        r += 1
    # Deterministic witnesses
    for a in [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]:
        if a >= n:
            continue
        x = pow(a, d, n)
        if x == 1 or x == n - 1:
            continue
        for _ in range(r - 1):
            x = pow(x, 2, n)
            if x == n - 1:
                break
        else:
            return False
    return True
```

```cpp title="miller_rabin.cpp"
bool is_prime(long long n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 == 0) return false;
    long long d = n - 1;
    int r = 0;
    while (d % 2 == 0) { d /= 2; r++; }
    for (long long a : {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37}) {
        if (a >= n) continue;
        long long x = power(a, d, n); // modular exponentiation
        if (x == 1 || x == n - 1) continue;
        bool found = false;
        for (int i = 0; i < r - 1; i++) {
            x = (__int128)x * x % n;
            if (x == n - 1) { found = true; break; }
        }
        if (!found) return false;
    }
    return true;
}
```

## 計算量

1回のテストは $O(\log^2 n)$ (繰り返し二乗法が $O(\log n)$ で、$r$ 回の二乗が $O(\log n)$)。$k$ 回のテストで $O(k \log^2 n)$。

## カーマイケル数の検出

$561 = 3 \times 11 \times 17$ を例にとる。

$561 - 1 = 560 = 2^4 \times 35$。証人 $a = 2$:

- $2^{35} \bmod 561 = 263$
- $263^2 \bmod 561 = 166$
- $166^2 \bmod 561 = 67$
- $67^2 \bmod 561 = 1$

$1$ に到達したが $-1$ ($= 560$) を経由していない。よって合成数と判定。フェルマーテストでは $2^{560} \equiv 1 \pmod{561}$ なので見抜けない。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 整数 $n$ |
| 出力 | 素数 / 合成数 |
| 時間計算量 | $O(k \log^2 n)$ |
| 誤判定確率 | 高々 $(1/4)^k$ |
| 決定的判定 | 特定の証人の組合せで可能 |
| 応用 | 大きな素数の生成、Pollard's rho 法の前処理 |
