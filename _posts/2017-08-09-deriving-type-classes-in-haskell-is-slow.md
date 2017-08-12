---
title: Deriving type classes in Haskell is slow
---

Have you ever wondered how long it takes to derive type classes in Haskell?
Wonder no more! I wrote an extensive benchmark that derives a variety of
common type classes and ran it against many versions of GHC. The takeaway?
Deriving type classes in Haskell is slow.

## Data types

Before I get into just how slow, I'll explain the benchmark I created. Since
I'm focusing on deriving type classes, it made sense to have a lot of different
data types. Rather than come up with them from scratch, I extracted them from
[Rattletrap][], my Rocket League replay parser/generator. I ended up with 54
data types in a single module.

Of those 54 types, 40 of them are records. They can have up to 11 fields, but
most of them only have a few. The `Mark` data type is a representative example:

``` haskell
data Mark
  = Mark { frame :: Word, value :: String }
```

Of the 14 remaining types, 10 are wrappers. Each has a single named field. For
example, an `UpdatedReplication` wraps a list of attributes:

``` haskell
newtype UpdatedReplication
  = UpdatedReplication { attributes :: [Attribute] }
```

The last 4 types are enumerations. The largest of these has 29 constructors,
but the others, like `RemoteId`, are pretty small:

``` haskell
data RemoteId
  = SplitscreenId Word
  | PlayStationId String [Word]
  | XboxId Word
  | SteamId Word
```

So that's what the data types look like. I hope you'll agree that they cover
the cases you're likely to find in the wild. They should, since they were taken
from a real Haskell program!

## Type classes

Now that you've seen the data types, let's see what the type classes look like.
Originally I wrote a bunch of modules where each one derived a different set of
type classes. That was hard to maintain, so I turned to the [C preprocessor][]
instead.

Its ability to expand macros makes it easy to derive different type classes. By
putting a `CLASSES` token in the `deriving` list, we can control the list of
classes that are derived at compile time. For example, consider this simple
module:

``` haskell
{-# LANGUAGE CPP #-}
module M where
data T = C deriving (CLASSES)
```

By setting `CLASSES` to an empty string, we can avoid deriving any classes at
all. CPP identifiers are set with GHC's `-D` option. So if we compiled this
with `ghc -D CLASSES=''`, we would effectively end up compiling a module that
looked like this:

``` haskell
-- ghc -D CLASSES=''
module M where
data T = C deriving ()
```

Similarly, we could set `CLASSES` to the comma-separated list of type classes
we want to derive:

``` haskell
-- ghc -D CLASSES='Eq, Ord, Read, Show'
module M where
data T = C deriving (Eq, Ord, Read, Show)
```

CPP is generally annoying to work with, but in this case it works well and does
what we want.

## GHC versions

I wanted to test with as many versions of GHC as I could get my hands on.
Fortunately Herbert Riedel's [GHC PPA][] includes 8.2.1, the latest version,
all the way back to 7.0.1, which was released in November 2010! It makes
installing GHC as easy as:

``` shell
$ add-apt-repository ppa:hvr/ghc
$ apt-get update
$ apt-get install ghc-8.2.1
```

## Benchmark

Now that we've got a bunch of data types, a way to dynamically change the list
of type classes to derive, and a slew of GHC versions, we can put it all
together into a single benchmark. I'm going to use Gabriel Gonzalez's [Bench][]
tool to handle timing the commands and recording the results.

For starters, we can compile our module with no type classes on the latest GHC
to get a baseline. The `-fforce-recomp` flag forces GHC to recompile the module
even though it hasn't changed between runs:

``` shell
$ bench 'ghc-8.2.1 -D CLASSES="" -fforce-recomp Deriving.hs'
```

After that we can derive all the type classes in `base` (except `Bounded` and
`Enum`):

``` shell
$ bench 'ghc-8.2.1 -D CLASSES="Data, Eq, Ord, Read, Show, Typeable" -fforce-recomp Deriving.hs'
```

And finally we can run the same commands with different versions of GHC to see
how they compare:

``` shell
$ bench \
  'ghc-7.0.1 -D CLASSES="" -fforce-recomp Deriving.hs' \
  'ghc-7.0.1 -D CLASSES="Data, Eq, Ord, Read, Show, Typeable" -fforce-recomp Deriving.hs'
```

The [complete benchmark][] runs through a lot more cases than this, but the
basic idea remains the same.

## Results

I ran these benchmarks on my machine and put the results in [a ZIP archive][],
which includes raw, plain text, CSV, and JSON formats.

And now, the moment you've been waiting for! For GHC 8.2.1, deriving all the
`base` type classes is *12 times slower* than deriving none of them.

[![deriving performance][]][deriving performance]

Type classes            | Build time (ms)
---                     | ---
none                    | 326
`Typeable`              | 332
`Eq`                    | 597
`Show`                  | 982
`Ord` (and `Eq`)        | 1153
`Data` (and `Typeable`) | 1380
`Read`                  | 1449
all                     | 3882

The good news is that GHC 8.2.1 is *1.2 times faster* than 8.0.2, which was the
slowest release I tested. In fact, GHC 8.2.1 is as fast as 7.8.4, which was the
fastest release I tested.

[![GHC performance][]][GHC performance]

GHC version | Build time (ms)
---         | ---
7.0.4       | 4233
7.2.2       | 4217
7.4.2       | 4090
7.6.3       | 4508
7.8.4       | 3840
7.10.3      | 4489
8.0.2       | 4643
8.2.1       | 3882

In conclusion, deriving type classes in Haskell is slow, but it's getting
better. If you want to help out, I recommend running my benchmark yourself to
validate the results. Also see the [deriving instances section][] of the
compiler performance page on the GHC wiki.

[Rattletrap]: {% post_url 2016-11-15-parse-and-generate-rocket-league-replays-with-haskell %}
[C preprocessor]: https://downloads.haskell.org/~ghc/8.2.1/docs/html/users_guide/phases.html#options-affecting-the-c-pre-processor
[GHC PPA]: https://launchpad.net/~hvr/+archive/ubuntu/ghc
[Bench]: https://github.com/Gabriel439/bench
[complete benchmark]: https://gist.github.com/tfausak/0c90ed1b450ae84136c110f026e16bc6/399b4c7669a4ea9bb585fa1169b53ebe00f3e204
[a ZIP archive]: https://github.com/tfausak/tfausak.github.io/files/1174893/report.zip
[deriving performance]: /static/images/2017/08/09/deriving-performance.svg
[GHC performance]: /static/images/2017/08/09/ghc-performance.svg
[deriving instances section]: https://ghc.haskell.org/trac/ghc/wiki/Performance/Compiler?version=34#Derivinginstances
