---
title: Publications
order: 3
aliases: [paper, papers, publication, publications, published, work, article]
url: https://scholar.google.com/citations?hl=en&user=Nv4Sc0QAAAAJ&view_op=list_works&sortby=pubdate
url_label: Google Scholar
sections:
  edgelm:
    aliases:
      [edgelm, edge evidence, demonstration, demonstrations, in-context learning, icl, few-shot, retrieval, decision boundary, newest, latest, recent]
    url: https://arxiv.org/abs/2608.04390
    url_label: "EdgeLM — arXiv:2608.04390"
  ldi:
    aliases: [ldi, imputation, imputing, missing value, missing values, blank, null, text-rich, localized, llm imputation]
    url: https://arxiv.org/abs/2506.16616
    url_label: "LDI — arXiv:2506.16616"
  webtablex:
    aliases: [webtablex, web table, sampling, clustering, runtime, speed, faster, efficiency]
    url: https://doi.org/10.1145/3701716.3715600
    url_label: "WebTableX — WWW 2025 (ACM)"
  gxjoin:
    aliases: [gxjoin, joinability, joinable, join, transformation, transformations, generalization, explainable]
    url: https://arxiv.org/abs/2505.21860
    url_label: "GXJoin — arXiv:2505.21860"
  gxjoin-generalization:
    aliases: [generalization, relative index, recurrence, repetition, optional unit, direction, simplicity, coverage]
    url: https://arxiv.org/abs/2505.21860
    url_label: "GXJoin — arXiv:2505.21860"
  transformation-language:
    aliases: [units, literal, substr, split, splitsubstr, transformation language, string operations, how transformations work]
    url: https://arxiv.org/abs/2505.21860
    url_label: "GXJoin — arXiv:2505.21860"
  earlier:
    aliases: [earlier, older, previous, smart grid, electricity, theft detection, anomaly, iot, masters, msc thesis, botnet]
---

Soroush's published work falls into two groups: his current line on data wrangling and language models at the University of Alberta — EdgeLM, LDI, WebTableX and GXJoin — and earlier work on smart-grid and IoT data from his time at Ferdowsi University of Mashhad.

## EdgeLM: Edge Demonstrations for Language Models' Table Understanding {#edgelm}

By Soroush Omidvartehrani, Mohammadamin Habibollah, Mohammadreza Daviran and Davood Rafiei. Preprint on arXiv as 2608.04390, posted August 2026. This is his most recent work.

When a language model is used for table tasks through in-context learning, the examples it is shown largely determine how well it does. The standard approach retrieves the examples most similar to the query — but EdgeLM's argument is that similarity is the wrong target. Examples that closely resemble the query tend to agree with whatever the model was already going to predict, so they confirm the easy cases and say nothing about the hard ones.

EdgeLM instead retrieves what the paper calls edge evidence: examples that are relevant to the query and also informative about where the decision boundary lies. It looks for two complementary kinds. Data edges are nearby examples whose ground-truth labels differ from each other, which show the model exactly where the distinction falls. Model edges are similar examples that the deployed model has previously got wrong, which show it where it is prone to fail.

The method needs no retraining and no task-specific engineering. Across five data wrangling tasks, fifteen datasets and five language models — both open-weight and proprietary — it is best or near-best in every setting, and ablations show the two kinds of edge evidence help in different ways.

Code and datasets are at github.com/soroushomidvar/EdgeLM.

## LDI: Localized Data Imputation for Text-Rich Tables {#ldi}

By Soroush Omidvartehrani and Davood Rafiei. Tabular Data Analysis (TaDA) Workshop at VLDB 2026, Boston, USA. A preprint is on arXiv as 2506.16616.

LDI fills in missing values in tables whose columns contain long, messy text. Existing LLM-based imputation methods tend to hand the model an entire table or a loosely related slice of it, which hurts accuracy, does not scale, and leaves no trace of why a particular value was predicted.

LDI instead builds a small, targeted context for each individual missing value, in three phases:

Attribute selection. Rather than assuming clean functional dependencies, LDI looks for a relaxed, substring-level signal: a column is relevant to the target column if characteristic substrings within it are strongly associated with particular target values and do not appear elsewhere. Detecting the association at the substring level rather than the whole-value level is what makes it survive typos and inconsistent formatting — a phone area code still identifies a city whether it is written +1780, 780/, or 780-. Boilerplate that recurs across several different target values is discarded, because it distinguishes nothing.

Tuple selection. Among the rows that do have a value for the target column, LDI ranks candidates by how much literal text they share with the incomplete row, measured over only the attributes selected in the first phase. It then keeps the top few while forcing their target values to differ, so the examples handed to the model are both relevant and varied rather than all pointing at the same answer.

Imputation. The selected attributes and example rows go into a single prompt, and the model predicts the missing value. There is no fine-tuning and no training data.

Because the context is assembled rather than dumped, the method explains itself: for any predicted value it can say which attributes were used, what dependency pattern justified each, and which rows served as evidence. On real and synthetic datasets LDI beats state-of-the-art imputation methods, reaching up to 8% higher accuracy with hosted LLMs and larger gains with small local models — which also makes it practical to run privately.

Code and datasets for LDI are released publicly at github.com/soroushomidvar/LDI.

## WebTableX: Efficiently Discovering Web Table Transformations Through Sampling {#webtablex}

By Soroush Omidvartehrani, Arash Dargahi Nobari and Davood Rafiei. Companion Proceedings of the ACM Web Conference 2025 (WWW '25), Sydney, Australia, pages 1229 to 1233.

WebTableX attacks the cost of discovering transformations rather than their quality. The space of candidate transformations grows with the number of rows, so searching it over a full web table is slow.

The paper's answer is cluster-based table sampling. Rather than learning from every row, it groups rows by the structural pattern of their values and learns from a few representatives of each group. Rows that are structurally alike teach the same lesson, so most of them are redundant; the ones worth keeping are the ones that differ.

Existing transformation-discovery methods then run unchanged, on the sample instead of the whole table. Evaluated on two real-world web datasets — one drawn from webpage content, one from organizational forums — this improves runtime over state-of-the-art methods by one to two orders of magnitude, with negligible impact on accuracy.

Code for WebTableX and GXJoin is released together at github.com/soroushomidvar/WebTableX-GXJoin.

## GXJoin: Generalized Cell Transformations for Explainable Joinability {#gxjoin}

By Soroush Omidvartehrani, Arash Dargahi Nobari and Davood Rafiei. ADBIS 2024, the 28th European Conference on Advances in Databases and Information Systems, Bayonne, France. Published in Springer Lecture Notes in Computer Science volume 14918, pages 123 to 137. A preprint is on arXiv as 2505.21860.

GXJoin studies joinability under syntactic transformations: two columns that cannot be joined directly, but that become joinable once the values in one are rewritten. Given example pairs showing how a value in one column corresponds to a value in the other, the problem is to find the rewriting rules — and the space of candidates is enormous, growing with both the length of the values and the number of rows.

The paper's argument is that generality is what matters, not just correctness. A transformation that happens to fit three rows is less useful than one that fits three hundred, and a shorter rule is easier for a person to read and to trust on data it has not seen. GXJoin therefore optimizes for transformations that cover more rows and stay simple, and it treats those transformations as the explanation of the join rather than a by-product of it.

Evaluated on two real-world datasets across metrics for coverage and simplicity, it outperforms the state of the art by producing fewer, simpler and more explainable transformations, while also improving join performance.

## How the transformations are expressed {#transformation-language}

In this line of work a cell transformation is a sequence of small string operations, called units, whose outputs are concatenated to build the target value. GXJoin uses four:

- literal, which emits a fixed string
- substr, which takes a substring between two positions
- split, which splits the value on a separator character and returns one of the resulting tokens
- splitSubstr, which splits on a separator and then takes a substring of one token

The compound splitSubstr exists because units are concatenated rather than nested, so combining a split with a substring needs its own unit.

A transformation's coverage is the fraction of the example pairs it gets right: apply it to each source value and count how often the result equals the target.

So, for instance, turning a person's name into an institutional email address becomes a sequence like "first character of the first token, then the second token, then the literal @ualberta.ca".

## What generalization means in GXJoin {#gxjoin-generalization}

GXJoin's contribution is a set of techniques for turning specific transformations into more general ones:

Length generalization. Earlier methods index into a value by absolute position, which breaks the moment values differ in length. GXJoin indexes relative to anchor points at the start and the end of the value, so the rule can be read from either direction. That is what lets one rule handle a name with a middle name and a name without one.

Recurrence generalization. Two forms. A unit can be marked as repeating, so a rule can match a run of similar components instead of exactly one. A unit can also be marked optional, so a single rule covers rows where a component is present and rows where it is missing.

Direction generalization. Prior work guesses which of the two columns is the source, typically by picking the longer text, which misfires when a column is long only because it carries a fixed suffix. GXJoin generates transformations in both directions and keeps whichever needs fewer of them.

Simplicity as a tie-break. Among transformations that cover equally many rows, GXJoin prefers the one with fewer units and fewer parameters. This is not just aesthetic: on a small sample the more elaborate rule is the one more likely to have latched onto an accident of the data.

## Earlier work {#earlier}

Before moving to data wrangling, Soroush worked on anomaly and fraud detection in smart-grid and IoT data.

The main result of that period is "Online Electricity Theft Detection Framework for Large-Scale Smart Grid Data", with Afshin Shahrestani and Mohammad Hossein Yaghmaee Moghaddam, published in the Electric Power Systems Research journal in 2022. Related papers include "Decision Tree based Electricity Theft Detection in Smart Grid" (ICIOT 2020) and "Filter Based Time-Series Anomaly Detection in AMI using AI Approaches" (ICIOT 2021). He also co-authored a Persian-language book, "Anomaly in Power Consumption", in 2021, and his M.Sc. thesis in this area won the Best M.Sc. Thesis Award at ICIOT 2021.

Earlier still, he published on household energy consumption analysis using smart-home data — one paper of which won the Best Paper Award at the TopHPC Congress in 2019 — and on botnet design and detection, in "FUMBOT: Design, Implementation and Detection" (2018).

He is also a co-author on "Discovering and Integrating Tabular Data" with Davood Rafiei and Arash Dargahi Nobari, presented at the TaDA Workshop at VLDB 2023 in Vancouver, which surveys the area his current work sits in.
