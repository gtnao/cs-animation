---
title: "Undo可能データ構造 解説"
---

## Undo可能データ構造とは

Undo可能データ構造は、通常のデータ構造に**操作の取り消し (Undo)** 機能を追加したものである。最後に行った操作を逆転させて、1つ前の状態に戻すことができる。

競技プログラミングでは、分割統治やセグメント木上の DFS で「あるノードに入るときに操作し、出るときに元に戻す」パターンが頻出する。このとき Undo 可能なデータ構造が必要になる。

## 設計パターン

### 1. 操作履歴スタック (Command Pattern)

各操作の**逆操作に必要な情報**を履歴スタックに保存する。Undo 時に逆操作を実行する。

```python title="undoable_stack.py"
class UndoableStack:
    def __init__(self):
        self.data = []
        self.history = []

    def push(self, val):
        self.data.append(val)
        self.history.append(('push', val))

    def pop(self):
        if not self.data:
            return None
        val = self.data.pop()
        self.history.append(('pop', val))
        return val

    def undo(self):
        if not self.history:
            return
        op, val = self.history.pop()
        if op == 'push':
            self.data.pop()
        elif op == 'pop':
            self.data.append(val)
```

この方式のポイントは、**操作そのものではなく「元に戻すために必要な最小限の情報」を記録する**ことである。例えば上の例では、`pop` の undo は `push` であり、取り出した値さえ覚えておけば逆操作が可能である。

#### 一般的な実装パターン

操作履歴スタックの一般的なパターンを抽象化すると以下のようになる:

```python title="undoable_pattern.py"
class UndoableStructure:
    def __init__(self):
        self.history = []

    def save(self, undo_info):
        """Record information needed for undo."""
        self.history.append(undo_info)

    def snapshot(self) -> int:
        """Return current history position as a save point."""
        return len(self.history)

    def rollback(self, save_point: int):
        """Undo all operations back to the save point."""
        while len(self.history) > save_point:
            undo_info = self.history.pop()
            self._apply_undo(undo_info)

    def _apply_undo(self, undo_info):
        """Override: apply a single undo step."""
        raise NotImplementedError
```

`snapshot` で現在の状態を記録し、`rollback` でその地点まで一気に巻き戻す。この snapshot/rollback パターンは非常に汎用的で、Rollback 可能 Union-Find をはじめ多くのデータ構造で使われる。

### 2. スナップショット方式

状態全体をコピーして保存する。メモリを多く使うが実装が簡単。

```python title="snapshot_approach.py"
import copy

class SnapshotStructure:
    def __init__(self):
        self.state = {}
        self.snapshots = []

    def save_snapshot(self):
        """Save the entire state."""
        self.snapshots.append(copy.deepcopy(self.state))

    def restore(self):
        """Restore to the last snapshot."""
        if self.snapshots:
            self.state = self.snapshots.pop()
```

**利点:** あらゆるデータ構造に適用でき、逆操作の設計が不要。

**欠点:** 状態が大きい場合にコピーのコストが非常に高い。$N$ 要素のデータ構造を $Q$ 回操作すると $O(NQ)$ のメモリが必要。

### 3. 差分記録方式

状態全体ではなく、**変更された部分のみ**を記録する。操作履歴スタックの一種だが、「どのフィールドが何から何に変わったか」を直接記録する点が特徴的である。

```python title="diff_recording.py"
class DiffRecordingArray:
    def __init__(self, n: int):
        self.data = [0] * n
        self.history = []  # [(index, old_value), ...]

    def set(self, idx: int, val: int):
        """Set data[idx] = val, recording the old value."""
        self.history.append((idx, self.data[idx]))
        self.data[idx] = val

    def snapshot(self) -> int:
        return len(self.history)

    def rollback(self, save_point: int):
        while len(self.history) > save_point:
            idx, old_val = self.history.pop()
            self.data[idx] = old_val
```

Rollback 可能 Union-Find はまさにこの差分記録方式の典型例であり、`parent` 配列と `rank` 配列の変更差分を記録する。

## Undo可能データ構造の具体例

### Undo可能Union-Find (Rollback可能Union-Find)

Union-Find は `union` 操作で木の構造を変更する。通常の Union-Find では経路圧縮を行うが、経路圧縮は多数のノードの親を書き換えるため undo が困難である。

そこで経路圧縮を行わず **union by rank** のみを使い、`union` で変更される `parent` と `rank` の差分を記録する。詳細は [Rollback可能Union-Find](/cs-animation/rollback-union-find/article) を参照。

### Undo可能な重み付きグラフ構造

辺の追加・削除を伴うグラフ問題では、辺の追加時にデータ構造の変更を記録し、不要になった辺の効果を rollback で除去する。Offline Dynamic Connectivity では、時間軸上のセグメント木と Rollback 可能 Union-Find を組み合わせてこれを実現する。

## 実装上の注意点

### 深いコピーの回避

スナップショット方式では `deepcopy` のコストが問題になる。以下の対策がある:

1. **差分記録方式を使う**: 変更箇所のみを記録することでコピーを回避
2. **永続データ構造を使う**: パス上のノードのみをコピーすることで $O(\log N)$ のコストに抑える
3. **Copy-on-Write**: 実際に変更が発生するまでコピーを遅延する

### Undo の順序

操作履歴スタック方式では、**undo は操作を行った逆順にしか実行できない** (LIFO)。任意の位置の操作だけを取り消したい場合は、永続データ構造が必要になる。

## 永続データ構造との違い

Undo 可能データ構造と永続データ構造はどちらも「過去の状態にアクセスする」機能を提供するが、設計思想が異なる。

| 観点 | Undo可能データ構造 | 永続データ構造 |
|------|-------------------|--------------|
| アクセスできる過去 | 直前の状態 (スタック的) | 任意のバージョン |
| 過去の状態からの分岐 | 不可 (線形の履歴) | 可能 (木状の履歴) |
| 空間計算量 | $O(Q)$ (差分記録) | $O(Q \log N)$ (パスコピー) |
| 実装の容易さ | 比較的簡単 | やや複雑 |
| 典型的な用途 | DFS の行き帰り、分割統治 | 複数の時点からの並列クエリ |

Undo 可能データ構造は「直線的に進んで戻る」パターンに特化しており、永続データ構造より軽量に実装できる。一方で、複数の分岐を持つような履歴管理には向かない。

## 計算量

| 方式 | Undo の計算量 | 空間計算量 |
|------|-------------|-----------|
| 逆操作スタック | $O(1)$ | $O(Q)$ |
| スナップショット | $O(S)$ (状態サイズ) | $O(Q \cdot S)$ |
| 差分記録 | $O(1)$ per diff | $O(Q)$ |
| 永続データ構造 | $O(1)$ (参照切替) | $O(Q \log N)$ |

## 応用

- **Rollback可能Union-Find**: Union の差分を履歴保存
- **Offline Dynamic Connectivity**: セグメント木上の DFS で union/rollback
- **Mo's Algorithm with Rollback**: add のみで動作する Mo's Algorithm
- **テキストエディタ**: 編集操作のUndo/Redo
- **ゲーム木の探索**: 手を進める/戻す
- **バックトラック法**: 探索木のノードに入る/出るときの状態管理

## まとめ

| 項目 | 内容 |
|------|------|
| 核心 | 逆操作の保存と実行 |
| 主要パターン | 操作履歴スタック、スナップショット、差分記録 |
| 代表例 | Rollback可能Union-Find |
| 典型的な用途 | 分割統治、セグメント木上の DFS |
| 永続との違い | LIFO 限定だが軽量 |
