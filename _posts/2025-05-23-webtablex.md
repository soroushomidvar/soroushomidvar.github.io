---
layout: post
title: WebTableX — Efficiently Discovering Web Table Transformations Through Sampling
date: 2025-05-23 10:00:00
description: Sampling a few representative rows to find join rules much faster
permalink: /posts/webtablex/
tags: data-wrangling sampling
categories: papers
---

Published at the ACM Web Conference 2025 in Sydney, Australia.

## The problem

Before a rule that rewrites one column into the format of another can be used, it has to be found, and finding it is the expensive part. The method looks at pairs of matching rows, works out which string operations could turn one side into the other, and keeps the candidates that hold up across the table. The number of candidates to consider grows with the number of rows, so on a web table with hundreds of them the search gets slow.

The obvious fix is to look at fewer rows. The risk is looking at the wrong ones and missing a pattern that only a handful of rows show.

## Why it matters

Web tables are not scarce. A single integration job can involve thousands of them, pulled from pages and forums, and the search has to run again for every pair of columns. A method that takes minutes per table will not run at that scale, however good its rules are.

Most of that cost is also wasted. Rows in the same table tend to be written the same way, so the search keeps relearning the same lesson. Only the rows that break the pattern carry anything new.

## Main idea

Learn from a few rows chosen well rather than from all of them.

WebTableX groups the rows of a table by the shape of their values, so rows written the same way land together. A name with a middle name sits in a different group from a name without one, a phone number carrying an area code in a different group from one without. It then takes a few representatives from each group and hands only those to the search.

Nothing about the search itself changes. The same existing methods run unmodified, on the sample instead of the whole table. What the grouping buys is a sample that keeps the variety. The rows worth keeping are the ones that do not look like the others, and the rows safe to drop are the ones already spoken for.

## The result

WebTableX was tested on two real world collections of web tables, one gathered from webpage content and one from organizational forums. It makes existing transformation discovery methods one to two orders of magnitude faster, and the rules that come out are about as accurate as before.

Paper at [ACM](https://doi.org/10.1145/3701716.3715600). Code at [GitHub](https://github.com/soroushomidvar/WebTableX-GXJoin).
