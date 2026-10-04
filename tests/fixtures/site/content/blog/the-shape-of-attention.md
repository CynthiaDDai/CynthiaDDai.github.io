---
title: "The shape of attention"
description: "A short, worked example of turning a collection of vectors into a conversation."
date: 2026-10-03
tags: [mathematics, machine-learning]
example: true
---

This is an **example article** for trying the reading experience: equations, syntax-highlighted code, tables, and footnotes. Replace it with your own writing when you’re ready.

Attention starts with a simple question: which parts of the input matter to this part of the output? Rather than compress everything into one fixed summary, we let each position ask that question for itself.

## Queries, keys, and values

Think of a query as a question, a key as a label, and a value as the information behind that label. The model compares the query with each key, then mixes the values according to how well they match.

For a query $q$ and keys $k_i$, the score is a dot product:

$$
s_i = \frac{q^\top k_i}{\sqrt{d_k}}.
$$

The scaling factor prevents large dot products from making the softmax distribution too sharp as the dimension grows.[^scaling]

| Symbol | Shape | Meaning |
| --- | --- | --- |
| $Q$ | $n \times d_k$ | Questions from the input |
| $K$ | $n \times d_k$ | Labels to compare against |
| $V$ | $n \times d_v$ | Information to combine |

## A weighted conversation

Putting the queries together gives the familiar matrix form:

$$
\operatorname{Attention}(Q,K,V)
= \operatorname{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V.
$$

Each row of the softmax matrix sums to one. Each output vector is therefore a weighted combination of the values, with weights that depend on its query.

```python
import numpy as np

def attention(q, k, v):
    scores = q @ k.T / np.sqrt(k.shape[-1])
    # Subtracting the row maximum makes exponentiation stable.
    weights = np.exp(scores - scores.max(axis=-1, keepdims=True))
    weights /= weights.sum(axis=-1, keepdims=True)
    return weights @ v
```

> The useful part is the relationship: the representation at one position can depend directly on information at another.

## A detail worth keeping

Attention alone does not encode the order of a sequence. Position information must enter somewhere else. That is a helpful reminder that a compact equation can hide a substantial design decision.

For the original formulation, see [Attention Is All You Need](https://arxiv.org/abs/1706.03762). For the implementation behind this site, take a look at the [terminal website project](/projects/terminal-website).

[^scaling]: If independent query and key components have zero mean and unit variance, their dot product has variance $d_k$. Dividing by $\sqrt{d_k}$ restores variance one.
