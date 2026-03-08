---
title: "Deque 解説"
---

## Deque とは

Deque (デック、Double-Ended Queue) は、**両端** から要素の追加・削除ができるデータ構造である。Stack と Queue を一般化したものと考えることができる。

### 基本操作

| 操作 | 説明 | 時間計算量 |
|------|------|------------|
| `push_front(x)` | 要素 $x$ を先頭に追加 | $O(1)$ |
| `push_back(x)` | 要素 $x$ を末尾に追加 | $O(1)$ |
| `pop_front()` | 先頭から要素を取り出す | $O(1)$ |
| `pop_back()` | 末尾から要素を取り出す | $O(1)$ |
| `peek_front()` | 先頭の要素を参照 | $O(1)$ |
| `peek_back()` | 末尾の要素を参照 | $O(1)$ |
| `isEmpty()` | 空かどうかを返す | $O(1)$ |
| `size()` | 要素数を返す | $O(1)$ |

### Stack / Queue との関係

- **Stack**: `push_back` + `pop_back` だけを使えば Stack として振る舞う
- **Queue**: `push_back` + `pop_front` だけを使えば Queue として振る舞う

つまり Deque は Stack と Queue の上位互換である。

## リングバッファによる実装

Queue と同様にリングバッファで実装できる。先頭 (`head`) と末尾 (`tail`) の 2 つのポインタを管理し、どちらの方向にも要素を追加・削除する。

```python title="deque_ring.py"
class Deque:
    def __init__(self, capacity: int):
        self.data = [None] * capacity
        self.head = 0
        self.tail = 0
        self.count = 0
        self.capacity = capacity

    def push_front(self, x):
        if self.count == self.capacity:
            raise OverflowError("Deque overflow")
        self.head = (self.head - 1) % self.capacity
        self.data[self.head] = x
        self.count += 1

    def push_back(self, x):
        if self.count == self.capacity:
            raise OverflowError("Deque overflow")
        self.data[self.tail] = x
        self.tail = (self.tail + 1) % self.capacity
        self.count += 1

    def pop_front(self):
        if self.count == 0:
            raise IndexError("Deque underflow")
        val = self.data[self.head]
        self.head = (self.head + 1) % self.capacity
        self.count -= 1
        return val

    def pop_back(self):
        if self.count == 0:
            raise IndexError("Deque underflow")
        self.tail = (self.tail - 1) % self.capacity
        val = self.data[self.tail]
        self.count -= 1
        return val

    def peek_front(self):
        if self.count == 0:
            raise IndexError("Deque is empty")
        return self.data[self.head]

    def peek_back(self):
        if self.count == 0:
            raise IndexError("Deque is empty")
        return self.data[(self.tail - 1) % self.capacity]
```

## 双方向連結リストによる実装

```python title="deque_linked.py"
class Node:
    def __init__(self, val, prev_node=None, next_node=None):
        self.val = val
        self.prev = prev_node
        self.next = next_node

class LinkedDeque:
    def __init__(self):
        self.head = None
        self.tail = None
        self._size = 0

    def push_front(self, x):
        node = Node(x, next_node=self.head)
        if self.head:
            self.head.prev = node
        else:
            self.tail = node
        self.head = node
        self._size += 1

    def push_back(self, x):
        node = Node(x, prev_node=self.tail)
        if self.tail:
            self.tail.next = node
        else:
            self.head = node
        self.tail = node
        self._size += 1

    def pop_front(self):
        if not self.head:
            raise IndexError("Deque underflow")
        val = self.head.val
        self.head = self.head.next
        if self.head:
            self.head.prev = None
        else:
            self.tail = None
        self._size -= 1
        return val

    def pop_back(self):
        if not self.tail:
            raise IndexError("Deque underflow")
        val = self.tail.val
        self.tail = self.tail.prev
        if self.tail:
            self.tail.next = None
        else:
            self.head = None
        self._size -= 1
        return val
```

## 計算量

| 実装方法 | push_front | push_back | pop_front | pop_back | 空間計算量 |
|----------|------------|-----------|-----------|----------|------------|
| リングバッファ | $O(1)$ | $O(1)$ | $O(1)$ | $O(1)$ | $O(n)$ |
| 双方向連結リスト | $O(1)$ | $O(1)$ | $O(1)$ | $O(1)$ | $O(n)$ |

## 応用

### スライディングウィンドウ最小値/最大値

配列上の固定長ウィンドウ内の最小値 (または最大値) を効率的に求める問題は、Deque を使って $O(n)$ で解ける。

ウィンドウを右にスライドさせるとき:

1. 新しい要素が Deque の末尾より小さい間、末尾から取り除く
2. 新しい要素を末尾に追加
3. ウィンドウの範囲外の要素を先頭から取り除く

Deque の先頭が常にウィンドウ内の最小値になる。

```python title="sliding_window_min.py"
from collections import deque

def sliding_window_min(arr: list[int], k: int) -> list[int]:
    dq = deque()  # stores indices
    result = []
    for i, x in enumerate(arr):
        # Remove elements outside the window
        while dq and dq[0] <= i - k:
            dq.popleft()
        # Maintain monotonicity
        while dq and arr[dq[-1]] >= x:
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            result.append(arr[dq[0]])
    return result
```

### BFS の 0-1 重み付きグラフ

辺の重みが 0 か 1 しかないグラフでの最短経路問題は、Deque を使って $O(V + E)$ で解ける (0-1 BFS)。重み 0 の辺を通るときは先頭に、重み 1 の辺を通るときは末尾に追加する。

## まとめ

| 項目 | 内容 |
|------|------|
| データ構造 | Deque (両端キュー) |
| 特徴 | 両端からの追加・削除が $O(1)$ |
| 基本操作 | push_front, push_back, pop_front, pop_back |
| 時間計算量 | 全操作 $O(1)$ |
| 空間計算量 | $O(n)$ |
| 主な応用 | スライディングウィンドウ、0-1 BFS |
