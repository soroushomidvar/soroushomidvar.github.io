---
title: Concepts
order: 2
aliases: [concept, concepts, definition, terminology, background, what is]
sections:
  joinability:
    aliases: [joinable, joinability, equi-join, join, foreign key, linking tables, merge tables]
  transformations:
    aliases: [syntactic transformation, string transformation, rewrite, format, normalize, canonical]
  example-driven:
    aliases: [example driven, examples, by example, programming by example, few examples, flashfill, autojoin]
  imputation:
    aliases: [imputation, impute, missing data, missing value, incomplete, null, blank cell]
  dependencies:
    aliases: [functional dependency, dependency, approximate dependency, correlation, determines]
  llms:
    aliases: [llm, large language model, gpt, language model, generative ai, rag, prompt, hallucination]
  explainability:
    aliases: [explainable, explainability, interpretable, transparency, trust, why, attribution]
---

Short definitions of the ideas that come up in Soroush's work, for readers outside data management.

## Joinability {#joinability}

Joining two tables means lining up their rows by matching a column in one against a column in the other. It works when the values match exactly — an equi-join.

In practice they usually do not. One source writes a person's full name, another writes their email address; one writes "5551234567", another writes "(555) 123-4567". The columns refer to the same entities, so the tables ought to be joinable, but no exact match exists between the values.

This is not a schema problem. The column names may line up perfectly. The mismatch is inside the values, which is why schema matching does not solve it.

## Syntactic transformations {#transformations}

A syntactic transformation is a rule that rewrites the values of one column into the format of another, using nothing but string operations: take a substring, split on a character and keep a piece, append a constant.

They are deliberately shallow. A transformation does not know what a name or a phone number is; it only knows how to cut and paste characters. That is a limitation, but it is also why the rules can be inferred automatically, checked against examples, and read by a person afterwards.

If two columns are not equi-joinable but a transformation makes them so, the columns are joinable under that transformation, and the transformation itself doubles as the explanation of how the two sources relate.

## Example-driven wrangling {#example-driven}

Example-driven means the system is given a handful of input-output pairs — this value in the left column corresponds to that value in the right one — and infers the general rule from them, instead of being programmed with it.

It is the same idea behind spreadsheet features that guess a column's fill pattern from the first few entries. The research question is what happens at scale: the space of rules consistent with a few examples is vast, most of them are coincidences that fit the examples and nothing else, and searching that space gets expensive as tables grow.

Soroush's work addresses both halves of that: which rules to prefer once you have found them, and how to avoid searching the whole space in the first place.

## Data imputation {#imputation}

Imputation is filling in missing values in a dataset by inferring them from the data that is present. Classical approaches use statistics — a column mean, a value copied from the nearest similar row — or learn a model per column.

Text-rich tables make this harder. The evidence that would determine a missing value is not in a tidy numeric column; it is buried inside long, noisy free-text fields, and the relationship is implicit rather than declared. Language models are good at reading that kind of evidence, which is why recent work applies them here, but a model can only use what it is shown, and showing it an entire table is both expensive and counterproductive.

## Dependencies between columns {#dependencies}

A functional dependency says that one column determines another: if two rows agree on the postal code, they must agree on the city. Dependencies are what tell an imputation method which columns are worth consulting.

Strict dependencies rarely survive contact with real data. A single typo, an inconsistent format, or one genuine exception breaks the rule outright, even though the underlying relationship clearly holds. Approximate variants relax the requirement so that a relationship counts if it holds often enough, rather than always.

Soroush's LDI work relaxes it further still, looking for the signal at the level of substrings inside values rather than whole values, so that differently formatted versions of the same thing still count as evidence.

## Language models in data systems {#llms}

Language models are useful in data management because so many of its hard cases come down to reading text with context: deciding whether two differently written records describe the same thing, or guessing what belongs in a blank.

The catch is that a model asked to produce a data value will produce one whether or not it has grounds to. The engineering problem is therefore less about the model and more about what goes into the prompt: give it too little and it guesses, give it too much and the relevant evidence drowns, and in both cases you cannot tell afterwards which part of the input the answer rested on.

This is the concern running through LDI, and it is the same reason the assistant on this site retrieves specific passages and cites them rather than answering from memory.

## Explainability {#explainability}

In this line of work explainability is not a separate module bolted on after the fact. It falls out of the representation.

A transformation is a short sequence of string operations, so it can simply be read. A selected attribute comes with the pattern that made it look relevant. A retrieved row is itself the evidence for a prediction. In each case the artifact that does the work is also the artifact that explains it — which is why the papers push toward fewer and simpler rules rather than more accurate but opaque ones.
