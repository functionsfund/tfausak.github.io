---
title: Frege, a JVM Haskell
---

Recently I have been [working with Clojure][1]. That got me interested in other
JVM languages. Since I love Haskell, naturally I looked at [Frege][2]. It is
known as *a* Haskell for the JVM. By and large I enjoyed it, and wanted to
share my thoughts.

## High level thoughts

My first question was how to pronounce the name. It is named after [Gottlob
Frege][3], so you pronounce it "free-guh", like his name.

With that settled, my next question was which build tool to use. The JVM has a
lot to choose from. I went with [Leiningen][4] ("line-ing-in") because I used
it with Clojure. Frege also works with Maven and Gradle.

That was enough to get going, so I made an example project called
[fregexample][5]. It does not do much, but it builds and has tests and all
that. So it makes for a good starting point.

To really cut my teeth on Frege, I decided to port [hs2048][6] from Haskell to
it. It was mostly painless. I spent less than an hour creating [fr2048][7].
Only a few things had to change, and the compiler pointed out all the problems.

After that I took a look at how Frege interoperates with Java. That is one of
the main benefits of using the JVM, after all. I ended up with [this Gist][8],
which wraps Java's `HashSet`. The interop is about as good as it can be, but it
highlights the mutability of Java.

All that leads me to think that Frege is an interesting and well-executed idea
that ends up being less useful than you might think. Wrapping mutable Java
stuff in Frege means that everything will end up in an ST monad, which is
almost always IO. That means that using Java's `HashSet` will force anything
that uses that to be in the IO monad itself. So there goes purity and
referential transparency, which are some of the best parts of Haskell in the
first place.

That being said, Frege is a perfectly fine Haskell for the JVM. Some things are
better and some are worse. They maintain [a wiki page about differences][9],
but I want to highlight some of them here.

## Low level differences

Records are so, so much better. In Haskell, you have to [use lenses][10] to
keep your sanity with records. In Frege, the language has a reasonable way of
dealing with them. Every data type defines a namespace, so you can have fields
on different types with the same name. Plus reading, writing, and updating
fields is easy.

``` haskell
data Athlete = Athlete { name :: String }
data Club = Club { name :: Maybe String }

athlete1 = Athlete { name = "" }
club1 = Club { name = Nothing }

athlete2 = athlete1.{ name = "Taylor Fausak" }
club2 = club1.{ name = Just "Fixed Touring" }

athlete3 = athlete2.{ name <- (++ "!") }
club3 = club2.{ name <- fmap (++ "!") }
```

Imports are also a lot better. By default imports are qualified by the last
part of the module name. Qualified imports don't require the `qualified`
keyword. And you can do qualified and unqualified on the same line.

``` haskell
import an.example.Set (Set)
-- In Haskell:
--   import An.Example.Set (Set)
--   import qualified An.Example.Set as Set
```

Access control is handled with `private` modifiers instead of an export list. I
like this a lot better. It puts the information closer to where you need it.

``` haskell
private f :: a -> a
private f x = x
```

A bevy of other things are worse or just different. They are not very
substantial, so I will just rattle them off here:

- The differences between Haskell's and Frege's preludes are annoying. For
  instance, Haskell's includes `floor` and `ceiling`. In Frege, those functions
  are in `Prelude.Math`.

- The syntaxes are a little different. For instance, Frege does not have
  `deriving` clauses. Instead you must `derive`, which is a lot like
  `instance`.

- Although the standard library is almost the same, `read` is sorely missing in
  Frege.

- Strings in Frege are Java strings, not lists of characters. Converting
  between them is easy, but it takes another function call. If you've ever used
  `Text` in Haskell, you should already be familiar with this. (In fact, it
  seems like Java's strings should be represented as `Text` in Frege.)

- String escape sequences in Frege are the same as Java, which is different
  than Haskell. For instance, `"\ESC"` in Haskell is `"\u001b"` in Frege.

- Lambdas with multiple arguments have a stranger syntax in Frege. They require
  a backslash before each argument. For example, `\x \y -> (x, y)`.

- Pattern matching with `@` requires an extra set of parentheses. So you have
  to do `f (x@(y : ys))` instead of just `f x@(y : ys)`.

- Frege has basically no libraries. I could not find any hosted on either
  Clojars or Maven Central.

- Frege has no package site like Hackage. This is not surprising, considering
  the previous point.

Even though there are a few annoyances, I enjoyed using Frege. I liked working
with a Haskell that was easier to install and didn't suffer from Cabal hell.
However, I think that Scala is a better choice, since Frege is such a niche
language.

[1]: {% post_url 2015-05-28-clojures-threading-macros %}
[2]: https://github.com/Frege/frege
[3]: https://en.wikipedia.org/wiki/Gottlob_Frege
[4]: http://leiningen.org
[5]: https://github.com/tfausak/fregexample
[6]: https://github.com/tfausak/hs2048
[7]: https://github.com/tfausak/fr2048
[8]: https://gist.github.com/tfausak/c7c88bcc08006a1190ca
[9]: https://github.com/Frege/frege/wiki/Differences-between-Frege-and-Haskell
[10]: {% post_url 2014-08-03-lenses-from-the-ground-up %}
