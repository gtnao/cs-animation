---
title: "Pollard's rho 法 解説"
---

## Pollard's rho 法とは

Pollard's rho 法は、John Pollard が1975年に発表した素因数分解のための確率的アルゴリズムである。$n$ の最小の素因数を $p$ とすると、期待計算量 $O(\sqrt{p})$ で因数を見つけることができる。

## 基本アイデア

### Birthday Paradox

$n$ 個の要素からランダムに値を選ぶとき、$O(\sqrt{n})$ 回の試行で衝突 (同じ値が2回出現) が期待される。これは誕生日のパラドックスとして知られている。

### rho 法への応用

$n$ の因数 $p$ は未知だが、疑似乱数列 $x_0, x_1, x_2, \ldots$ を生成し、$\gcd(|x_i - x_j|, n) > 1$ となる $(i, j)$ を見つければ因数が得られる。

$x_{i+1} = f(x_i) = (x_i^2 + c) \bmod n$ という疑似乱数列を使う。$p$ を法として見ると、$x_i \bmod p$ は高々 $p$ 個の値しか取らないので、Birthday Paradox により $O(\sqrt{p})$ ステップで $x_i \equiv x_j \pmod{p}$ (つまり $p \mid (x_i - x_j)$) が期待される。

### Floyd の循環検出

全てのペア $(i, j)$ を試す代わりに、Floyd の亀と兎のアルゴリズムを使う。亀は $x \leftarrow f(x)$、兎は $y \leftarrow f(f(y))$ と進め、各ステップで $\gcd(|x - y|, n)$ をチェックする。

名前の「rho ($\rho$)」は、列 $x_0, x_1, x_2, \ldots$ の軌跡がギリシャ文字の $\rho$ の形をしている (尾部 + 循環部) ことに由来する。

## アルゴリズム

### 手順

1. $x = y = x_0$ (初期値、通常 $x_0 = 2$), $c$ を適当に選ぶ
2. $x \leftarrow f(x)$, $y \leftarrow f(f(y))$
3. $d = \gcd(|x - y|, n)$ を計算
4. $d = 1$ なら 2 に戻る
5. $d = n$ なら失敗 (別の $c$ で再試行)
6. $d$ は $n$ の非自明な因数

### 具体例

$n = 8051$, $f(x) = (x^2 + 1) \bmod 8051$

| 反復 | $x$ | $y$ | $\gcd(\|x-y\|, 8051)$ |
|------|-----|-----|------------------------|
| 1 | 5 | 26 | 1 |
| 2 | 26 | 7474 | 1 |
| 3 | 677 | 871 | 1 |
| ... | ... | ... | ... |

(実際の数値は初期値と $c$ に依存)

## 計算量

### 期待時間計算量: $O(n^{1/4})$

$n$ の最小素因数を $p$ とすると、$p \leq \sqrt{n}$ なので期待反復回数は $O(\sqrt{p}) = O(n^{1/4})$。各反復は GCD 計算 ($O(\log n)$) を含むので全体で $O(n^{1/4} \log n)$。

### Brent の改良

Richard Brent による改良版は Floyd のサイクル検出の代わりに異なる方法を使い、定数倍の高速化を実現する。また GCD の計算回数を減らすため、複数ステップの積をまとめて GCD を取る手法もある。

## 実装

```python title="pollard_rho.py"
import math
import random

def pollard_rho(n: int) -> int:
    """Find a non-trivial factor of n."""
    if n % 2 == 0:
        return 2
    x = random.randint(2, n - 1)
    y = x
    c = random.randint(1, n - 1)
    d = 1
    while d == 1:
        x = (x * x + c) % n
        y = (y * y + c) % n
        y = (y * y + c) % n
        d = math.gcd(abs(x - y), n)
    return d if d != n else -1  # -1 means retry needed
```

```cpp title="pollard_rho.cpp"
long long pollard_rho(long long n) {
    if (n % 2 == 0) return 2;
    long long x = rng() % (n - 2) + 2;
    long long y = x;
    long long c = rng() % (n - 1) + 1;
    long long d = 1;
    while (d == 1) {
        x = ((__int128)x * x + c) % n;
        y = ((__int128)y * y + c) % n;
        y = ((__int128)y * y + c) % n;
        d = __gcd(abs(x - y), n);
    }
    return d == n ? -1 : d;
}
```

### 完全な素因数分解

Miller-Rabin 素数判定と組み合わせて完全な素因数分解を行う。

```python title="factorize.py"
def factorize(n: int) -> list[int]:
    if n <= 1:
        return []
    if is_prime(n):
        return [n]
    d = pollard_rho(n)
    while d == -1:
        d = pollard_rho(n)
    return sorted(factorize(d) + factorize(n // d))
```

## 他の素因数分解法との比較

| 手法 | 計算量 | 特徴 |
|------|--------|------|
| 試し割り | $O(\sqrt{n})$ | 確定的、単純 |
| Pollard's rho | $O(n^{1/4})$ | 確率的、中規模の数に有効 |
| 楕円曲線法 (ECM) | $O(\exp(\sqrt{\ln p \ln \ln p}))$ | 小さな因数に有効 |
| 数体篩 (GNFS) | $O(\exp(c \cdot (\ln n)^{1/3} (\ln \ln n)^{2/3}))$ | 大きな数に最適 |

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 合成数 $n$ |
| 出力 | $n$ の非自明な因数 |
| 期待計算量 | $O(n^{1/4} \log n)$ |
| 核心 | Birthday Paradox + Floyd の循環検出 |
| 応用 | 素因数分解、Miller-Rabin との組合せ |
