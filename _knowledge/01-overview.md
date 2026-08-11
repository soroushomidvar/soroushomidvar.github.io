---
title: Overview
order: 1
aliases: [soroush, omidvartehrani, who, phd, thesis, research, overview, about]
url: /
url_label: Home
sections:
  who:
    # Always in context. Without it, a question like "what does he work on?"
    # retrieves one specific paper and the answer loses the wider thread.
    pin: true
    aliases: [who is, introduction, bio, about him, phd student, candidate]
  agenda:
    aliases: [research direction, thesis, dissertation, agenda, focus, interests, what does he work on, zoom in, zoom out]
  wrangling:
    aliases: [data wrangling, wrangling, data preparation, data cleaning, etl, integration, why]
  reading:
    aliases: [where to start, which paper, read first, reading order, recommend]
---

## Who he is {#who}

Soroush Omidvartehrani is a Ph.D. candidate in Computing Science at the University of Alberta, advised by Dr. Davood Rafiei in the Data and Language Intelligence (DaLI) Lab. He works on example-driven data wrangling: getting messy, real-world tables into a usable state without a human writing the rules by hand.

His stated research interests are LLM-based data systems, data wrangling, and applied machine learning. Alongside the Ph.D. he works as a Data Scientist at Data on Motion Inc. in Toronto.

## Research direction {#agenda}

The thread running through Soroush's work is a zoom-in, zoom-out approach to data wrangling. Zoom in on a small number of informative examples that carry enough signal for the task; zoom out to generalize the pattern learned from them and apply it across the rest of the data.

That framing shows up concretely in each of his papers. GXJoin zooms out, taking transformations learned from specific example pairs and generalizing them so that one rule covers many rows instead of one. WebTableX zooms in, choosing which handful of rows to learn from in the first place so the search never has to look at the whole table. LDI does both for missing values, narrowing down to the few attributes and tuples that actually bear on a particular blank cell before asking a language model to fill it. EdgeLM, the most recent, sharpens the zooming-in criterion itself: the examples worth showing a model are not the ones most similar to the case at hand, but the ones that reveal where the hard distinctions lie.

The practical goal in every case is the same: fewer, simpler, more explainable rules, produced faster, that a person can inspect and trust.

## Why data wrangling {#wrangling}

The same real-world entity gets described differently by every source that records it. One table stores "Davood Rafiei", another stores "drafiei@ualberta.ca", a third stores "Rafiei, D." Two columns that refer to the same things cannot be joined directly, and no amount of schema matching fixes it, because the mismatch is inside the values rather than between the column names.

Traditionally, someone writes the string-munging rules by hand, per dataset. That does not scale, and the rules are invisible to anyone who did not write them. Soroush's work replaces that with methods that infer transformations from a few example pairs, generalize them, and can explain what they did and why.

The same problem appears with missing values in text-rich tables, where the information needed to fill a blank is buried in long, noisy text fields elsewhere in the table rather than in a clean, declared dependency.

## Where to start reading {#reading}

For a first read, GXJoin is the most self-contained and the most thoroughly evaluated: it sets out the transformation language and the generalization ideas the later work builds on, and its preprint is freely available.

WebTableX is best read second, as a short follow-up that makes the same pipeline dramatically faster by sampling rows before the search begins.

LDI is the one to read for the current direction: it moves from string transformations to LLM-driven imputation and is where the localized-context idea is developed most fully. Its preprint is on arXiv.

EdgeLM is the newest, posted as a preprint in August 2026, and the most general: it is about which examples to put in front of a language model for table tasks at all, rather than about one wrangling operation.
