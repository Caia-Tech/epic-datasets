---
title: "Build Like Your Life Depends On It: Why Linus Torvalds Built Diving Software"
description: "The man who powers 100% of supercomputers built scuba software. Not for market fit. Not for best practices. For survival. Here's why building for yourself changes everything."
pubDate: 2025-08-17T12:00:00Z
author: "Marvin Tutt"
tags: ["philosophy", "open-source", "linus-torvalds", "software-engineering"]
image: "/images/subsurface-hero.jpg"
featured: true
---

Linus Torvalds is one of my heroes. And he's criminally underappreciated.

This man's code powers 100% of the world's supercomputers. 71% of all smartphones. 96.3% of the top million websites. The International Space Station. The Large Hadron Collider. Your smart TV, your router, probably your refrigerator too.

Yet most people don't even know his name.

But here's what really makes him a hero to me: He doesn't build what the market wants. He doesn't follow best practices. He doesn't care about industry standards.

He builds exactly what HE needs.

Case in point: In 2011, he built scuba diving software.

Yes, really.

## "Wait, Why Do Divers Need Software?"

When I first learned about Subsurface, my reaction was: "What? Why would anyone need SOFTWARE for swimming?"

I mean, humans have been diving for thousands of years. Throw on some gear, hold your breath, go underwater. What's there to compute?

Then I learned what actually happens when you dive deep.

At 30 meters underwater, the pressure is 4 times what it is on the surface. Every breath you take forces nitrogen into your blood and tissues at an accelerated rate. Your body becomes a chemistry experiment in real-time.

Come up too fast? That nitrogen forms bubbles in your blood. The bends. Paralysis. Death.

Stay down too long? Your air runs out. Or worse, oxygen becomes toxic at depth. Seizures. Death.

Wrong gas mixture? Nitrogen narcosis - you're literally drunk from breathing. Bad decisions. Death.

Your dive computer isn't a fancy gadget. It's running algorithms that determine if you live or die. It's calculating tissue compartment saturation across 16 different theoretical tissue types, each with different nitrogen absorption rates. It's tracking your ascent rate to the centimeter per second. It's modeling decompression stops based on modified Bühlmann algorithms with gradient factors.

Divers aren't just swimming. They're executing life-critical algorithms underwater.

## The Problem That Pissed Linus Off

So diving requires software. Fine. But here's where it gets stupid.

Every dive computer manufacturer had their own proprietary software:
- Suunto? Windows-only, $200 extra
- Mares? Different Windows-only app, another $150
- Shearwater? Mac support, but $300 and crashes constantly

You just spent $500-800 on a dive computer that's keeping you alive, and now you can't even access YOUR data from YOUR dives without their blessed software.

Can't export to analyze your air consumption. Can't verify the decompression calculations. Can't combine data from different computers. Can't backup your logs properly.

It's vendor lock-in... for not dying.

Imagine if Git only worked with Microsoft keyboards. Or if Linux only ran on IBM hardware. That's the level of absurdity we're talking about.

## The Linus Solution: Forget Your Standards

Now, most people would approach this problem "properly":
1. Research the dive software market
2. Interview users for requirements
3. Follow industry UI standards
4. Build what everyone expects

Linus did none of that.

He had a specific problem: "I want MY dive data in MY format on MY computer running MY operating system."

So he built EXACTLY that.

Subsurface wasn't designed for "the diving community." It was designed for Linus Torvalds, a Finnish-American programmer who happens to dive.

No market research. No user personas. No best practices.

Just one frustrated programmer who wanted his dive data.

## Why This Matters More Than You Think

Here's the pattern across everything Linus has built:

**Linux (1991)**: "I'm doing a (free) operating system (just a hobby, won't be big and professional like gnu) for 386(486) AT clones."
- Not for the market. For his personal computer.

**Git (2005)**: Created in 10 days because BitKeeper frustrated him.
- Not for the industry. For the Linux kernel team.

**Subsurface (2011)**: "I needed my dive logs."
- Not for divers. For himself.

Notice what's missing? Product-market fit. User research. Industry standards. Best practices.

Notice what's present? A specific person with a specific problem building a specific solution.

And guess what? Linux runs the world. Git is how all software is built. Subsurface is now the de facto standard for serious divers.

## The Myth of Best Practices Is Killing Your Software

We're taught to build software "the right way":
- Follow established patterns
- Research your users
- Implement industry standards
- Build for the general case

But best practices are just average solutions for average problems. And your problem isn't average.

YOUR workflow isn't what some committee decided. YOUR pain points aren't in their user stories. YOUR specific need gets abstracted away in the general solution.

When you build for everyone, you build for no one.

When you build for yourself, you build something that at least one person actually needs.

## Build Like YOUR Life Depends On It

Think about the tools that actually changed the world:

**Ruby on Rails**: DHH built it to make Basecamp faster. Not for "web developers." For himself.

**Dropbox**: Drew Houston kept forgetting his USB drive. Not building for "file sharing market." Solving his problem.

**Vue.js**: Evan You thought Angular was too complex for his projects. Not "disrupting frameworks." Making his life easier.

**Homebrew**: Max Howell was sick of MacPorts. Not "revolutionizing package management." Just wanted to install software without pain.

None of them followed best practices. All of them solved personal problems.

And that's the secret: The best software comes from selfish builders.

## My Caia Tech Philosophy

Every tool on Caia Tech started the same way: "I'm sick of this."

Not market research. Personal frustration.
Not best practices. My practices.
Not for everyone. For me.

And here's the kicker - when you build something that truly solves YOUR problem, you usually find thousands of others drowning in the same water.

They don't need another generic solution. They need YOUR specific fix to THIS specific problem.

## The Underappreciation Problem

You know what frustrates me? Linus powers the entire digital world and most people can't even pronounce his name correctly.

Meanwhile, some founder makes a to-do app that loses money for 10 years and gets celebrated as a "visionary."

Building for yourself isn't sexy. There's no TED talk about "solving your own problems." VCs don't fund "I built this for me." Tech Twitter doesn't viral-share personal tools.

But while everyone's chasing the next AI hype cycle, builders like Linus quietly create the infrastructure that actually runs the world.

No fanfare. No recognition. Just tools that work.

Because they were built by someone whose life (literal or professional) depended on them working.

## Your Turn: Find Your 30 Meters

Stop right now and think:
- What makes you say "this is ridiculous" every day?
- What manual process is killing your soul?
- What workaround have you done 100 times?
- What tool makes you want to throw your laptop out the window?

That's your 30 meters. That's where you build.

Don't research if others need it. (They do.)
Don't check if there's a market. (There is.)
Don't follow best practices. (They're not best for you.)

Build YOUR solution to YOUR problem.

Make it work for YOU first.

## The Recipe for Selfish Software

1. **Identify YOUR specific pain**
   - Not "developers need better tools"
   - "I need THIS specific thing to work THIS specific way"

2. **Build YOUR specific solution**
   - Not "following React best practices"
   - "Works exactly how I want it"

3. **Ignore everyone else (at first)**
   - Not "user feedback from beta testers"
   - "Does this fix MY problem?"

4. **Share it when it works for you**
   - Not "product launch"
   - "Here's what I built for myself, might help you too"

## Build Like Your Life Depends On It

Because honestly? It probably does.

Maybe not literally like Linus at 30 meters underwater. But professionally, creatively, mentally - we're all drowning in broken tools and bad software.

The world doesn't need another best practice.
It doesn't need another design pattern.
It doesn't need another framework that does what the last five did.

It needs YOUR solution to YOUR problem.

Be selfish. Be specific. Be like Linus.

When I started writing this, I had no idea divers needed software. Just like you might not realize what tools YOU need until you stop accepting the broken ones.

Linus didn't wait for someone else to fix his diving software problem. He didn't form a committee. He didn't ask for permission.

He built like his life depended on it.

What will you build?

---

*What's YOUR Subsurface? What tool would change your survival odds? Tell me what you're building like your life depends on it: owner@caiatech.com*

*Check out the tools I built for myself at [Caia Tech](https://caiatech.com/tools). Not best practices. Just solutions that work.*