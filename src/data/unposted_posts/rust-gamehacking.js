export default `---
title: Why Rust Excells in Gamehacking
date: 2026-03-23
slug: rust-gamehacking
excerpt: A short overview of why you should learn Rust by hacking games.
tags: [rust,gamehacking]
---

# Starting Off
I don't condone cheating in online multiplayer games; it ruins the experience for other players and it's something I really hate seeing, especially in games I love. But...

## Hacking is... fun?
To clarify, tearing apart game binaries and looking at the underlying [[frameworks | engines like Unreal and Unity]] that make up games, and exploiting that code to make the game bend to your will is the fun part. I never would've developed the interest in reverse engineering and low level programming if I never tried to break into games and make them do what I want.

I also credit hacking with furthering my love of Rust versus other languages like C++. Right now, there's basically no people that work on hacking whilst using Rust as their main language; which really confuses me honestly.

I see people complaining about build systems with C++, tooling, deadlocks and memory leaks, and I can't help but think to myself - "have you tried using Rust?".

Now, there are some valid arguments against Rust, but I keep finding that basically none of these problems are problems inherent to Rust:
* Windows interop (specifically kernel drivers)? A problem with how Windows builds with the WDK - look at how easy it is to write Linux drivers in Rust vs C.
* Zealous usage of unsafe for external interop? I've written <200 lines of unsafe Rust in the entire time I've reverse engineered games. People love to quote this as an argument against Rust without truly understanding what unsafe means in Rust - but that's a topic for another blog post.
`;
