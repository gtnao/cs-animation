---
title: "Stern-Brocot Tree 解説"
---

## Stern-Brocot Tree とは

Stern-Brocot Tree は、全ての正の有理数を**既約分数**として過不足なく整列する無限二分木である。Moritz Stern (1858) と Achille Brocot (1861) が独立に発見した。

## 構成法

### メディアント (mediant)

2つの分数 $\frac{a}{b}$ と $\frac{c}{d}$ の**メディアント** (mediant) を次のように定義する:

$$
\frac{a}{b} \oplus \frac{c}{d} = \frac{a + c}{b + d}
$$

### 木の構築

初期状態として $\frac{0}{1}$ (左境界) と $\frac{1}{0}$ (右境界、$\infty$ を表す) を置く。

1. メディアント $\frac{0+1}{1+0} = \frac{1}{1}$ が根
2. 左部分木: $\frac{0}{1}$ と $\frac{1}{1}$ の間の分数
3. 右部分木: $\frac{1}{1}$ と $\frac{1}{0}$ の間の分数
4. 再帰的にメディアントを取って構築

最初の数レベル:

```
                    1/1
                   /   \
                 /       \
              1/2         2/1
             /   \       /   \
           1/3   2/3   3/2   3/1
          / \   / \   / \   / \
        1/4 2/5 3/5 3/4 4/3 5/3 5/2 4/1
```

## 基本性質

### 性質1: 全ての正の有理数が出現する

**定理:** 全ての正の有理数 $\frac{p}{q}$ ($\gcd(p, q) = 1$) は Stern-Brocot Tree に exactly once 出現する。

### 性質2: 既約性

**定理:** Stern-Brocot Tree に出現する全ての分数は既約である。

**証明:** メディアント $\frac{a+c}{b+d}$ が既約でないと仮定する。ある素数 $p$ が $a+c$ と $b+d$ を割り切る。しかし行列式の性質 $|ad - bc| = 1$ (後述) から矛盾が導かれる。 $\square$

### 性質3: 行列式の性質

Stern-Brocot Tree の隣接する2つの分数 $\frac{a}{b}$ と $\frac{c}{d}$ (左が小さい) について:

$$
bc - ad = 1
$$

これは全てのレベルで帰納法により成り立つ。

### 性質4: 順序の保存

木を中順走査 (in-order traversal) すると、分数は昇順に並ぶ。

## 探索アルゴリズム

有理数 $\frac{p}{q}$ の Stern-Brocot Tree 上での位置を二分探索で求められる。

### 手順

1. 左境界 $\frac{l_p}{l_q} = \frac{0}{1}$, 右境界 $\frac{r_p}{r_q} = \frac{1}{0}$ で初期化
2. メディアント $m = \frac{l_p + r_p}{l_q + r_q}$ を計算
3. $\frac{p}{q} = m$ なら終了
4. $\frac{p}{q} < m$ なら右境界を $m$ に更新 (左の子へ)
5. $\frac{p}{q} > m$ なら左境界を $m$ に更新 (右の子へ)
6. 2 に戻る

### 具体例

$\frac{5}{8}$ を探索する:

| ステップ | 左 | mediant | 右 | 比較 | 方向 |
|----------|------|---------|------|------|------|
| 1 | 0/1 | 1/1 | 1/0 | 5/8 < 1/1 | L |
| 2 | 0/1 | 1/2 | 1/1 | 5/8 > 1/2 | R |
| 3 | 1/2 | 2/3 | 1/1 | 5/8 < 2/3 | L |
| 4 | 1/2 | 3/5 | 2/3 | 5/8 > 3/5 | R |
| 5 | 3/5 | 5/8 | 2/3 | 5/8 = 5/8 | found |

パス: LRLR

## 実装

```python title="stern_brocot.py"
def find_path(p: int, q: int) -> str:
    """Find the path to p/q in the Stern-Brocot tree."""
    lp, lq = 0, 1
    rp, rq = 1, 0
    path = []
    while True:
        mp = lp + rp
        mq = lq + rq
        if p * mq == mp * q:
            break
        elif p * mq < mp * q:
            path.append('L')
            rp, rq = mp, mq
        else:
            path.append('R')
            lp, lq = mp, mq
    return ''.join(path)
```

```cpp title="stern_brocot.cpp"
string find_path(long long p, long long q) {
    long long lp = 0, lq = 1, rp = 1, rq = 0;
    string path;
    while (true) {
        long long mp = lp + rp, mq = lq + rq;
        if (p * mq == mp * q) break;
        else if (p * mq < mp * q) {
            path += 'L';
            rp = mp; rq = mq;
        } else {
            path += 'R';
            lp = mp; lq = mq;
        }
    }
    return path;
}
```

## 連分数との関係

Stern-Brocot Tree のパスは連分数展開と密接に関連する。$\frac{p}{q} = [a_0; a_1, a_2, \ldots]$ のとき、パスは $R^{a_0} L^{a_1} R^{a_2} \ldots$ の形になる (ただし $\frac{p}{q} > 1$ の場合。$< 1$ なら $L$ から始まる)。

## 最良有理近似

### 定理

分母が $q$ 以下の有理数のうち、ある実数 $\alpha$ に最も近いものは Stern-Brocot Tree の探索で見つかる。

これは最良有理近似 (best rational approximation) と呼ばれ、連分数の収束分数と一致する。

## 応用

- **連分数展開**: Stern-Brocot Tree の探索は連分数展開の計算と等価
- **最良有理近似**: 与えられた実数を分母の上限付きで有理数近似する
- **Farey 数列**: Stern-Brocot Tree の各レベルは Farey 数列と関連する
- **競技プログラミング**: 分数の二分探索問題で活用

## まとめ

| 項目 | 内容 |
|------|------|
| 構造 | 全正有理数を含む無限二分木 |
| 構成 | メディアント $\frac{a+c}{b+d}$ |
| 性質 | 既約、順序保存、$bc - ad = 1$ |
| 探索 | 二分探索で $O(\log)$ (パスの長さ) |
| 応用 | 連分数、最良有理近似、Farey 数列 |
