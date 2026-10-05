---
title: motivic-euler-product
# Optional fields: delete the leading # to use one. Leave a field out rather than empty.
description: A short introduction to motivic Euler products for my own need # shown under the title, in listings, search and link previews
date: 2026-10-05 # publication date; dated pages are listed newest first
updated: 2026-10-05 # shown as "Updated …" at the end of the page
tags: [mathematics, counting] # shown on the page and in listings; searchable
status: Expositions # required in this folder: one of Lectures, Expositions
wip: true # marks the work as in progress
# authors: A. Author           # byline under the title, and in listings
# venue: arXiv 2503.01234      # shown next to the date, and in listings
# links:                       # buttons on the page and in its listing; label: URL
#   arXiv: https://arxiv.org/abs/2503.01234
# repo: https://github.com/x   # a "Source code ↗" link
# demo: https://example.com    # a "Visit project ↗" link
# motto: 温故知新              # decorative words beside the title, set like a seal
# order: 10                    # position among its siblings; lower comes first
# draft: true                  # keeps the page off the site
---

## Counting with infinite products

This note is about one kind of formula: an infinite product whose expansion counts something. The objects being counted come with a notion of "prime", and every object is built from primes in exactly one way. Before any geometry, here is an example that only involves words.

### Lyndon words

Fix an alphabet with $q$ letters, ordered $a < b < \cdots$, and compare words lexicographically, with a proper prefix counting as smaller (so $a < ab$). There are $q^n$ words of length $n$, so

$$
\sum_{n \ge 0} q^n t^n = \frac{1}{1 - qt}.
$$

A *rotation* of a word $w = uv$, with $u$ and $v$ nonempty, is the word $vu$. A *Lyndon word* is a nonempty word that is strictly smaller than all of its rotations. With the alphabet $\{a, b\}$:

- $aab$ is a Lyndon word, because its rotations $aba$ and $baa$ are both larger.
- $aba$ is not, because its rotation $aab$ is smaller.
- $abab$ is not, because rotating it by two letters gives $abab$ back. In general a Lyndon word is never a power of a shorter word.

The shortest Lyndon words on two letters are:

| length | Lyndon words | count |
| --- | --- | --- |
| 1 | $a$, $b$ | 2 |
| 2 | $ab$ | 1 |
| 3 | $aab$, $abb$ | 2 |
| 4 | $aaab$, $aabb$, $abbb$ | 3 |

Lyndon words behave like prime numbers.

**Theorem (Chen–Fox–Lyndon).** Every word $w$ can be written in exactly one way as

$$
w = \ell_1 \ell_2 \cdots \ell_k, \qquad \ell_1 \ge \ell_2 \ge \cdots \ge \ell_k,
$$

where each $\ell_i$ is a Lyndon word.

A proof is in Chapter 5 of Lothaire's *Combinatorics on Words*. To find the factorization by hand, note that $\ell_1$ is the longest prefix of $w$ that is a Lyndon word. Take it off and repeat on what remains. For example,

$$
aba = ab \cdot a, \qquad bab = b \cdot ab, \qquad baab = b \cdot aab, \qquad abab = ab \cdot ab, \qquad bba = b \cdot b \cdot a.
$$

Since the factors must appear in decreasing order, their order carries no information. A word is therefore the same thing as a *finite multiset of Lyndon words*. In this analogy, words play the role of positive integers, Lyndon words play the role of primes, and length plays the role of size: the length of a word is the sum of the lengths of its factors.

### The Euler product

Unique factorization of integers gives $\sum_n n^{-s} = \prod_p (1 - p^{-s})^{-1}$. Unique factorization of words gives, in the same way,

$$
\frac{1}{1 - qt} = \prod_{\ell \text{ Lyndon}} \frac{1}{1 - t^{|\ell|}} = \prod_{\ell \text{ Lyndon}} \left(1 + t^{|\ell|} + t^{2|\ell|} + \cdots\right),
$$

where $|\ell|$ is the length of $\ell$. The number of letters $q$ no longer appears on the right. It is hidden in the index set, because it determines how many Lyndon words there are of each length.

The right-hand side is an infinite product, so we should say what it means. Expanding it means choosing one term $t^{m_\ell |\ell|}$ from each factor, with only finitely many of the exponents $m_\ell$ nonzero, and multiplying the choices together. A choice is a finite multiset of Lyndon words, in which $\ell$ occurs $m_\ell$ times. It contributes $t^n$ when the total length $\sum_\ell m_\ell |\ell|$ equals $n$. There are only finitely many Lyndon words of length at most $n$, so only finitely many factors can contribute to $t^n$, and every coefficient is a finite count. By the theorem, the choices contributing $t^n$ are exactly the words of length $n$, so the coefficient is $q^n$.

Here is the check for $q = 2$ and $n = 3$, listing every way to choose Lyndon words of total length 3:

| shape | choices | count |
| --- | --- | --- |
| one of length 3 | $aab$, $abb$ | 2 |
| one of length 2, one of length 1 | $\{ab, a\}$, $\{ab, b\}$ | 2 |
| three of length 1 | $\{a,a,a\}$, $\{a,a,b\}$, $\{a,b,b\}$, $\{b,b,b\}$ | 4 |

The total is $2 + 2 + 4 = 8 = 2^3$.

The identity is useful because its two sides are not equally easy to understand. The left side is trivial. The right side involves the number of Lyndon words, which we do not know yet. Call it $M(d)$ for length $d$. Grouping the factors by length gives

$$
\frac{1}{1 - qt} = \prod_{d \ge 1} \left( \frac{1}{1 - t^d} \right)^{M(d)}.
$$

Take logarithms and use $-\log(1 - x) = \sum_{k \ge 1} x^k / k$:

$$
\sum_{n \ge 1} \frac{q^n}{n}\, t^n = \sum_{d \ge 1} M(d) \sum_{k \ge 1} \frac{t^{dk}}{k}.
$$

Comparing the coefficients of $t^n$ gives $q^n = \sum_{d \mid n} d\, M(d)$. Möbius inversion then gives

$$
M(n) = \frac{1}{n} \sum_{d \mid n} \mu(d)\, q^{n/d}.
$$

For $q = 2$ this gives $2, 1, 2, 3, 6, 9, \dots$, which agrees with the table. When $q$ is a prime power, the same $M(n)$ is also the number of monic irreducible polynomials of degree $n$ over $\mathbb{F}_q$. This is not a coincidence, and we will come back to it.

### A sanity check: no repeated factors

Here is a small variation to try in your head. Call a word *squarefree* if no Lyndon word occurs twice in its factorization, that is, if $\ell_1 > \ell_2 > \cdots > \ell_k$ strictly. This is the analogue of a squarefree integer. (It is not the usual meaning of "square-free word" in combinatorics on words, which forbids any block of the form $uu$.) Let $s_n$ be the number of squarefree words of length $n$.

Each Lyndon word is now used either zero times or once, so each factor of the Euler product shrinks to two terms:

$$
\sum_{n \ge 0} s_n t^n = \prod_{\ell \text{ Lyndon}} \left(1 + t^{|\ell|}\right).
$$

To evaluate this, write $1 + x = \dfrac{1 - x^2}{1 - x}$. The denominators multiply to the Euler product. The numerators multiply to the reciprocal of the Euler product with $t$ replaced by $t^2$. So

$$
\prod_{\ell \text{ Lyndon}} \left(1 + t^{|\ell|}\right) = \prod_{\ell \text{ Lyndon}} \frac{1 - t^{2|\ell|}}{1 - t^{|\ell|}} = \frac{1 - qt^2}{1 - qt},
$$

and therefore $s_n = q^n - q^{n-1}$ for $n \ge 2$. For $q = 2$ this predicts $2$ squarefree words of length 2, and $4$ of length 3. The first is easy: of $aa$, $ab$, $ba$, $bb$, the words $aa = a \cdot a$ and $bb = b \cdot b$ repeat a factor. Which four of the eight words of length 3 are squarefree?

Squarefree integers make up a fraction $1/\zeta(2) = 6/\pi^2$ of all integers. Here the squarefree words make up exactly a fraction $1 - 1/q$ of the words of each length $n \ge 2$. The computation also used nothing about infinite products except that they can be multiplied, divided and substituted into like finite products. That is allowed because each coefficient only involves finitely many factors.

### What if the answers are not numbers?

In every identity so far, the coefficient of $t^n$ is the size of a finite set: the words of length $n$, or the squarefree words of length $n$. Taking the size throws away almost everything about the set. All we remember is how many elements it has.

So we can ask what happens if we keep more. Let the coefficients live in some other ring, whose elements remember more about the sets of objects being counted, and ask which of the identities above still hold there. What should an infinite product even mean in such a ring, when we cannot simply count the ways to expand it?

The rest of this note answers these questions for one particular choice of ring, the Grothendieck ring of varieties. The answer is the *motivic Euler product*.

## Zeta functions of varieties

Most algebraic geometers first meet a product of this kind without the words "Euler product". It is the zeta function of a variety over a finite field, as in the statement of the Weil conjectures (for instance, Appendix C of Hartshorne). This section rewrites that zeta function as an Euler product, and finds the Lyndon word identity inside it.

Throughout, $X$ is a scheme of finite type over $\mathbb{F}_q$, for instance a variety. Symmetric powers will need more, and we will say so when they appear. The letter $q$ is reused on purpose: $\mathbb{F}_q$ has $q$ elements, and it will soon serve as an alphabet.

### Counting points over finite fields

Write $N_m = \# X(\mathbb{F}_{q^m})$ for the number of points of $X$ with coordinates in $\mathbb{F}_{q^m}$. The zeta function of $X$ is

$$
Z_X(t) = \exp\left( \sum_{m \ge 1} \frac{N_m}{m}\, t^m \right).
$$

The simplest example is the affine line. Here $\mathbb{A}^1(\mathbb{F}_{q^m}) = \mathbb{F}_{q^m}$, so $N_m = q^m$ and

$$
Z_{\mathbb{A}^1}(t) = \exp\left( \sum_{m \ge 1} \frac{q^m}{m}\, t^m \right) = \frac{1}{1 - qt}.
$$

This is the left-hand side of the Lyndon word identity. Similarly, $\mathbb{P}^1$ has $q^m + 1$ points over $\mathbb{F}_{q^m}$, and $Z_{\mathbb{P}^1}(t) = \dfrac{1}{(1 - t)(1 - qt)}$.

As defined, $Z_X$ has nothing to do with products, and the exponential and the factor $1/m$ look like tricks to make the examples come out nicely. The real reason for them is that $Z_X$ is an Euler product, whose primes are the closed points of $X$.

### Closed points are primes

A closed point $x$ of $X$ has a residue field $\kappa(x)$, which is a finite extension of $\mathbb{F}_q$. The *degree* of $x$ is $\deg x = [\kappa(x) : \mathbb{F}_q]$. For example, the closed points of $\mathbb{A}^1$ are the monic irreducible polynomials $P \in \mathbb{F}_q[T]$, and the degree of the point is the degree of $P$.

Geometrically, a closed point of degree $d$ is an orbit of size $d$ of the Frobenius acting on $X(\overline{\mathbb{F}}_q)$. For instance, if $q$ is odd and $a \in \mathbb{F}_q$ is not a square, the closed point $T^2 - a$ of $\mathbb{A}^1$ is the pair of conjugate points $\pm\sqrt{a}$.

Closed points determine the point counts. A point of $X$ over $\mathbb{F}_{q^m}$ is the same as a closed point $x$ together with an embedding of fields $\kappa(x) \hookrightarrow \mathbb{F}_{q^m}$. Such an embedding exists exactly when $\deg x$ divides $m$, and then there are $\deg x$ of them. So if $a_d$ is the number of closed points of degree $d$,

$$
N_m = \sum_{d \mid m} d\, a_d.
$$

This is the same relation as $q^n = \sum_{d \mid n} d\, M(d)$ for Lyndon words, and the same computation, read backwards, turns it into a product:

$$
\log \prod_{x \text{ closed}} \frac{1}{1 - t^{\deg x}} = \sum_{d \ge 1} a_d \sum_{k \ge 1} \frac{t^{dk}}{k} = \sum_{m \ge 1} \Bigl( \sum_{d \mid m} d\, a_d \Bigr) \frac{t^m}{m} = \sum_{m \ge 1} \frac{N_m}{m}\, t^m.
$$

In other words,

$$
Z_X(t) = \prod_{x \text{ closed}} \frac{1}{1 - t^{\deg x}}.
$$

There are finitely many closed points of each degree (since $a_d \le N_d$), so as before each coefficient involves only finitely many factors. The exponential and the $1/m$ in the definition are exactly what converts point counts into this product.

### The affine line, again

The closed points of $\mathbb{A}^1$ are the monic irreducible polynomials, so its Euler product is unique factorization in $\mathbb{F}_q[T]$:

$$
\frac{1}{1 - qt} = \prod_{P \text{ monic irreducible}} \frac{1}{1 - t^{\deg P}}.
$$

The left-hand side is the same as in the Lyndon word identity. Group the factors by degree. The exponent of $1/(1 - t^d)$ is then the number of primes of size $d$, and the left-hand side determines these exponents one degree at a time. So there are exactly $M(d)$ monic irreducible polynomials of degree $d$ over $\mathbb{F}_q$. This is the coincidence promised earlier. There is no natural bijection with Lyndon words; both counts are forced by the same generating function.

The projective line has one more closed point, $\infty$, of degree 1, and so one more factor: $Z_{\mathbb{P}^1}(t) = \frac{1}{1 - t} \cdot Z_{\mathbb{A}^1}(t)$.

For a less innocent check, let $X$ be the affine line with a doubled origin. It is not separated, but the argument above never used separatedness. Counting directly, $N_m = q^m + 1$: there are $q^m - 1$ nonzero points and two origins. Using the product, $X$ has the closed points of $\mathbb{A}^1$ plus one extra origin of degree 1. Either way, $Z_X = Z_{\mathbb{P}^1}$.

The Euler product only sees closed points and their degrees, not how they are glued. To it, $\mathbb{P}^1$, the doubled line and $\mathbb{A}^1 \sqcup \operatorname{Spec} \mathbb{F}_q$ all look the same: $\mathbb{A}^1$ plus one rational point. In general, if $X$ is the union of a closed subscheme $Y$ and its open complement $U$, then $Z_X = Z_Y \cdot Z_U$. This property will matter later.

### Zero-cycles and symmetric powers

What does the Euler product of a general $X$ count? Expanding it means choosing an exponent $m_x \ge 0$ for each closed point $x$, with only finitely many nonzero. Such a choice is an *effective zero-cycle*

$$
D = \sum_x m_x\, [x], \qquad \deg D = \sum_x m_x \deg x,
$$

as in intersection theory. So

$$
Z_X(t) = \sum_{n \ge 0} \#\{\text{effective zero-cycles of degree } n \text{ on } X\}\, t^n.
$$

On $\mathbb{A}^1$, an effective zero-cycle is the same as a monic polynomial: $\sum_P m_P\, [P]$ corresponds to $\prod_P P^{m_P}$.

Effective zero-cycles of degree $n$ are the points of a variety. Here we need $X$ to be quasi-projective, so that the quotient

$$
\operatorname{Sym}^n X = X^n / S_n
$$

exists as a variety. For the doubled line, the usual construction breaks down, because no affine open contains both origins. The quotient is then only guaranteed to exist as an *algebraic space*, a slightly more general kind of object than a scheme, glued in the étale topology rather than the Zariski topology. Over an algebraically closed field, its points are the unordered $n$-tuples of points of $X$. Over $\mathbb{F}_q$, its $\mathbb{F}_q$-points are the unordered $n$-tuples of points of $X(\overline{\mathbb{F}}_q)$ that the Frobenius maps to themselves, and these are exactly the effective zero-cycles of degree $n$ on $X$. Therefore

$$
Z_X(t) = \sum_{n \ge 0} \# (\operatorname{Sym}^n X)(\mathbb{F}_q)\, t^n.
$$

For $\mathbb{A}^1$, sending an unordered $n$-tuple of roots to the coefficients of the monic polynomial with those roots gives $\operatorname{Sym}^n \mathbb{A}^1 \cong \mathbb{A}^n$, by the fundamental theorem of symmetric polynomials. So the coefficient is $q^n$, as it should be.

An $\mathbb{F}_q$-point of $\operatorname{Sym}^n X$ is *not* the same as an unordered $n$-tuple of $\mathbb{F}_q$-points of $X$. Take $X = \mathbb{A}^1$ and $n = 2$. The variety $\operatorname{Sym}^2 \mathbb{A}^1 \cong \mathbb{A}^2$ has $q^2$ points over $\mathbb{F}_q$. But there are only $q(q+1)/2$ unordered pairs of elements of $\mathbb{F}_q$. The remaining $(q^2 - q)/2$ points are the pairs $\{\alpha, \alpha^q\}$ with $\alpha \in \mathbb{F}_{q^2} \setminus \mathbb{F}_q$. Neither point of such a pair is defined over $\mathbb{F}_q$, but the pair is. These pairs are the closed points of degree 2, and there are $M(2) = (q^2 - q)/2$ of them. In the Euler product, each one is a single prime contributing $t^2$.

### Where this leaves us

Here is the dictionary so far:

| | words | $\mathbb{A}^1$ over $\mathbb{F}_q$ | $X$ over $\mathbb{F}_q$ |
| --- | --- | --- | --- |
| primes | Lyndon words | monic irreducible polynomials | closed points |
| size of a prime | length | degree | degree |
| objects | words | monic polynomials | effective zero-cycles |
| objects of size $n$ | $q^n$ | $q^n$ | $\#(\operatorname{Sym}^n X)(\mathbb{F}_q)$ |

The last entry is new. The coefficient of $t^n$ is still a count, but what is being counted is now the set of $\mathbb{F}_q$-points of a variety, $\operatorname{Sym}^n X$.

Now replace $\mathbb{F}_q$ by $\mathbb{C}$, or by $\overline{\mathbb{F}}_p$. Every closed point now has degree 1, and there are infinitely many of them, so $\#X(\mathbb{C})$ and $\#(\operatorname{Sym}^n X)(\mathbb{C})$ are infinite. Taking the number of points is no longer a legal move. The varieties $\operatorname{Sym}^n X$ are still there, though. Only the count has broken.

The number of points was always a compressed summary of the geometry. Over a finite field the compression happened to keep enough to make the identities above work. Over $\mathbb{C}$ it keeps nothing. So the natural thing to do is to step back and keep track of the geometry itself, compressing only as much as the identities need. The doubled line suggests how much that is. The Euler product never distinguished it from $\mathbb{P}^1$. The only rule it used was cutting a variety into a closed piece and its open complement.

## The Grothendieck ring of varieties

Fix a field $k$. We want to attach to each variety $X$ over $k$ a class $[X]$ that remembers more than a number, but obeys the one rule from the previous section.

### The definition

The *Grothendieck ring of varieties* $K_0(\mathrm{Var}_k)$ is the abelian group generated by symbols $[X]$, one for each isomorphism class of schemes $X$ of finite type over $k$, subject to the relations

$$
[X] = [Y] + [X \setminus Y] \qquad \text{for every closed subscheme } Y \subseteq X.
$$

The product $[X] \cdot [X'] = [X \times_k X']$ makes it a commutative ring, with unit $1 = [\operatorname{Spec} k]$. The class of the affine line gets its own name:

$$
\mathbb{L} = [\mathbb{A}^1].
$$

Two remarks on the definition. Taking $Y = X_{\mathrm{red}}$ shows $[X] = [X_{\mathrm{red}}]$, so nilpotents are invisible. And every scheme of finite type can be cut into affine pieces, so it makes no difference whether the generators are all such schemes or only varieties.

### First computations

Cutting and pasting gives most of the classes one meets in practice.

- $[\mathbb{A}^n] = \mathbb{L}^n$, since $\mathbb{A}^n = \mathbb{A}^1 \times \cdots \times \mathbb{A}^1$.
- $[\mathbb{G}_m] = \mathbb{L} - 1$, since $\mathbb{G}_m$ is $\mathbb{A}^1$ with a point removed.
- $[\mathbb{P}^1] = \mathbb{L} + 1$, since $\mathbb{P}^1$ is $\mathbb{A}^1$ plus the point $\infty$. More generally, $\mathbb{P}^n = \mathbb{A}^n \sqcup \mathbb{P}^{n-1}$ gives $[\mathbb{P}^n] = 1 + \mathbb{L} + \cdots + \mathbb{L}^n$.
- The doubled line is one copy of $\mathbb{A}^1$, which is open, together with the other origin, which is a closed point. So its class is $\mathbb{L} + 1 = [\mathbb{P}^1]$.

The last line is the identity the zeta function already suggested, now holding before any counting.

Every class above is a polynomial in $\mathbb{L}$ with integer coefficients, because every variety above can be cut into affine spaces. Most varieties cannot, and the simplest one that cannot is an elliptic curve: a smooth projective curve of genus 1 with a chosen point $O$. For the rest of this subsection, $k = \mathbb{C}$ and $E$ is an elliptic curve, for instance the closure in $\mathbb{P}^2$ of $y^2 = x^3 - x$, with $O$ its point at infinity.

We can still cut. Removing $O$ leaves the affine curve $E_0$ given by $y^2 = x^3 - x$, so $[E] = [E_0] + 1$. But nothing more comes out. No open piece of $E$ is isomorphic to an open piece of $\mathbb{A}^1$, since $E$ and $\mathbb{P}^1$ would then be birational. This is not yet a proof that $[E]$ is new. Two classes can agree in $K_0(\mathrm{Var}_k)$ through a long chain of relations without any visible decomposition, so failing to find one proves nothing. What we need is an invariant that respects the relations and tells $[E]$ apart from everything built out of $\mathbb{L}$.

Over $\mathbb{C}$, one such invariant is the Hodge–Deligne polynomial, a ring homomorphism $e : K_0(\mathrm{Var}_{\mathbb{C}}) \to \mathbb{Z}[u, v]$ that records the Hodge numbers of compactly supported cohomology. The next subsection places it among other invariants of the same kind. Here we only need two of its values:

$$
e(\mathbb{L}) = uv, \qquad e([E]) = 1 - u - v + uv = (1 - u)(1 - v).
$$

The four terms of $e([E])$ are the four pieces of the cohomology of $E$: $1$ for $H^0$, $-u$ and $-v$ for the two halves $H^{1,0}$ and $H^{0,1}$ of $H^1$, and $uv$ for $H^2$.

Now suppose $[E] = f(\mathbb{L})$, where $f(\mathbb{L})$ is any expression built from $\mathbb{L}$ alone. It could be a polynomial. In a ring where $\mathbb{L}$ is inverted and infinite series in $\mathbb{L}^{-1}$ converge, it could also be a quotient of polynomials, or a transcendental series such as $\sum_{n \ge 0} \mathbb{L}^{-n^2}$. Whatever $f$ is, as long as $e$ can be applied to it, $e$ turns it into $f(uv)$, an expression in the product $uv$ alone. The substitution

$$
u \mapsto -u, \qquad v \mapsto -v
$$

leaves $uv$ unchanged, so it leaves $f(uv)$ unchanged too. It does not leave $e([E])$ unchanged: it sends $1 - u - v + uv$ to $1 + u + v + uv$. So $e([E]) \ne e(f(\mathbb{L}))$, and therefore $[E] \ne f(\mathbb{L})$.

The argument never asked what $f$ is. It used only that $f(\mathbb{L})$ depends on $\mathbb{L}$ alone, and that $e(\mathbb{L}) = uv$ cannot see the sign change. The sign change flips the terms of odd total degree in $u$ and $v$, which for a smooth projective variety come from cohomology in odd degree. Affine spaces have no odd cohomology, so nothing built from $\mathbb{L}$ has any, while $H^1(E)$ is two-dimensional. The same argument works for every curve of genus $g \ge 1$, whose Hodge–Deligne polynomial is $1 - gu - gv + uv$. So $K_0(\mathrm{Var}_{\mathbb{C}})$ is much larger than the polynomials in $\mathbb{L}$, and this is the extra information that the motivic version of an Euler product will be able to keep track of.

### Counting is a ring homomorphism

Over $k = \mathbb{F}_q$, a closed subscheme and its open complement split the $\mathbb{F}_q$-points of $X$ into two disjoint sets, and the points of a product are pairs of points. So counting points respects both the relations and the product, and defines a ring homomorphism

$$
\# : K_0(\mathrm{Var}_{\mathbb{F}_q}) \to \mathbb{Z}, \qquad [X] \mapsto \#X(\mathbb{F}_q), \qquad \mathbb{L} \mapsto q.
$$

The same holds over $\mathbb{F}_{q^m}$ for every $m$, so the zeta function $Z_X$ only depends on $[X]$. This is why it could not tell $\mathbb{P}^1$ from the doubled line.

A single count cannot see what made the elliptic curve new. An elliptic curve $E$ over $\mathbb{F}_q$ has $q + 1 - a$ points for some integer $a$, and that is just a number. The counts over all $\mathbb{F}_{q^m}$ together do see it. By Weil's theorem for curves,

$$
\#E(\mathbb{F}_{q^m}) = q^m + 1 - \alpha^m - \beta^m,
$$

where $\alpha$ and $\beta$ are complex numbers with $\alpha + \beta = a$, $\alpha \beta = q$ and $|\alpha| = |\beta| = \sqrt{q}$. Compare this with $e([E]) = 1 - u - v + uv$. The term $q^m = (\alpha\beta)^m$ is the image of $\mathbb{L}$, like $uv$, while $\alpha^m + \beta^m$ plays the role of $u + v$. It is not constant in $m$, and its size is at most $2q^{m/2}$, half a power of $q^m$. A polynomial in $q^m$ with integer coefficients is either constant or grows at least as fast as $q^m$, so this term cannot come from a polynomial in $\mathbb{L}$. That is the point-counting shadow of the sign argument above, and $\alpha$ and $\beta$ are the shadows of $u$ and $v$.

Over $\mathbb{C}$ there are other invariants with the same two properties. The Euler characteristic with compact support gives $\chi_c : K_0(\mathrm{Var}_{\mathbb{C}}) \to \mathbb{Z}$ with $\mathbb{L} \mapsto 1$. It sends an elliptic curve to $0$, the same as the empty variety, so on its own it cannot see $E$ at all. The Hodge–Deligne polynomial from the previous subsection gives $e : K_0(\mathrm{Var}_{\mathbb{C}}) \to \mathbb{Z}[u, v]$ with $\mathbb{L} \mapsto uv$, and setting $u = v = 1$ recovers $\chi_c$. In each case, $[X]$ is the more refined object and the invariant is a compression of it. In fact $K_0(\mathrm{Var}_k)$ is the universal target for invariants that respect cutting and pasting and products, since that is exactly how it was defined.

### Where the name comes from

Grothendieck defined this group in a letter to Serre of 16 August 1964. In the same letter, the word *motive* appears for the first time. Grothendieck hoped for an abelian category of motives, a universal cohomology theory through which every reasonable cohomological invariant of a variety would factor. He admitted that he did not yet know how to define it. The Grothendieck ring is a crude shadow of that hope, because any reasonable category of motives receives a map from it. Kontsevich called it the ring of "poor man's motives". This is why objects built from classes in $K_0(\mathrm{Var}_k)$ are called *motivic*.

### Kapranov's zeta function

We can now do what the previous section asked for. Let $X$ be quasi-projective over $k$. Instead of counting the points of $\operatorname{Sym}^n X$, keep its class. Kapranov's *motivic zeta function* is

$$
Z^{\mathrm{mot}}_X(t) = \sum_{n \ge 0} [\operatorname{Sym}^n X]\, t^n \in K_0(\mathrm{Var}_k)[[t]].
$$

Over $\mathbb{F}_q$, applying $\#$ to each coefficient recovers $Z_X(t)$. For the affine line, $\operatorname{Sym}^n \mathbb{A}^1 \cong \mathbb{A}^n$, so

$$
Z^{\mathrm{mot}}_{\mathbb{A}^1}(t) = \sum_{n \ge 0} \mathbb{L}^n t^n = \frac{1}{1 - \mathbb{L} t},
$$

which specializes to $1/(1 - qt)$ when $\mathbb{L} \mapsto q$.

For an elliptic curve $E$ over $k$, the answer involves more than $\mathbb{L}$. Let $n \ge 1$, and send an effective zero-cycle $D$ of degree $n$ to the sum of its points in the group law of $E$. By Abel's theorem, two such cycles have the same sum exactly when they are linearly equivalent. So the fibre over a point $p$ is the set of effective divisors linearly equivalent to $(n - 1)O + p$, which is the projective space of lines in an $n$-dimensional space of sections, by Riemann–Roch. This makes $\operatorname{Sym}^n E$ a $\mathbb{P}^{n-1}$-bundle over $E$. It is the projectivization of a vector bundle, so it is a product over each piece of a suitable cutting of $E$, and its class is $[E]\,[\mathbb{P}^{n-1}]$. Using $\sum_{n \ge 1} [\mathbb{P}^{n-1}]\, t^n = t / \bigl((1 - t)(1 - \mathbb{L}t)\bigr)$,

$$
Z^{\mathrm{mot}}_E(t) = 1 + \frac{[E]\, t}{(1 - t)(1 - \mathbb{L} t)} = \frac{1 + \bigl([E] - 1 - \mathbb{L}\bigr) t + \mathbb{L} t^2}{(1 - t)(1 - \mathbb{L} t)}.
$$

The denominator is $Z^{\mathrm{mot}}_{\mathbb{P}^1}(t)$. The numerator is where $E$ differs from $\mathbb{P}^1$, and its middle coefficient $[E] - 1 - \mathbb{L}$ is exactly the part of $[E]$ that, as we saw, cannot be written in terms of $\mathbb{L}$. Over $\mathbb{F}_q$, counting sends it to $-a$, and the numerator becomes $1 - at + qt^2 = (1 - \alpha t)(1 - \beta t)$. This recovers the classical zeta function of $E$:

$$
Z_E(t) = \frac{(1 - \alpha t)(1 - \beta t)}{(1 - t)(1 - qt)}.
$$

Over $\mathbb{C}$, the Hodge–Deligne polynomial sends it to $-u - v$, and the numerator becomes $(1 - ut)(1 - vt)$. In both cases the numerator is the one factor that $\mathbb{L}$ could not have produced.

Over $\mathbb{C}$, applying $\chi_c$ instead gives Macdonald's formula from 1962:

$$
\sum_{n \ge 0} \chi_c(\operatorname{Sym}^n X)\, t^n = \frac{1}{(1 - t)^{\chi_c(X)}}.
$$

Read it as an Euler product. Every point of $X(\mathbb{C})$ has degree 1 and contributes a factor $1/(1 - t)$. There are infinitely many points, but the formula behaves as if there were $\chi_c(X)$ of them. Over $\mathbb{C}$, "the number of points" has not disappeared. It has become the Euler characteristic.

For an elliptic curve, $\chi_c(E) = 0$, so Macdonald's formula predicts $1$. Applying $\chi_c$ to Kapranov's formula, with $[E] \mapsto 0$ and $\mathbb{L} \mapsto 1$, gives $(1 - 2t + t^2)/(1 - t)^2 = 1$, as it should. It also shows how much $\chi_c$ forgets: the numerator $(1 - ut)(1 - vt)$ and the denominator $(1 - t)(1 - uvt)$ become equal at $u = v = 1$, and cancel.

### When is Kapranov's zeta function rational?

Over $\mathbb{F}_q$, the zeta function of every $X$ is a rational function of $t$. This is the first of the Weil conjectures, proved by Dwork in 1960. The elliptic curve shows that sometimes rationality holds before any counting: $Z^{\mathrm{mot}}_E(t)$ is a quotient of two polynomials in $t$ with coefficients in $K_0(\mathrm{Var}_k)$.

The same argument works for every smooth projective curve $C$ of genus $g$ with a rational point, as Kapranov observed. Sending a zero-cycle of degree $n$ to its class in $\operatorname{Pic}^n C$, which is isomorphic to the Jacobian $J$ of $C$, makes $\operatorname{Sym}^n C$ a $\mathbb{P}^{n-g}$-bundle over $J$ once $n \ge 2g - 1$, by Riemann–Roch. So $[\operatorname{Sym}^n C] = [J]\,[\mathbb{P}^{n-g}]$ for all but finitely many $n$, and $Z^{\mathrm{mot}}_C(t)$ is a polynomial of degree at most $2g$ in $t$, divided by $(1 - t)(1 - \mathbb{L}t)$.

Two operations preserve rationality. First, if $Y \subseteq X$ is closed with open complement $U$, cutting $\operatorname{Sym}^n X$ according to how many of the $n$ points lie in $Y$ gives $[\operatorname{Sym}^n X] = \sum_{i + j = n} [\operatorname{Sym}^i Y]\,[\operatorname{Sym}^j U]$, that is,

$$
Z^{\mathrm{mot}}_X(t) = Z^{\mathrm{mot}}_Y(t) \cdot Z^{\mathrm{mot}}_U(t).
$$

This is the motivic version of the property $Z_X = Z_Y \cdot Z_U$ from the previous section. It means that $Z^{\mathrm{mot}}$ turns sums of classes into products of series, so the classes with a rational zeta function form a subgroup of $K_0(\mathrm{Var}_k)$. Second, a lemma of Totaro gives $[\operatorname{Sym}^n(X \times \mathbb{A}^m)] = \mathbb{L}^{mn} [\operatorname{Sym}^n X]$, so $Z^{\mathrm{mot}}_{X \times \mathbb{A}^m}(t) = Z^{\mathrm{mot}}_X(\mathbb{L}^m t)$. Together, these show that every combination of classes $[C]\,\mathbb{L}^m$, with $C$ a curve with a rational point, has a rational zeta function.

Kapranov asked whether $Z^{\mathrm{mot}}_X$ is rational for every $X$. It is not. Larsen and Lunts proved in 2004 that for a smooth projective complex surface $X$,

$$
Z^{\mathrm{mot}}_X(t) \text{ is rational} \iff \kappa(X) = -\infty,
$$

where $\kappa$ is the Kodaira dimension. One direction follows from what we have. A surface with $\kappa = -\infty$ is obtained by blowing up points, starting from $\mathbb{P}^2$ or from a $\mathbb{P}^1$-bundle over a curve $C$. Blowing up a point replaces it by a $\mathbb{P}^1$ and adds $\mathbb{L}$ to the class, so $[X]$ is either $1 + \mathbb{L} + \mathbb{L}^2 + m\mathbb{L}$ or $[C](1 + \mathbb{L}) + m\mathbb{L}$, a combination of the kind above.

The other direction is the hard one, and none of the invariants we have can prove it. Counting points over $\mathbb{F}_q$ turns every $Z^{\mathrm{mot}}_X$ into a rational function, by Dwork. So does the Hodge–Deligne polynomial: if $e([X]) = \sum_{p, q} e_{p,q}\, u^p v^q$, then a Hodge-theoretic version of Macdonald's formula gives

$$
\sum_{n \ge 0} e([\operatorname{Sym}^n X])\, t^n = \prod_{p, q} \left(1 - u^p v^q t\right)^{-e_{p,q}}.
$$

For the elliptic curve this is $(1 - ut)(1 - vt)/\bigl((1 - t)(1 - uvt)\bigr)$, as we found by hand. To see irrationality, Larsen and Lunts construct new ring homomorphisms from $K_0(\mathrm{Var}_{\mathbb{C}})$ to fields. These send $\mathbb{L}$ to $0$ and are sensitive to holomorphic differential forms, which is where the Kodaira dimension enters.

The elliptic curve is a good example here too. The surface $E \times E$ is an abelian surface, with $\kappa = 0$, so $Z^{\mathrm{mot}}_{E \times E}$ is not rational, although $Z^{\mathrm{mot}}_E$ is. The classes with a rational zeta function form a subgroup of $K_0(\mathrm{Var}_{\mathbb{C}})$ that contains $[E]$ but not $[E]^2$. Rationality survives cutting and pasting, but not products.

How much further does this go? Here is some of what is known beyond complex surfaces.

- *Higher dimension.* Larsen and Lunts wrote that in dimension at least 3 the problem seems wide open. A 2025 preprint of Shein extends their necessary condition: if $X$ is smooth, projective, of dimension at least 2 over $\mathbb{C}$, and $Z^{\mathrm{mot}}_X$ is rational, then $\kappa(X) = -\infty$ and $X$ has no nonzero holomorphic forms of even degree. These conditions are not sufficient. If $Y$ is a quintic threefold, then $\kappa(Y) = 0$, so $Z^{\mathrm{mot}}_Y$ is irrational, and its irrationality survives setting $\mathbb{L} = 0$. The fourfold $X = Y \times \mathbb{P}^1$ has $\kappa(X) = -\infty$ and no even-degree forms, but $[X] = [Y] + \mathbb{L}[Y]$, so $Z^{\mathrm{mot}}_X(t) = Z^{\mathrm{mot}}_Y(t)\, Z^{\mathrm{mot}}_Y(\mathbb{L}t)$, which agrees with $Z^{\mathrm{mot}}_Y(t)$ modulo $\mathbb{L}$ and is irrational.
- *Inverting $\mathbb{L}$.* Because the homomorphisms of Larsen and Lunts send $\mathbb{L}$ to $0$, they say nothing about rationality in $K_0(\mathrm{Var}_k)[\mathbb{L}^{-1}]$, the ring that appears in motivic integration. Denef and Loeser conjectured rationality there. In 2020 Larsen and Lunts disproved this with a K3 surface over $\mathbb{Q}$ whose zeta function is irrational even after inverting $\mathbb{L}$.
- *Motives.* In characteristic zero, $K_0(\mathrm{Var}_k)$ maps to the Grothendieck ring of Chow motives. There the zeta function of every motive that is finite-dimensional in the sense of Kimura is rational, by an argument of André. This includes the motives of curves and abelian varieties, so the image of $Z^{\mathrm{mot}}_{E \times E}$ is rational. The irrationality lives in the part of $K_0(\mathrm{Var}_k)$ that motives forget.

For surfaces, these results combine into a clean statement: $Z^{\mathrm{mot}}_X$ is rational exactly when $[X]$ is a combination of classes $[C]\,\mathbb{L}^m$. So here is the question this section leaves open. Is rationality of $Z^{\mathrm{mot}}_X$ always a sign that $X$ is built, up to cutting and pasting, out of curves and affine spaces? If not, what else can produce it?

## Motivic Euler products

Kapranov's zeta function is the motivic version of $\prod_x 1/(1 - t^{\deg x})$, but only of its expanded form, the sum over $n$. The product itself has no meaning yet, because $K_0(\mathrm{Var}_k)$ has no infinite products over the points of a variety. This section explains how Margaret Bilu makes sense of such products, with more general factors than $1/(1 - t)$. The construction is in her thesis, published as *Motivic Euler products and motivic height zeta functions* (Memoirs of the AMS, 2023).

As in the introduction to Bilu's work, take $k$ algebraically closed, so that every closed point has degree 1 and degrees play no role. We also take $k$ of characteristic zero, which avoids a technical issue with bijective morphisms below.

### Expanding a product over the points of a variety

Let $X$ be a quasi-projective variety, and let $\mathcal{X} = (X_i)_{i \ge 1}$ be a family of quasi-projective varieties with morphisms $X_i \to X$. For a point $x \in X$, write $X_{i,x}$ for the fibre of $X_i$ over $x$. We want to define

$$
\prod_{x \in X} \left(1 + X_{1,x}\, t + X_{2,x}\, t^2 + \cdots\right),
$$

where the coefficient of $t^i$ in the factor at $x$ is the class of $X_{i,x}$. The coefficients may vary with $x$. When they do not, that is, when $X_i = X \times Y_i$ for varieties $Y_i$, every factor is the same series $1 + [Y_1]\,t + [Y_2]\,t^2 + \cdots$.

Expand the product as we did for Lyndon words, by choosing one term from each factor, with all but finitely many choices equal to $1$. In degree 1, a choice is a point $x$ together with the term $X_{1,x}\,t$. Taken together, these choices form $X_1$ itself, so the coefficient of $t$ is $[X_1]$. In degree 2, there are two kinds of choice. Either two distinct points $x \ne y$ each contribute a term of degree 1, or one point $x$ contributes $X_{2,x}\,t^2$. The choices of the second kind form $X_2$. The choices of the first kind form the variety of unordered pairs of points of $X_1$ lying over distinct points of $X$. So the coefficient of $t^2$ should be

$$
\left[ (X_1 \times X_1)_* / S_2 \right] + [X_2],
$$

where the subscript $*$ means the open subset where the two points have distinct images in $X$.

In general, the choices contributing to $t^n$ are sorted by a partition $\pi$ of $n$. Write $\pi = (n_i)_{i \ge 1}$, where $n_i$ is the number of points that contribute their term of degree $i$, so that $n = \sum_i i\, n_i$. Bilu defines

$$
\operatorname{Conf}^\pi(\mathcal{X}) = \Bigl( \prod_{i \ge 1} X_i^{n_i} \Bigr)_* \Big/ \prod_{i \ge 1} S_{n_i},
$$

where the subscript $*$ again means that the images of all $\sum_i n_i$ points in $X$ are pairwise distinct, and $S_{n_i}$ permutes the $n_i$ factors equal to $X_i$. A point of $\operatorname{Conf}^\pi(\mathcal{X})$ is a finite set of distinct points of $X$, with $n_i$ of them labelled $i$, together with a point of $X_{i,x}$ for each $x$ labelled $i$. That is exactly a choice of one term from each factor. Then

$$
\prod_{x \in X} \left(1 + X_{1,x}\, t + X_{2,x}\, t^2 + \cdots\right) := 1 + \sum_{n \ge 1} \sum_{\pi \vdash n} \left[\operatorname{Conf}^\pi(\mathcal{X})\right] t^n \in K_0(\mathrm{Var}_k)[[t]].
$$

This is the expansion of the Lyndon word product, with one difference. There, the choices contributing to $t^n$ formed a finite set, and we kept its size. Here they form a variety, and we keep its class.

When every $X_i$ is $X$ itself, the space $\operatorname{Conf}^\pi(\mathcal{X})$ is the space $\operatorname{Conf}^\pi X$ of configurations of distinct points of $X$, with $n_i$ of them labelled $i$.

At this point the right-hand side is only a notation, and it has to be shown that it behaves like a product. Bilu proves that it does. For instance, if $Y \subseteq X$ is closed with complement $U$, then the product over $X$ is the product over $Y$ times the product over $U$, which generalizes $Z^{\mathrm{mot}}_X = Z^{\mathrm{mot}}_Y \cdot Z^{\mathrm{mot}}_U$.

### First examples

*Finitely many points.* Let $X = \{p, q\}$ be two points. The coefficient of $t^2$ has two parts. For $\pi = (n_1 = 2)$, the pairs over distinct points of $X$ are the pairs over $(p, q)$ and over $(q, p)$, which $S_2$ identifies, giving $X_{1,p} \times X_{1,q}$. For $\pi = (n_2 = 1)$, we get $X_2 = X_{2,p} \sqcup X_{2,q}$. The coefficient is

$$
[X_{1,p}]\,[X_{1,q}] + [X_{2,p}] + [X_{2,q}],
$$

which is the coefficient of $t^2$ in the ordinary product of the two factors at $p$ and $q$. In general, over a finite set of points the motivic Euler product is the ordinary product.

*Kapranov's zeta function.* Take $X_i = X$ for every $i$, so that every factor is $1 + t + t^2 + \cdots = 1/(1 - t)$. A point of $\operatorname{Conf}^\pi X$ is a set of distinct points, $n_i$ of them labelled $i$. Sending it to $\sum_i i \cdot (\text{points labelled } i)$ gives an effective zero-cycle of degree $n$ whose multiplicities are recorded by $\pi$, and every effective zero-cycle arises from exactly one $\pi$ in exactly one way. So $\operatorname{Sym}^n X$ is cut into locally closed pieces, one for each $\pi$, and $\operatorname{Conf}^\pi X$ maps bijectively onto its piece. In characteristic zero this is enough for the two to have the same class. Therefore $\sum_{\pi \vdash n} [\operatorname{Conf}^\pi X] = [\operatorname{Sym}^n X]$, and

$$
\prod_{x \in X} \frac{1}{1 - t} = Z^{\mathrm{mot}}_X(t).
$$

For $X = \mathbb{A}^1$ and $n = 2$, the two pieces of $\operatorname{Sym}^2 \mathbb{A}^1 \cong \mathbb{A}^2$ are the monic quadratics with distinct roots, $\operatorname{Conf}^{(n_1 = 2)} \mathbb{A}^1$, and those with a double root, $\operatorname{Conf}^{(n_2 = 1)} \mathbb{A}^1 \cong \mathbb{A}^1$. Their classes are $\mathbb{L}^2 - \mathbb{L}$ and $\mathbb{L}$.

*The elliptic curve.* Combining this with the earlier computation,

$$
\prod_{x \in E} \frac{1}{1 - t} = \frac{1 + \bigl([E] - 1 - \mathbb{L}\bigr) t + \mathbb{L} t^2}{(1 - t)(1 - \mathbb{L} t)}.
$$

The left side treats all points of $E$ alike. The group law, Abel's theorem and Riemann–Roch only entered when we evaluated it. The coefficient of $t^2$ is a small check: $\operatorname{Sym}^2 E$ is cut into $\operatorname{Conf}^2 E$, the pairs of distinct points, and the diagonal, a copy of $E$. Since $[\operatorname{Sym}^2 E] = [E](1 + \mathbb{L})$, this gives $[\operatorname{Conf}^2 E] = \mathbb{L}\,[E]$.

*Constant coefficients.* When $X_i = X \times Y_i$, the product is often written as a power,

$$
\prod_{x \in X} \left(1 + [Y_1]\,t + [Y_2]\,t^2 + \cdots\right) = \left(1 + [Y_1]\,t + [Y_2]\,t^2 + \cdots\right)^{[X]}.
$$

This is the *power structure* of Gusein-Zade, Luengo and Melle-Hernández (2004), and Bilu's product generalizes it to coefficients that vary with $x$. In this notation, $Z^{\mathrm{mot}}_X(t) = (1 - t)^{-[X]}$. Over $\mathbb{C}$, applying $\chi_c$ turns the power into an ordinary power with exponent $\chi_c(X)$. For $1/(1 - t)$ this is Macdonald's formula, and the earlier remark that the formula behaves "as if there were $\chi_c(X)$ points" becomes literally true.

*Counting points.* The definition also makes sense over $\mathbb{F}_q$, where degrees come back. An $\mathbb{F}_q$-point of $\operatorname{Conf}^\pi(\mathcal{X})$ is a configuration that the Frobenius maps to itself. Its points fall into Frobenius orbits, which are closed points of $X$. All the points of an orbit carry the same label $i$, and their decorations together form a $\kappa(x)$-point of $X_{i,x}$. A closed point $x$ labelled $i$ contributes $t^{i \deg x}$. So counting points gives

$$
\prod_{x \text{ closed}} \Bigl( 1 + \sum_{i \ge 1} \#X_{i,x}(\kappa(x))\, t^{i \deg x} \Bigr),
$$

an Euler product over closed points in the sense of the previous section. For $X_i = X$ this is $\prod_x 1/(1 - t^{\deg x}) = Z_X(t)$. This is the sense in which the motivic Euler product lifts the classical one.

### Squarefree zero-cycles and configuration spaces

In the squarefree sanity check for words, each Lyndon word could be used at most once, and each factor became $1 + t^{|\ell|}$. The motivic analogue is the product with $X_1 = X$ and $X_i = \emptyset$ for $i \ge 2$, that is, each point is used at most once. Only partitions with all labels equal to $1$ contribute, and $\operatorname{Conf}^\pi X$ is then the *unordered configuration space*

$$
\operatorname{Conf}^n X = (X^n)_* / S_n
$$

of $n$ distinct points of $X$. So

$$
\prod_{x \in X} (1 + t) = \sum_{n \ge 0} [\operatorname{Conf}^n X]\, t^n.
$$

On $\mathbb{A}^1$, $\operatorname{Conf}^n \mathbb{A}^1$ is the space of monic squarefree polynomials of degree $n$, the complement in $\mathbb{A}^n$ of the discriminant hypersurface. Squarefree words have become squarefree polynomials.

We evaluated the product for words using $1 + x = (1 - x^2)/(1 - x)$. The motivic version of this identity has a geometric meaning. Every multiplicity $m \ge 0$ can be written in exactly one way as $m = \varepsilon + 2k$ with $\varepsilon \in \{0, 1\}$. So every effective zero-cycle $D$ can be written in exactly one way as $D = D_1 + 2D_2$, with $D_1$ squarefree and $D_2$ effective. The map

$$
\bigsqcup_{a + 2b = n} \operatorname{Conf}^a X \times \operatorname{Sym}^b X \to \operatorname{Sym}^n X, \qquad (D_1, D_2) \mapsto D_1 + 2D_2,
$$

is therefore a bijection on points, and in characteristic zero this gives $[\operatorname{Sym}^n X] = \sum_{a + 2b = n} [\operatorname{Conf}^a X]\,[\operatorname{Sym}^b X]$. In terms of generating functions, this is a result of Vakil and Wood:

$$
\sum_{n \ge 0} [\operatorname{Conf}^n X]\, t^n = \frac{Z^{\mathrm{mot}}_X(t)}{Z^{\mathrm{mot}}_X(t^2)}, \qquad \text{that is,} \qquad \prod_{x \in X} (1 + t) = \prod_{x \in X} \frac{1 - t^2}{1 - t}.
$$

The same argument with $m = \varepsilon + ak$, $0 \le \varepsilon < a$, shows that the zero-cycles with all multiplicities less than $a$ have generating function $Z^{\mathrm{mot}}_X(t)/Z^{\mathrm{mot}}_X(t^a)$.

*The affine line.* Here $Z^{\mathrm{mot}}_{\mathbb{A}^1}(t) = 1/(1 - \mathbb{L}t)$, so

$$
\sum_{n \ge 0} [\operatorname{Conf}^n \mathbb{A}^1]\, t^n = \frac{1 - \mathbb{L}t^2}{1 - \mathbb{L}t}, \qquad [\operatorname{Conf}^n \mathbb{A}^1] = \mathbb{L}^n - \mathbb{L}^{n-1} \quad (n \ge 2).
$$

This is the formula for squarefree words, with $q$ replaced by $\mathbb{L}$. Over $\mathbb{F}_q$ it says that there are $q^n - q^{n-1}$ monic squarefree polynomials of degree $n$. Over $\mathbb{C}$ it can be compared with topology. Arnold showed that for $n \ge 2$, the rational cohomology of $\operatorname{Conf}^n \mathbb{C}$ is $\mathbb{Q}$ in degree 0 and $\mathbb{Q}$ in degree 1, the latter spanned by the class of $d \log$ of the discriminant, which has Hodge type $(1,1)$. By Poincaré duality, the compactly supported cohomology is one class of type $(n, n)$ in degree $2n$ and one of type $(n-1, n-1)$ in degree $2n - 1$. The Hodge–Deligne polynomial is therefore $(uv)^n - (uv)^{n-1}$, which is $e(\mathbb{L}^n - \mathbb{L}^{n-1})$.

*The elliptic curve.* Expanding $Z^{\mathrm{mot}}_E(t)/Z^{\mathrm{mot}}_E(t^2)$ gives

$$
[\operatorname{Conf}^1 E] = [E], \qquad [\operatorname{Conf}^2 E] = \mathbb{L}\,[E], \qquad [\operatorname{Conf}^3 E] = [E](1 + \mathbb{L} + \mathbb{L}^2) - [E]^2.
$$

The second agrees with the direct computation above. In the third, the product $[E]^2 = [E \times E]$ appears, coming from the zero-cycles $x + 2y$ in $\operatorname{Sym}^3 E$. Over $\mathbb{C}$, applying $\chi_c$ gives $\sum_n \chi_c(\operatorname{Conf}^n X)\, t^n = (1 + t)^{\chi_c(X)}$, which is $1$ for $E$. So $\chi_c(\operatorname{Conf}^n E) = 0$ for every $n \ge 1$, as the formulas confirm.

### How often is a zero-cycle squarefree?

For words, the squarefree ones made up a fraction $1 - 1/q$ of the words of each length $n \ge 2$, and for integers the fraction is $1/\zeta(2) = 6/\pi^2$. Motivically, $[\operatorname{Conf}^n \mathbb{A}^1] = \mathbb{L}^n (1 - \mathbb{L}^{-1})$, so after inverting $\mathbb{L}$ the squarefree polynomials make up a fraction $1 - \mathbb{L}^{-1}$ of all monic polynomials of degree $n$.

The Euler product suggests what to expect for a variety $X$ of dimension $d$. Dividing $\prod_x (1 + t)$ by $\prod_x 1/(1 - t)$ leaves $\prod_x (1 - t^2)$. The symmetric powers grow like $\mathbb{L}^{nd}$, which suggests evaluating at $t = \mathbb{L}^{-d}$. Then each point contributes a factor $1 - \mathbb{L}^{-2d}$, the "probability" that it does not occur twice, independently of the other points, and the product of these factors is $Z^{\mathrm{mot}}_X(\mathbb{L}^{-2d})^{-1}$. This is the analogue of $\prod_p (1 - p^{-2}) = 1/\zeta(2)$.

Vakil and Wood proved that this heuristic is correct. If $X$ is rational of dimension $d$, then the classes $[\operatorname{Sym}^n X]$ are invertible in a suitable completion of $K_0(\mathrm{Var}_k)[\mathbb{L}^{-1}]$, and in that completion

$$
\lim_{n \to \infty} \frac{[\operatorname{Conf}^n X]}{[\operatorname{Sym}^n X]} = \frac{1}{Z^{\mathrm{mot}}_X(\mathbb{L}^{-2d})}.
$$

For $X = \mathbb{A}^1$, $Z^{\mathrm{mot}}_{\mathbb{A}^1}(\mathbb{L}^{-2}) = 1/(1 - \mathbb{L}^{-1})$, so the limit is $1 - \mathbb{L}^{-1}$, as computed above. More generally, the fraction of zero-cycles with all multiplicities less than $a$ tends to $Z^{\mathrm{mot}}_X(\mathbb{L}^{-ad})^{-1}$, the analogue of the density $1/\zeta(a)$ of $a$-th-power-free integers.
