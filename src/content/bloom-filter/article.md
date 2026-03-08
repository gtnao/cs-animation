---
title: "Bloom Filter 解説"
---

## Bloom Filter とは

Bloom Filter (ブルームフィルタ) は、1970年に Burton Howard Bloom によって提案された**確率的データ構造**である。集合に対する「要素が含まれるかどうか」のクエリに答えるが、**偽陽性** (false positive) の可能性がある一方で、**偽陰性** (false negative) は決して起こらない。

### 特徴

- **偽陽性あり:** 集合に含まれない要素を「含まれる」と誤判定する可能性がある
- **偽陰性なし:** 集合に含まれる要素を「含まれない」と判定することはない
- **空間効率:** 実際の要素を格納せず、ビット配列のみで管理

## 構造

Bloom Filter は以下で構成される:

- サイズ $m$ のビット配列 $B[0..m-1]$ (全て 0 で初期化)
- $k$ 個の独立なハッシュ関数 $h_1, h_2, \ldots, h_k$ (各関数は $\{0, 1, \ldots, m-1\}$ に写像)

## 操作

### Add (要素の追加)

要素 $x$ を追加するとき、全てのハッシュ関数を適用し、対応するビットを 1 にする。

$$
B[h_i(x)] \leftarrow 1 \quad (i = 1, 2, \ldots, k)
$$

```python title="bloom_filter.py"
def add(bloom, x):
    for i in range(k):
        idx = hash_i(x, i) % m
        bloom[idx] = 1
```

### Query (存在確認)

要素 $x$ が含まれるか確認するとき、全てのハッシュ関数を適用し、対応するビットが全て 1 かどうかを調べる。

$$
\text{query}(x) = \bigwedge_{i=1}^{k} (B[h_i(x)] = 1)
$$

```python title="bloom_query.py"
def query(bloom, x):
    for i in range(k):
        idx = hash_i(x, i) % m
        if bloom[idx] == 0:
            return False  # Definitely not in set
    return True  # Possibly in set
```

**重要:** query が True を返しても、要素が実際に含まれているとは限らない (偽陽性の可能性)。False を返した場合は、確実に含まれていない。

## 偽陽性確率

### 理論的な偽陽性確率

$n$ 個の要素を追加した後の偽陽性確率を計算する。

各ビットが 0 のままである確率は:

$$
P(\text{bit} = 0) = \left(1 - \frac{1}{m}\right)^{kn} \approx e^{-kn/m}
$$

偽陽性確率 (全 $k$ ビットが 1 である確率) は:

$$
P(\text{fp}) = \left(1 - e^{-kn/m}\right)^k
$$

### 最適なハッシュ関数の数

$m$ と $n$ が固定のとき、偽陽性確率を最小にする $k$ の値は:

$$
k^* = \frac{m}{n} \ln 2 \approx 0.693 \cdot \frac{m}{n}
$$

このとき、偽陽性確率は:

$$
P(\text{fp}) = \left(\frac{1}{2}\right)^k = (0.6185)^{m/n}
$$

### 必要なビット数

偽陽性確率を $\varepsilon$ 以下にするために必要なビット数は:

$$
m \geq -\frac{n \ln \varepsilon}{(\ln 2)^2} \approx 1.44 n \log_2 \frac{1}{\varepsilon}
$$

## 具体例

$n = 1000$ 要素、偽陽性確率 $\varepsilon = 1\%$ の場合:

- 必要なビット数: $m \approx 9585$ (約 1.2 KB)
- 最適なハッシュ関数の数: $k \approx 7$

要素を直接格納する場合と比べて、大幅に少ないメモリで済む。

## 削除の問題

標準の Bloom Filter では**要素の削除ができない**。あるビットを 0 に戻すと、そのビットに依存する他の要素の判定にも影響する。

この問題を解決するバリエーション:
- **Counting Bloom Filter:** 各ビットの代わりにカウンタを使用。削除時にデクリメント
- **Cuckoo Filter:** 削除をサポートし、かつ Bloom Filter より空間効率が良い場合がある

## 応用

- **Web キャッシュ:** キャッシュに存在するか事前チェック
- **データベース:** ディスクアクセス前の存在確認 (LSM-Tree)
- **ネットワーク:** パケットフィルタリング
- **スペルチェッカー:** 辞書に含まれるかの高速確認
- **分散システム:** データの存在確認 (Cassandra, HBase)

## まとめ

| 項目 | 内容 |
|------|------|
| データ構造 | ビット配列 + $k$ 個のハッシュ関数 |
| add | $O(k)$ |
| query | $O(k)$ |
| 空間計算量 | $O(m)$ ビット |
| 偽陽性確率 | $(1 - e^{-kn/m})^k$ |
| 偽陰性 | なし (保証) |
| 削除 | 標準版では不可 |
