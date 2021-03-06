---
title: 'Neon: An alternative PureScript prelude'
---

I am proud to announce [Neon][1], an alternative prelude (standard library) for
PureScript. If you haven't heard of PureScript, it's a language like Haskell
that compiles to JavaScript. To learn more about it, check out my [Better know
a language: PureScript][2] presentation.

Why make a standard library? Two reasons:

1.  It takes a lot of imports to do anything useful in PureScript. This can be
    fixed in other ways, such as creating a "batteries included" prelude that
    pulls in the most useful packages. (That's exactly what my [Batteries][3]
    library does.) Unfortunately many packages don't work well with this
    approach since they require qualified imports to avoid collisions. For
    example, look at how many packages define [`singleton`][4]. You can't have
    all those in one namespace.

2.  PureScript (and Haskell) can be hard to read. You often have to read
    expressions from the inside out to really understand what they do. In
    extreme cases, you have to read lines both [forwards and backwards at the
    same time][5]. Operators like `$` and `<<<` sometimes help, but
    they can be hard to understand if you're not already familiar with them.

I think Neon fixes both of those problems. To get a feel for what it looks
like, let's solve [problem 1 on Project Euler][8] with both Neon and the
traditional prelude. Here is a solution using Neon:

``` haskell
import Neon

main :: Eff (console :: CONSOLE) Unit
main = 1
  :upTo 999
  :filter (divisibleBy 3 || divisibleBy 5)
  :sum
  :print
```

And for comparison, here is the same solution without Neon:

``` haskell
import Control.Monad.Eff (Eff)
import Control.Monad.Eff.Console (CONSOLE, print)
import Data.Array (filter, (..))
import Data.Foldable (sum)
import Prelude

main :: Eff (console :: CONSOLE) Unit
main
  = print
  <<< sum
  <<< filter (\ n -> n `mod` 3 == 0 || n `mod` 5 == 0)
  $ 1 .. 999
```

I much prefer reading and writing the Neon version. The whole thing reads from
left to right and top to bottom. It only uses two operators, `:` and `||`. And
of course it only has one import.

[1]: https://github.com/tfausak/purescript-neon
[2]: {% post_url 2015-10-22-better-know-a-language-purescript %}
[3]: https://github.com/tfausak/purescript-batteries
[4]: https://pursuit.purescript.org/search?q=singleton
[5]: https://www.reddit.com/r/haskell/comments/2o4lrk/lets_build_a_browser_engine_in_haskell_not_a_blog/cmk3x06?context=3
[8]: https://projecteuler.net/problem=1
