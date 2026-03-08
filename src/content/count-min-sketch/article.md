---
title: "Count-Min Sketch 解説"
---

## Count-Min Sketch とは

Count-Min Sketch (CMS) は、2003年に Graham Cormode と S. Muthukrishnan によって提案された確率的データ構造である。データストリーム中の各要素の**出現頻度**を、少ないメモリで近似的に管理する。

Bloom Filter が「存在するか否か」を判定するのに対し、Count-Min Sketch は「何回出現したか」を推定する。

### 特徴

- 推定値は**真の値以上** (過大推定はするが、過小推定はしない)
- 空間効率が非常に良い
- ストリーム処理に適している

## 構造

Count-Min Sketch は以下で構成される:

- $d \times w$ の2次元カウンタ配列 $C$
- $d$ 個の独立なハッシュ関数 $h_1, h_2, \ldots, h_d$ (各関数は $\{0, 1, \ldots, w-1\}$ に写像)

全てのカウンタを 0 で初期化する。

パラメータの選び方:
- $w = \lceil e/\varepsilon \rceil$ ($\varepsilon$ は許容誤差)
- $d = \lceil \ln(1/\delta) \rceil$ ($\delta$ は誤差確率)

## 操作

### Update (カウントの更新)

要素 $x$ のカウントを $c$ だけ増やす (通常 $c = 1$):

$$
C[j][h_j(x)] \leftarrow C[j][h_j(x)] + c \quad (j = 1, 2, \ldots, d)
$$

```python title="count_min_sketch.py"
def update(cms, x, c=1):
    for j in range(d):
        idx = hash_j(x, j) % w
        cms[j][idx] += c
```

### Query (頻度の推定)

要素 $x$ の頻度推定値は、全行の対応するカウンタの**最小値**:

$$
\hat{f}(x) = \min_{j=1}^{d} C[j][h_j(x)]
$$

```python title="cms_query.py"
def query(cms, x):
    result = float('inf')
    for j in range(d):
        idx = hash_j(x, j) % w
        result = min(result, cms[j][idx])
    return result
```

名前の由来は **Count** (カウント) の **Min** (最小値) を取る **Sketch** (スケッチ/要約) である。

## 誤差の保証

### 定理

Count-Min Sketch の推定値 $\hat{f}(x)$ は以下を満たす:

$$
f(x) \leq \hat{f}(x) \leq f(x) + \varepsilon \|f\|_1
$$

ここで $f(x)$ は真の頻度、$\|f\|_1$ は全要素の頻度の総和である。この上界は確率 $1 - \delta$ 以上で成り立つ。

### 証明の概略

各行 $j$ について、カウンタ $C[j][h_j(x)]$ には $x$ 自身のカウントに加え、同じカウンタにハッシュされた他の要素のカウントが加算される。

$$
C[j][h_j(x)] = f(x) + \sum_{y \neq x,\ h_j(y) = h_j(x)} f(y)
$$

余分な項の期待値は $\|f\|_1 / w \leq \varepsilon \|f\|_1 / e$ (Markov の不等式より)。

各行は独立なので、全 $d$ 行で上界を超える確率は $(1/e)^d \leq \delta$。

最小値を取ることで、いずれかの行で正確に近い値が得られる確率が高くなる。 $\square$

## Point Query と Range Query

### Point Query

上述の基本的なクエリ。

### Range Query

区間 $[l, r]$ に属する全要素の頻度合計を推定することも可能。各次元で dyadic ranges (2冪区間) を用いることで実現できる。

## 応用

- **ネットワークトラフィック監視:** Heavy Hitter (頻出フロー) の検出
- **自然言語処理:** n-gram の頻度推定
- **データベース:** 近似的な GROUP BY カウント
- **推薦システム:** アイテムの人気度推定
- **異常検知:** 通常の頻度パターンからの逸脱検出

## Bloom Filter との比較

| | Bloom Filter | Count-Min Sketch |
|---|---|---|
| 用途 | 集合のメンバーシップ | 頻度の推定 |
| 回答 | Yes/No | カウント値 |
| 誤差の方向 | 偽陽性 | 過大推定 |
| 空間 | $O(n)$ ビット | $O(1/\varepsilon \cdot \log 1/\delta)$ |

## まとめ

| 項目 | 内容 |
|------|------|
| データ構造 | $d \times w$ カウンタ配列 |
| update | $O(d)$ |
| query | $O(d)$ |
| 空間計算量 | $O(d \cdot w) = O(\frac{1}{\varepsilon} \ln \frac{1}{\delta})$ |
| 誤差保証 | $\hat{f}(x) \leq f(x) + \varepsilon \|f\|_1$ (確率 $1 - \delta$) |
| 特徴 | 過大推定のみ、過小推定なし |
