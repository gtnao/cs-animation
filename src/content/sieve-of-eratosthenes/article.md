---
title: "エラトステネスの篩 解説"
---

## エラトステネスの篩とは

エラトステネスの篩 (Sieve of Eratosthenes) は、$N$ 以下の全ての素数を列挙する古典的なアルゴリズムである。紀元前3世紀のギリシャの数学者エラトステネスに由来する。

## アルゴリズム

### 手順

1. $2$ から $N$ までの整数のリストを作る
2. リスト中の最小の未処理の数 $p$ を選ぶ (最初は $p = 2$)
3. $p$ は素数。$p^2, p^2 + p, p^2 + 2p, \ldots$ を合成数としてマークする
4. $p^2 > N$ になるまで 2-3 を繰り返す
5. マークされていない数が全て素数

### なぜ $p^2$ から始めるか

$p$ の倍数のうち $p^2$ より小さいものは $2p, 3p, \ldots, (p-1)p$ である。これらはそれぞれ $2, 3, \ldots, p-1$ の倍数でもあり、$p$ より小さい素数の処理時に既にマーク済みである。

### 具体例

$N = 30$ の場合:

1. $p = 2$: $4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30$ をマーク
2. $p = 3$: $9, 15, 21, 27$ をマーク (6, 12, 18, 24, 30 は既にマーク済み)
3. $p = 5$: $25$ をマーク
4. $p = 7$: $7^2 = 49 > 30$ なので終了

素数: $2, 3, 5, 7, 11, 13, 17, 19, 23, 29$

## 正当性の証明

### 定理: 篩の終了時にマークされていない $\geq 2$ の整数は全て素数

**証明:** 背理法。マークされていない合成数 $n$ が存在すると仮定する。$n$ の最小の素因数を $p$ とすると $p \leq \sqrt{n} \leq \sqrt{N}$。

アルゴリズムは $p \leq \sqrt{N}$ を満たす全ての素数 $p$ について倍数をマークする。$n$ は $p$ の倍数なので $n = pk$ ($k \geq p$) と書ける。$n = pk \geq p^2$ なのでマーク対象に含まれる。矛盾。 $\square$

## 計算量

### 時間計算量: $O(N \log \log N)$

**証明:** 素数 $p$ に対してマーク操作は $\lfloor N/p \rfloor - p + 1$ 回行われる。全素数の合計は:

$$
\sum_{p \leq N,\, p \text{ prime}} \frac{N}{p} = N \sum_{p \leq N,\, p \text{ prime}} \frac{1}{p}
$$

Mertens の定理より:

$$
\sum_{p \leq N,\, p \text{ prime}} \frac{1}{p} = \ln \ln N + M + O\left(\frac{1}{\ln N}\right)
$$

ここで $M \approx 0.2615$ は Meissel-Mertens 定数。したがって全体の計算量は $O(N \log \log N)$。

### 空間計算量: $O(N)$

## 実装

```python title="sieve.py"
def sieve(n: int) -> list[int]:
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False
    for i in range(2, int(n**0.5) + 1):
        if is_prime[i]:
            for j in range(i * i, n + 1, i):
                is_prime[j] = False
    return [i for i in range(2, n + 1) if is_prime[i]]
```

```cpp title="sieve.cpp"
vector<int> sieve(int n) {
    vector<bool> is_prime(n + 1, true);
    is_prime[0] = is_prime[1] = false;
    for (int i = 2; i * i <= n; i++) {
        if (is_prime[i]) {
            for (int j = i * i; j <= n; j += i) {
                is_prime[j] = false;
            }
        }
    }
    vector<int> primes;
    for (int i = 2; i <= n; i++) {
        if (is_prime[i]) primes.push_back(i);
    }
    return primes;
}
```

## 最適化

### 偶数の除外

$2$ を特別扱いして奇数のみを篩にかけることで、メモリと時間を約半分にできる。

### 区間篩 (Segmented Sieve)

$[L, R]$ の範囲の素数を求める場合、$\sqrt{R}$ 以下の素数を通常の篩で求め、それらを用いて区間 $[L, R]$ を篩にかける。メモリ使用量を $O(\sqrt{N})$ に抑えられる。

### ビット演算による高速化

`bitset` を用いると定数倍の高速化が得られ、キャッシュ効率も改善される。

## 素数計数関数

$\pi(N)$ ($N$ 以下の素数の個数) に関して、素数定理より:

$$
\pi(N) \sim \frac{N}{\ln N}
$$

すなわち、$N$ 以下の素数はおよそ $N / \ln N$ 個存在する。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 正整数 $N$ |
| 出力 | $N$ 以下の全素数 |
| 時間計算量 | $O(N \log \log N)$ |
| 空間計算量 | $O(N)$ |
| 核心 | 各素数の倍数を消去 |
| 応用 | 素因数分解の前処理、素数判定テーブル |
