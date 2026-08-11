---
layout: page
permalink: /ask/
title: Ask
description: Ask a question about my research and get an answer drawn from the notes on this site, with the sources it used.
nav: false # the assistant now lives on the home page; this page is kept so /ask/ does not 404
nav_order: 3
---

<style>
  .ask-app {
    max-width: 46rem;
  }

  /* Composer ---------------------------------------------------------- */

  .ask-composer {
    border: 1px solid var(--global-divider-color);
    border-radius: 10px;
    background-color: var(--global-card-bg-color);
    padding: 0.75rem 0.9rem;
    transition: border-color 0.2s ease;
  }
  .ask-composer:focus-within {
    border-color: var(--global-theme-color);
  }
  .ask-composer textarea {
    width: 100%;
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    color: var(--global-text-color);
    font-size: 1rem;
    line-height: 1.5;
    padding: 0;
    overflow-y: auto;
  }
  .ask-composer textarea::placeholder {
    color: var(--global-text-color-light);
  }
  .ask-controls {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
  .ask-counter {
    font-size: 0.75rem;
    color: var(--global-text-color-light);
  }
  .ask-submit {
    border: 1px solid var(--global-theme-color);
    border-radius: 6px;
    background-color: var(--global-theme-color);
    color: var(--global-hover-text-color);
    font-size: 0.85rem;
    letter-spacing: 0.03em;
    padding: 0.3rem 1.1rem;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }
  .ask-submit:hover {
    opacity: 0.85;
  }
  .ask-submit:disabled {
    opacity: 0.45;
    cursor: default;
  }

  /* Suggestions ------------------------------------------------------- */

  .ask-suggestions {
    margin-top: 1.5rem;
  }
  .ask-suggestions-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--global-text-color-light);
    margin-bottom: 0.6rem;
  }
  .ask-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .ask-chip {
    border: 1px solid var(--global-divider-color);
    border-radius: 999px;
    background: transparent;
    color: var(--global-text-color);
    font-size: 0.85rem;
    padding: 0.3rem 0.85rem;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      color 0.2s ease;
  }
  .ask-chip:hover {
    border-color: var(--global-theme-color);
    color: var(--global-theme-color);
  }

  /* Thread ------------------------------------------------------------ */

  .ask-note {
    color: var(--global-text-color-light);
    font-size: 0.9rem;
    margin: 1.75rem 0 0;
  }
  .ask-turn {
    margin-top: 2.25rem;
  }
  .ask-question-label {
    display: block;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--global-text-color-light);
    margin-bottom: 0.35rem;
  }
  .ask-question p {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 500;
    line-height: 1.45;
  }
  .ask-answer {
    margin-top: 1rem;
    padding-left: 1rem;
    border-left: 2px solid var(--global-divider-color);
  }
  .ask-prose p {
    margin-bottom: 0.85rem;
    line-height: 1.65;
  }
  .ask-prose p:last-child {
    margin-bottom: 0;
  }
  .ask-error {
    margin: 0;
    color: var(--global-danger-block);
    font-size: 0.9rem;
  }

  /* The thinking indicator: three dots that fade in sequence. */
  .ask-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    color: var(--global-text-color-light);
    font-size: 0.9rem;
  }
  .ask-dots,
  .ask-dots::before,
  .ask-dots::after {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: var(--global-text-color-light);
    animation: ask-pulse 1.2s ease-in-out infinite;
  }
  .ask-dots {
    position: relative;
    display: inline-block;
    animation-delay: 0.2s;
    /* The outer dots are pseudo-elements offset 9px either side of this 5px
       box, so without matching margins the flex gap is measured from the box
       and the trailing dot collides with the text. */
    margin: 0 9px;
  }
  .ask-dots::before,
  .ask-dots::after {
    content: "";
    position: absolute;
    top: 0;
  }
  .ask-dots::before {
    left: -9px;
    animation-delay: 0s;
  }
  .ask-dots::after {
    left: 9px;
    animation-delay: 0.4s;
  }
  @keyframes ask-pulse {
    0%,
    100% {
      opacity: 0.25;
    }
    50% {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ask-dots,
    .ask-dots::before,
    .ask-dots::after {
      animation: none;
      opacity: 0.6;
    }
  }

  /* Citations and sources --------------------------------------------- */

  .ask-cite {
    display: inline-block;
    min-width: 1.15em;
    margin: 0 0.1em;
    padding: 0 0.25em;
    border-radius: 3px;
    background-color: var(--global-divider-color);
    color: var(--global-text-color);
    font-size: 0.7em;
    line-height: 1.5;
    text-align: center;
    vertical-align: super;
    text-decoration: none;
  }
  .ask-cite:hover {
    background-color: var(--global-theme-color);
    color: var(--global-hover-text-color);
  }
  .ask-sources {
    margin-top: 1.5rem;
    border-top: 1px solid var(--global-divider-color);
    padding-top: 0.75rem;
  }
  .ask-sources-title {
    font-size: 0.8rem;
    color: var(--global-text-color-light);
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .ask-sources-title:hover {
    color: var(--global-theme-color);
  }
  /* Replace the default triangle with one that can be rotated on open. */
  .ask-sources-title::-webkit-details-marker {
    display: none;
  }
  .ask-sources-title::before {
    content: "";
    flex: none;
    width: 0;
    height: 0;
    border-left: 5px solid currentColor;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    transition: transform 0.15s ease;
  }
  .ask-sources[open] > .ask-sources-title::before {
    transform: rotate(90deg);
  }
  .ask-sources-list {
    margin: 0.9rem 0 0;
    padding-left: 1.2rem;
  }
  .ask-source {
    margin-bottom: 0.6rem;
    border-radius: 4px;
    transition: background-color 0.4s ease;
  }
  .ask-source.is-highlighted {
    background-color: var(--global-divider-color);
  }
  .ask-source-link {
    font-size: 0.9rem;
    font-weight: 500;
  }
  .ask-source-meta {
    display: block;
    font-size: 0.78rem;
    color: var(--global-text-color-light);
  }
  .ask-source-text {
    margin: 0.35rem 0 0;
    font-size: 0.85rem;
    line-height: 1.55;
    color: var(--global-text-color-light);
    white-space: pre-wrap;
  }

  .ask-disclaimer {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid var(--global-divider-color);
    font-size: 0.8rem;
    line-height: 1.55;
    color: var(--global-text-color-light);
  }
</style>

<div
  id="ask-app"
  class="ask-app"
  data-endpoint="{{ site.ask.endpoint }}"
  data-corpus="{{ '/assets/json/research-corpus.json' | relative_url }}"
>
  <form id="ask-form" class="ask-composer">
    <label class="sr-only" for="ask-input">Your question</label>
    <textarea id="ask-input" rows="2" maxlength="500" placeholder="{{ site.ask.placeholder | default: 'What would you like to know?' }}"></textarea>
    <div class="ask-controls">
      <span id="ask-counter" class="ask-counter"></span>
      <button id="ask-submit" class="ask-submit" type="submit">Ask</button>
    </div>
  </form>

{% if site.ask.suggestions %}

<div class="ask-suggestions">
<h3 class="ask-suggestions-title">Suggested questions</h3>
<div class="ask-chips">
{% for suggestion in site.ask.suggestions %}
<button class="ask-chip" type="button" data-ask-suggestion="{{ suggestion | escape }}">{{ suggestion }}</button>
{% endfor %}
</div>
</div>
{% endif %}

  <p id="ask-intro" class="ask-note">
    {% if site.ask.endpoint and site.ask.endpoint != '' %}
      Every answer is written from the notes on this site and lists the passages it drew on.
    {% else %}
      The assistant is not connected yet, so this page returns the passages from the site that best match your question.
    {% endif %}
  </p>

  <div id="ask-thread"></div>

  <p class="ask-disclaimer">
    Answers are generated by a language model reading a small set of notes about my work, so treat them as a starting point rather than a citation. Follow the
    linked sources for anything that matters. Questions are not stored, and the assistant knows nothing beyond what is on this site.
  </p>
</div>

<script defer src="{{ '/assets/js/ask.js' | relative_url | bust_file_cache }}"></script>
