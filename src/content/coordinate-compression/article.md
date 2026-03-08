---
title: "座標圧縮 解説"
---

## 座標圧縮とは

座標圧縮 (Coordinate Compression) は、大きな値の集合を**相対的な順序関係を保ったまま**、$0, 1, 2, \ldots$ のような小さい連続整数に変換する前処理手法である。

### 動機

例えば、$10^9$ 程度の座標値を扱う問題で配列のインデックスとして使いたい場合、直接は不可能である。しかし、値の種類数が $N$ 程度なら、$O(N)$ サイズの配列で管理できる。

### 定義

$N$ 個の値 $a_0, a_1, \ldots, a_{N-1}$ が与えられたとき、座標圧縮とは以下の写像 $f$ を構成することである:

$$
f(a_i) = |\{j \mid a_j < a_i\}|
$$

すなわち、各値をその値より小さい値の種類数に置き換える。

## アルゴリズム

### 手順

1. 元の配列をコピーしてソートする
2. 重複を除去する
3. 各元の値に対して、重複除去後の配列での位置 (二分探索) を対応づける

### 実装

```python title="coordinate_compression.py"
def compress(a: list[int]) -> list[int]:
    sorted_unique = sorted(set(a))
    rank = {v: i for i, v in enumerate(sorted_unique)}
    return [rank[v] for v in a]
```

C++ では `std::lower_bound` を使うことが多い:

```cpp title="coordinate_compression.cpp"
vector<int> compress(vector<int> a) {
    vector<int> sorted_a = a;
    sort(sorted_a.begin(), sorted_a.end());
    sorted_a.erase(unique(sorted_a.begin(), sorted_a.end()), sorted_a.end());
    for (auto& x : a) {
        x = lower_bound(sorted_a.begin(), sorted_a.end(), x) - sorted_a.begin();
    }
    return a;
}
```

## 計算量

| 操作 | 計算量 |
|------|--------|
| ソート | $O(N \log N)$ |
| 重複除去 | $O(N)$ |
| ランク付け | $O(N \log N)$ (二分探索) or $O(N)$ (ハッシュマップ) |
| **合計** | $O(N \log N)$ |

空間計算量は $O(N)$ である。

## 応用

- **BIT/セグメント木**: 値が巨大でも、座標圧縮後のインデックスで管理できる
- **転倒数の計算**: 圧縮後の値を BIT に載せる
- **二次元平面の問題**: x座標・y座標をそれぞれ圧縮して格子点に変換
- **区間スケジューリング**: 時刻を圧縮してイベント処理

## まとめ

| 項目 | 内容 |
|------|------|
| 入力 | $N$ 個の整数 |
| 出力 | $[0, M)$ ($M$ は異なる値の数) に圧縮した配列 |
| 時間計算量 | $O(N \log N)$ |
| 空間計算量 | $O(N)$ |
| 核心 | ソート + 重複除去でランク付け |
