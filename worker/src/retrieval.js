// Lexical retrieval over the research corpus.
//
// This is deliberately BM25 rather than embeddings. The corpus is a few dozen
// hand-written chunks about one person's work, where the discriminating terms
// are rare proper nouns — GXJoin, WebTableX, AIGSS, Ferdowsi. Lexical scoring
// nails exactly those, needs no vector store, and costs nothing per query,
// which keeps the whole feature inside Workers AI's free allocation. Swapping
// in embeddings later means replacing this file and nothing else.

const K1 = 1.2;
const B = 0.75;

// Repeats of a chunk's heading and aliases when building its token bag. A
// question usually names the thing it is about, and the thing it is about is
// usually the heading.
const HEADING_WEIGHT = 3;
const ALIAS_WEIGHT = 3;

const STOPWORDS = new Set(
  (
    "a about above after again against all am an and any are as at be because been before being below between both but by " +
    "can cannot could did do does doing down during each few for from further had has have having he her here hers him his " +
    "how i if in into is it its itself just me more most my no nor not of off on once only or other our out over own same " +
    "she should so some such than that the their them then there these they this those through to too under until up very " +
    "was we were what when where which while who whom why will with would you your tell explain describe give show know " +
    "want like please thanks thank hi hello"
  ).split(/\s+/)
);

// Only words longer than this are stemmed, which keeps acronyms and short
// project names intact.
const MIN_STEM_LENGTH = 5;

function stem(token) {
  if (token.length <= MIN_STEM_LENGTH) return token;
  for (const suffix of [
    "ational",
    "iveness",
    "ization",
    "izations",
    "ations",
    "ation",
    "ements",
    "ement",
    "ings",
    "ing",
    "edly",
    "ies",
    "ied",
    "ers",
    "er",
    "ed",
    "es",
    "s",
  ]) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 4) {
      let base = token.slice(0, token.length - suffix.length);
      if (suffix === "ies" || suffix === "ied") base += "y";
      return base;
    }
  }
  return token;
}

const WORD = /[a-z0-9]+/g;

// Written as one regex pass with an explicit loop rather than the obvious
// replace/split/filter/map chain. The Workers Free plan allows 10ms of CPU per
// request, and a cold isolate has to tokenise the whole corpus before it can
// answer anything; the chain version allocates four intermediate arrays per
// chunk and is several times slower.
export function tokenize(text) {
  if (!text) return [];
  const out = [];
  const lower = String(text).toLowerCase();
  WORD.lastIndex = 0;
  let match;
  while ((match = WORD.exec(lower)) !== null) {
    const token = match[0];
    if (token.length > 1 && !STOPWORDS.has(token)) out.push(stem(token));
  }
  return out;
}

/**
 * Precomputes the inverted index once per corpus fetch. The Worker caches the
 * result on the module scope, so warm isolates skip this entirely.
 */
export function buildIndex(corpus) {
  const chunks = Array.isArray(corpus?.chunks) ? corpus.chunks : [];
  const docs = chunks.map((chunk) => {
    const tokens = [
      ...tokenize(chunk.text),
      ...repeat(tokenize(chunk.heading), HEADING_WEIGHT),
      ...repeat(tokenize((chunk.aliases || []).join(" ")), ALIAS_WEIGHT),
    ];
    const frequencies = new Map();
    for (const token of tokens) frequencies.set(token, (frequencies.get(token) || 0) + 1);
    return { chunk, frequencies, length: tokens.length };
  });

  const documentFrequency = new Map();
  for (const doc of docs) {
    for (const token of doc.frequencies.keys()) {
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    }
  }

  const averageLength = docs.length ? docs.reduce((sum, doc) => sum + doc.length, 0) / docs.length : 0;
  return { docs, documentFrequency, averageLength, total: docs.length };
}

function repeat(tokens, times) {
  const out = [];
  for (let i = 0; i < times; i += 1) out.push(...tokens);
  return out;
}

/**
 * @returns {{passages: object[], matched: boolean}} `matched` is false when not
 * one query term exists anywhere in the corpus vocabulary — an off-topic
 * question. Callers use it to answer "that isn't on this site" without spending
 * a model call.
 */
export function retrieve(index, query, options = {}) {
  const limit = options.limit ?? 5;
  const perDocLimit = options.perDocLimit ?? 3;
  const budget = options.charBudget ?? 7000;

  const queryTokens = tokenize(query);
  const unique = [...new Set(queryTokens)];
  const matched = unique.some((token) => index.documentFrequency.has(token));

  const normalizedQuery = String(query || "").toLowerCase();
  const scored = index.docs.map((doc) => {
    let score = 0;
    for (const token of unique) {
      const frequency = doc.frequencies.get(token);
      if (!frequency) continue;
      const df = index.documentFrequency.get(token) || 0;
      const idf = Math.log(1 + (index.total - df + 0.5) / (df + 0.5));
      const denominator = frequency + K1 * (1 - B + (B * doc.length) / (index.averageLength || 1));
      score += idf * ((frequency * (K1 + 1)) / denominator);
    }
    // A question that spells out a heading almost verbatim ("what is
    // WebTableX") should not lose to a longer chunk that merely mentions it.
    const heading = String(doc.chunk.heading || "").toLowerCase();
    if (heading && normalizedQuery.includes(heading)) score *= 1.5;
    for (const alias of doc.chunk.aliases || []) {
      const needle = String(alias).toLowerCase();
      if (needle.length > 2 && normalizedQuery.includes(needle)) score += 2;
    }
    return { doc, score };
  });

  const pinned = scored.filter((entry) => entry.doc.chunk.pin);
  const ranked = scored.filter((entry) => entry.score > 0 && !entry.doc.chunk.pin).sort((a, b) => b.score - a.score);

  const selected = [];
  const perDoc = new Map();
  let used = 0;

  const take = (entry) => {
    if (selected.length >= limit) return;
    const text = entry.doc.chunk.text || "";
    if (used + text.length > budget && selected.length > 0) return;
    selected.push(entry);
    used += text.length;
  };

  // Pinned chunks claim their place first, before the budget can be spent, and
  // ignore the per-document cap: they are the "who is this person" framing
  // every answer needs.
  for (const entry of pinned) take(entry);

  for (const entry of ranked) {
    const key = entry.doc.chunk.doc;
    const count = perDoc.get(key) || 0;
    if (count >= perDocLimit) continue;
    const before = selected.length;
    take(entry);
    if (selected.length > before) perDoc.set(key, count + 1);
  }

  // Numbered in relevance order, so a visitor's [1] is the best match. Pinning
  // buys a guaranteed place, not a guaranteed rank: the identity blurb should
  // lead when someone asks who he is and trail when they ask about a paper.
  selected.sort((a, b) => b.score - a.score);

  return { passages: selected.map((entry) => entry.doc.chunk), matched };
}
