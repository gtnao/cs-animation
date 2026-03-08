---
title: "線形篩 解説"
---

## 線形篩とは

線形篩 (Linear Sieve) は、$N$ 以下の素数を $O(N)$ で列挙するアルゴリズムである。エラトステネスの篩が $O(N \log \log N)$ であるのに対し、各合成数を**最小素因数で一度だけ**篩い落とすことで線形時間を実現する。

副産物として、各数の最小素因数 (Lowest Prime Factor, LPF) も同時に求まるため、$O(\log N)$ での素因数分解が可能になる。

## アルゴリズム

### 核心アイデア

エラトステネスの篩では、合成数 $n = p_1 \cdot p_2 \cdots p_k$ が複数の素因数 $p_1, p_2, \ldots$ によって重複してマークされる。線形篩は**最小素因数のみ**でマークすることで重複を排除する。

### 手順

各 $i = 2, 3, \ldots, N$ について:

1. $\text{lpf}[i] = 0$ なら $i$ は素数。$\text{lpf}[i] = i$ とし、素数リストに追加
2. 素数リストの各素数 $p$ について:
   - $p > \text{lpf}[i]$ または $i \cdot p > N$ なら打ち切り
   - $\text{lpf}[i \cdot p] = p$ とマーク

### なぜ $p > \text{lpf}[i]$ で打ち切るか

$p > \text{lpf}[i]$ の場合、$i \cdot p$ の最小素因数は $\text{lpf}[i]$ であって $p$ ではない。もし $p$ でマークすると、$\text{lpf}[i]$ でも後でマークされ、重複が発生する。打ち切り条件 $p \leq \text{lpf}[i]$ により、各合成数は最小素因数で一度だけマークされる。

### 具体例

$N = 12$ の場合:

| $i$ | 素数? | 素数リスト | マーク |
|-----|-------|------------|--------|
| 2 | Yes | [2] | $2 \times 2 = 4$ |
| 3 | Yes | [2, 3] | $3 \times 2 = 6$, $3 \times 3 = 9$ |
| 4 | No (lpf=2) | [2, 3] | $4 \times 2 = 8$ |
| 5 | Yes | [2, 3, 5] | $5 \times 2 = 10$ |
| 6 | No (lpf=2) | [2, 3, 5] | $6 \times 2 = 12$ |
| 7 | Yes | [2, 3, 5, 7] | (7×2=14 > 12) |

## 正当性の証明

### 定理: 各合成数 $n \leq N$ は最小素因数で一度だけマークされる

**証明:**

合成数 $n$ の最小素因数を $p$ とし、$n = p \cdot m$ とする。$p \leq \text{lpf}[m]$ ($p$ は $n$ の最小素因数なので $m$ のどの素因数よりも小さいか等しい)。

$i = m$ を処理するとき、素数リストには $p$ が含まれている ($p \leq m$ なので $p$ は既に発見済み)。また $p \leq \text{lpf}[m]$ なので打ち切り条件に引っかからない。よって $n = m \cdot p$ はマークされる。

一意性: $n$ が $i' \cdot p'$ としてもマークされたとする。$p'$ は素数で $p' \leq \text{lpf}[i']$。$n = i' \cdot p'$ の最小素因数は $p' \leq \text{lpf}[i']$ より $p'$ 自身。よって $p' = p$, $i' = m$。 $\square$

## 計算量

### 時間計算量: $O(N)$

各合成数は一度だけマークされるので、マーク操作の総数は合成数の個数 $O(N)$。外側ループも $O(N)$。全体で $O(N)$。

### 空間計算量: $O(N)$

## 実装

```python title="linear_sieve.py"
def linear_sieve(n: int) -> tuple[list[int], list[int]]:
    """Returns (primes, lpf) where lpf[i] is the lowest prime factor of i."""
    lpf = [0] * (n + 1)
    primes = []
    for i in range(2, n + 1):
        if lpf[i] == 0:
            lpf[i] = i
            primes.append(i)
        for p in primes:
            if p > lpf[i] or i * p > n:
                break
            lpf[i * p] = p
    return primes, lpf
```

```cpp title="linear_sieve.cpp"
vector<int> primes;
int lpf[MAXN + 1];

void linear_sieve(int n) {
    memset(lpf, 0, sizeof(lpf));
    for (int i = 2; i <= n; i++) {
        if (lpf[i] == 0) {
            lpf[i] = i;
            primes.push_back(i);
        }
        for (int p : primes) {
            if (p > lpf[i] || (long long)i * p > n) break;
            lpf[i * p] = p;
        }
    }
}
```

## 応用: 高速素因数分解

LPF テーブルを用いると、任意の $n \leq N$ を $O(\log n)$ で素因数分解できる。

```python title="factorize.py"
def factorize(n: int, lpf: list[int]) -> list[int]:
    factors = []
    while n > 1:
        factors.append(lpf[n])
        n //= lpf[n]
    return factors
```

## エラトステネスの篩との比較

| 項目 | エラトステネスの篩 | 線形篩 |
|------|-------------------|--------|
| 時間計算量 | $O(N \log \log N)$ | $O(N)$ |
| 定数倍 | 小さい | やや大きい |
| 副産物 | is_prime 配列 | LPF テーブル |
| 実用性 | 多くの場合で十分高速 | LPF が必要な場合に有利 |

実用上は $N \leq 10^8$ 程度ではエラトステネスの篩のほうがキャッシュ効率で有利なこともある。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 正整数 $N$ |
| 出力 | $N$ 以下の全素数 + LPF テーブル |
| 時間計算量 | $O(N)$ |
| 空間計算量 | $O(N)$ |
| 核心 | 各合成数を最小素因数で一度だけマーク |
| 応用 | 高速素因数分解、乗法的関数の計算 |
