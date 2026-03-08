---
title: "Suffix Array 解説"
---

## Suffix Array とは

Suffix Array (接尾辞配列) は、文字列 $S$ の全ての接尾辞を辞書順にソートした配列である。1990年に Manber と Myers によって提案された。

Suffix Tree と同等の多くの問題を解くことができ、空間効率がよいため実用上よく使われる。

### 定義

長さ $n$ の文字列 $S$ に対して、Suffix Array $\text{SA}[0..n-1]$ は以下を満たす順列である。

$$
S[\text{SA}[0]..] < S[\text{SA}[1]..] < \cdots < S[\text{SA}[n-1]..]
$$

ここで $<$ は辞書順の比較を表す。

### 具体例

文字列 `banana$` の Suffix Array を求める ($\$$ は番兵文字で全文字より辞書順で小さいとする)。

| ランク | SA | 接尾辞 |
|--------|-----|--------|
| 0 | 6 | `$` |
| 1 | 5 | `a$` |
| 2 | 3 | `ana$` |
| 3 | 1 | `anana$` |
| 4 | 0 | `banana$` |
| 5 | 4 | `na$` |
| 6 | 2 | `nana$` |

したがって $\text{SA} = [6, 5, 3, 1, 0, 4, 2]$ である。

## 素朴な構築法

全接尾辞を生成してソートする。

```python title="sa_naive.py"
def suffix_array_naive(s: str) -> list[int]:
    n = len(s)
    suffixes = [(s[i:], i) for i in range(n)]
    suffixes.sort()
    return [idx for _, idx in suffixes]
```

この方法は $O(n^2 \log n)$ である (ソートに $O(n \log n)$ 回の比較、各比較に $O(n)$)。

## Prefix Doubling 法

### 核心アイデア

接尾辞を直接比較する代わりに、**長さ $2^k$ の部分文字列のランク**を段階的に求める。各ステップで長さを倍にすることで、$O(\log n)$ 回のソートで完成する。

### アルゴリズム

1. 各位置の1文字目でランクを初期化
2. 長さ $2^k$ のランクが求まっているとき、長さ $2^{k+1}$ のランクは $(rank[i], rank[i + 2^k])$ のペアでソートして得られる
3. $2^k \geq n$ になるまで繰り返す

```python title="sa_doubling.py"
def suffix_array_doubling(s: str) -> list[int]:
    n = len(s)
    sa = list(range(n))
    rank = [ord(c) for c in s]
    tmp = [0] * n
    k = 1
    while k < n:
        def compare(a, b):
            if rank[a] != rank[b]:
                return rank[a] - rank[b]
            ra = rank[a + k] if a + k < n else -1
            rb = rank[b + k] if b + k < n else -1
            return ra - rb
        from functools import cmp_to_key
        sa.sort(key=cmp_to_key(compare))
        tmp[sa[0]] = 0
        for i in range(1, n):
            tmp[sa[i]] = tmp[sa[i-1]]
            if compare(sa[i-1], sa[i]) < 0:
                tmp[sa[i]] += 1
        rank = tmp[:]
        k *= 2
    return sa
```

### 計算量

$O(\log n)$ 回のソートを行い、各ソートは $O(n \log n)$ なので、全体で $O(n \log^2 n)$。

基数ソートを使えば各ステップ $O(n)$ となり、全体で $O(n \log n)$ にできる。

## 応用

### パターン検索

テキスト $T$ のSuffix Array があれば、パターン $P$ の出現位置を二分探索で $O(|P| \log |T|)$ で見つけられる。

```python title="sa_search.py"
def search(text: str, sa: list[int], pattern: str) -> list[int]:
    n = len(text)
    m = len(pattern)
    # Lower bound
    lo, hi = 0, n
    while lo < hi:
        mid = (lo + hi) // 2
        if text[sa[mid]:sa[mid]+m] < pattern:
            lo = mid + 1
        else:
            hi = mid
    left = lo
    # Upper bound
    hi = n
    while lo < hi:
        mid = (lo + hi) // 2
        if text[sa[mid]:sa[mid]+m] <= pattern:
            lo = mid + 1
        else:
            hi = mid
    return [sa[i] for i in range(left, lo)]
```

### その他の応用

- **最長共通部分文字列**: 2つの文字列を連結してSuffix Arrayを構築し、LCP Arrayと組み合わせて求める
- **文字列の辞書順比較**: ランク配列を使って $O(1)$ で比較
- **出現回数の計数**: 二分探索で $O(|P| \log n)$

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | 長さ $n$ の文字列 $S$ |
| 出力 | Suffix Array $\text{SA}[0..n-1]$ |
| 素朴法 | $O(n^2 \log n)$ |
| Prefix Doubling | $O(n \log^2 n)$ or $O(n \log n)$ |
| SA-IS | $O(n)$ |
| パターン検索 | $O(\|P\| \log n)$ |
| 空間計算量 | $O(n)$ |
