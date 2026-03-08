---
title: "高速べき乗 (繰り返し二乗法) 解説"
---

## 高速べき乗とは

高速べき乗 (Fast Exponentiation)、別名繰り返し二乗法 (Binary Exponentiation, Exponentiation by Squaring) は、$a^n$ を $O(\log n)$ 回の乗算で計算するアルゴリズムである。

特にモジュラ演算 $a^n \bmod m$ の計算に広く用いられる。

## 基本アイデア

素朴に $a$ を $n$ 回掛けると $O(n)$ 回の乗算が必要である。繰り返し二乗法は指数 $n$ の二進展開を利用してこれを $O(\log n)$ に削減する。

$$
a^n = a^{b_0 \cdot 2^0 + b_1 \cdot 2^1 + \cdots + b_k \cdot 2^k} = \prod_{i: b_i = 1} a^{2^i}
$$

ここで $n = b_0 + b_1 \cdot 2 + \cdots + b_k \cdot 2^k$ は $n$ の二進展開である。

$a^{2^i}$ は $a^{2^{i-1}}$ を二乗すれば得られるので、逐次計算できる。

### 具体例

$3^{13} \bmod 1000$ を計算する。$13 = (1101)_2 = 1 + 4 + 8$。

| ステップ | ビット | base | result |
|----------|--------|------|--------|
| 初期 | - | 3 | 1 |
| $i=0$ | 1 | 3 | $1 \times 3 = 3$ |
| 二乗 | - | $3^2 = 9$ | 3 |
| $i=1$ | 0 | 9 | 3 (変化なし) |
| 二乗 | - | $9^2 = 81$ | 3 |
| $i=2$ | 1 | 81 | $3 \times 81 = 243$ |
| 二乗 | - | $81^2 = 6561$ | 243 |
| $i=3$ | 1 | 6561 | $243 \times 6561 = 594323$ |

$3^{13} = 1594323$、$3^{13} \bmod 1000 = 323$。

## 実装

### 反復版

```python title="fast_pow.py"
def power(base: int, exp: int, mod: int) -> int:
    result = 1
    base %= mod
    while exp > 0:
        if exp & 1:
            result = result * base % mod
        exp >>= 1
        base = base * base % mod
    return result
```

### 再帰版

```python title="fast_pow_recursive.py"
def power(base: int, exp: int, mod: int) -> int:
    if exp == 0:
        return 1
    if exp % 2 == 1:
        return base * power(base, exp - 1, mod) % mod
    half = power(base, exp // 2, mod)
    return half * half % mod
```

### C++ 実装

```cpp title="fast_pow.cpp"
long long power(long long base, long long exp, long long mod) {
    long long result = 1;
    base %= mod;
    while (exp > 0) {
        if (exp & 1) result = result * base % mod;
        base = base * base % mod;
        exp >>= 1;
    }
    return result;
}
```

## 計算量

### 時間計算量: $O(\log n)$

指数 $n$ の二進表現のビット数は $\lfloor \log_2 n \rfloor + 1$。各ビットに対して高々2回の乗算 (二乗 + 条件付き乗算) を行うので、全体で $O(\log n)$ 回の乗算。

### 空間計算量: $O(1)$ (反復版)

## 正当性の証明

### ループ不変条件

反復版のループ不変条件: ループの各反復の開始時に $\text{result} \cdot \text{base}^{\text{exp}} \equiv a^n \pmod{m}$

**初期:** $\text{result} = 1$, $\text{base} = a$, $\text{exp} = n$ なので $1 \cdot a^n = a^n$。✓

**保存:** exp が奇数のとき result に base を掛けて exp を 1 減らす。exp を半分にして base を二乗する。いずれの場合も $\text{result} \cdot \text{base}^{\text{exp}}$ の値は保存される。

**終了:** $\text{exp} = 0$ のとき $\text{result} \cdot \text{base}^0 = \text{result} = a^n$。 $\square$

## 応用

### モジュラ逆元

フェルマーの小定理より、素数 $p$ に対して $a^{-1} \equiv a^{p-2} \pmod{p}$。これを繰り返し二乗法で $O(\log p)$ で計算できる。

### 行列べき乗

同じ手法を行列に適用して $A^n$ を $O(k^3 \log n)$ で計算できる ($k$ は行列サイズ)。フィボナッチ数列の第 $n$ 項を $O(\log n)$ で求めることなどに応用される。

### モンゴメリ乗算

大きな数の modular exponentiation には、Montgomery multiplication を組み合わせることで定数倍の高速化が得られる。

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 底 $a$、指数 $n$、法 $m$ |
| 出力 | $a^n \bmod m$ |
| 時間計算量 | $O(\log n)$ |
| 空間計算量 | $O(1)$ |
| 核心 | 指数の二進展開による分解 |
| 応用 | モジュラ逆元、行列べき乗、暗号 |
