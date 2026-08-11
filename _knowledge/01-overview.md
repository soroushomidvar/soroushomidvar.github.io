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
    aliases: [data wrangling, wrangling, data preparation, data cleaning, etl, integration, why, tasks, areas, topics]
  llms-and-retrieval:
    aliases:
      [
        llm,
        llms,
        large language model,
        language models,
        rag,
        retrieval augmented generation,
        retrieval,
        embeddings,
        vector search,
        in-context learning,
        few-shot,
        prompting,
        gpt,
        generative ai,
      ]
  reading:
    aliases: [where to start, which paper, read first, reading order, recommend]
---

## Who he is {#who}

Soroush Omidvartehrani is a Ph.D. candidate in Computing Science at the University of Alberta, advised by Dr. Davood Rafiei in the Data and Language Intelligence (DaLI) Lab. He works on example-driven data wrangling: getting messy, real-world tables into a usable state without a human writing the rules by hand.

Across his papers that covers six tasks: data transformation, data imputation, error detection, schema matching, entity matching, and anomaly detection. He increasingly approaches them with large language models and retrieval — retrieval-augmented generation, in-context learning, and the question of which few examples are worth putting in front of a model.

His stated research interests are LLM-based data systems, data wrangling, and applied machine learning. Alongside the Ph.D. he works as a Data Scientist at Data on Motion Inc. in Toronto.

## Research direction {#agenda}

The thread running through Soroush's work is a zoom-in, zoom-out approach to data wrangling. Zoom in on a small number of informative examples that carry enough signal for the task; zoom out to generalize the pattern learned from them and apply it across the rest of the data.

That framing shows up concretely in each of his papers. GXJoin zooms out, taking transformations learned from specific example pairs and generalizing them so that one rule covers many rows instead of one. WebTableX zooms in, choosing which handful of rows to learn from in the first place so the search never has to look at the whole table. LDI does both for missing values, narrowing down to the few attributes and tuples that actually bear on a particular blank cell before asking a language model to fill it. EdgeLM, the most recent, sharpens the zooming-in criterion itself: the examples worth showing a model are not the ones most similar to the case at hand, but the ones that reveal where the hard distinctions lie.

The practical goal in every case is the same: fewer, simpler, more explainable rules, produced faster, that a person can inspect and trust.

The tasks this has been applied to are data transformation, data imputation, error detection, schema matching, entity matching, and anomaly detection. The first two are where the methods were developed; EdgeLM evaluates across all but transformation, treating them as one family of table-centric prediction problems rather than six unrelated engineering problems.

## Language models and retrieval {#llms-and-retrieval}

The later work runs on large language models, and the interesting part is never the model itself — it is what gets retrieved and put in front of it.

LDI is retrieval-augmented imputation: for each missing value it selects the relevant attributes, retrieves a handful of similar rows as few-shot examples, and asks the model to fill the blank. Retrieval is by longest common substring rather than embeddings, deliberately — the paper argues that embedding similarity misses the fine-grained lexical patterns that matter in long, noisy text, where an area code or a repeated prefix is the actual evidence.

EdgeLM is a retrieval framework in its own right, for in-context learning. Standard retrieval-augmented prompting fetches whatever is most similar to the query; EdgeLM's argument is that similarity retrieves agreement rather than information, and that what a model needs are examples near the decision boundary and examples it has previously got wrong.

The earlier work uses no language models at all. GXJoin and WebTableX are algorithmic — string transformations inferred from examples, searched and generalized directly. That progression, from inferring explicit rules to choosing what evidence a model sees, is the arc of the research.

## Why data wrangling {#wrangling}

The same real-world entity gets described differently by every source that records it. One table stores "Davood Rafiei", another stores "drafiei@ualberta.ca", a third stores "Rafiei, D." Two columns that refer to the same things cannot be joined directly, and no amount of schema matching fixes it, because the mismatch is inside the values rather than between the column names.

Traditionally, someone writes the string-munging rules by hand, per dataset. That does not scale, and the rules are invisible to anyone who did not write them. Soroush's work replaces that with methods that infer transformations from a few example pairs, generalize them, and can explain what they did and why.

The same problem appears with missing values in text-rich tables, where the information needed to fill a blank is buried in long, noisy text fields elsewhere in the table rather than in a clean, declared dependency.

## Where to start reading {#reading}

Start with EdgeLM. It is the newest, the most general, and the best single entry point to the current direction: rather than treating one wrangling operation, it asks which examples are worth putting in front of a language model at all, and evaluates that across five tasks, fifteen datasets and five models. The preprint is freely available on arXiv.

LDI is the natural second read. It applies the same instinct to one problem in depth — assembling a small, targeted context for each missing value — and is where the localized-context idea is worked out most fully. Its preprint is on arXiv too.

GXJoin is the one to read for the foundations. It is the most self-contained and the most thoroughly evaluated of the four, and it sets out the transformation language and the generalization ideas the earlier line of work is built on. It uses no language model, which makes the contrast with EdgeLM and LDI the clearest way to see how the research has moved.

WebTableX is a short follow-up to GXJoin, worth reading straight afterwards: it makes the same pipeline one to two orders of magnitude faster by sampling rows before the search begins.
