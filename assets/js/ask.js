// Front end for the "Ask" page.
//
// Two modes, chosen by whether `site.ask.endpoint` is set:
//
//   assistant  - POST the question to the Cloudflare Worker, stream the answer.
//   sources    - no backend configured, so fetch the corpus and show the
//                passages that match. Still useful, and it means the page never
//                looks broken while the Worker is being set up.
//
// Retrieval for the assistant mode deliberately lives on the Worker, not here:
// if the browser chose the context, anyone could paste their own and use the
// model quota as a general-purpose chatbot.

(function () {
  "use strict";

  var root = document.getElementById("ask-app");
  if (!root) return;

  var ENDPOINT = (root.dataset.endpoint || "").trim();
  var CORPUS_URL = root.dataset.corpus;
  var MAX_QUESTION = 500;
  var HISTORY_TURNS = 6;
  // Matches the Worker's own per-turn trim. Earlier turns are sent so pronouns
  // resolve ("how does it differ?"), not to be re-grounded, so sending whole
  // answers back would only inflate every request.
  var MAX_HISTORY_CHARS = 600;

  var form = document.getElementById("ask-form");
  var input = document.getElementById("ask-input");
  var submit = document.getElementById("ask-submit");
  var thread = document.getElementById("ask-thread");
  var intro = document.getElementById("ask-intro");
  var counter = document.getElementById("ask-counter");

  var history = [];
  var busy = false;
  var turnCounter = 0;
  var corpusPromise = null;

  /* ------------------------------------------------------------ utilities */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function scrollIntoView(node) {
    if (node && node.scrollIntoView) node.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // The model is told to write plain prose with [n] citations. Everything is
  // escaped before any markup is added back, so a model that ignores that
  // instruction and emits HTML still cannot inject anything.
  function renderAnswer(node, text, sources) {
    var html = escapeHtml(text)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, function (match, group) {
        var links = group
          .split(",")
          .map(function (number) {
            var n = parseInt(number.trim(), 10);
            var source = sources && sources[n - 1];
            if (!source) return "";
            return '<a class="ask-cite" href="#ask-source-' + source.domId + '">' + n + "</a>";
          })
          .join("");
        // An unresolvable marker is left as written rather than silently
        // dropped, so a citation to a source the model invented stays visible.
        return links || match;
      });

    node.innerHTML = html
      .split(/\n{2,}/)
      .map(function (paragraph) {
        return "<p>" + paragraph.replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  /* ---------------------------------------------------------------- thread */

  function addTurn(question, turnId) {
    if (intro && !intro.hidden) intro.hidden = true;

    // One answer on the page at a time: a new question replaces the last one
    // rather than growing a transcript. Earlier turns are still sent to the
    // assistant so follow-ups like "how does it differ?" resolve.
    thread.textContent = "";

    var turn = el("div", "ask-turn");
    turn.dataset.turnId = String(turnId);

    var asked = el("div", "ask-question");
    asked.appendChild(el("span", "ask-question-label", "You asked"));
    asked.appendChild(el("p", null, question));
    turn.appendChild(asked);

    var answer = el("div", "ask-answer");
    var body = el("div", "ask-answer-body");
    var status = el("p", "ask-status");
    status.appendChild(el("span", "ask-dots"));
    status.appendChild(document.createTextNode("Searching the notes on this site"));
    body.appendChild(status);
    answer.appendChild(body);
    turn.appendChild(answer);

    thread.appendChild(turn);
    scrollIntoView(turn);

    return { id: turnId, turn: turn, body: body, status: status, answer: answer };
  }

  function decorate(view, rawSources) {
    return (rawSources || []).map(function (source, i) {
      var n = source.n || i + 1;
      return {
        n: n,
        domId: view.id + "-" + n,
        title: source.title,
        doc: source.doc,
        url: source.url,
        url_label: source.url_label,
        text: source.text,
      };
    });
  }

  // Collapsed by default when there is an answer above it, open when the
  // passages are all there is to show.
  function renderSources(view, sources, expanded) {
    if (!sources || !sources.length) return;

    var box = el("details", "ask-sources");
    box.open = Boolean(expanded);
    box.appendChild(el("summary", "ask-sources-title", "Sources"));

    var list = el("ol", "ask-sources-list");
    sources.forEach(function (source) {
      var item = el("li", "ask-source");
      item.id = "ask-source-" + source.domId;

      var title = source.url ? el("a", "ask-source-link") : el("span", "ask-source-link");
      title.textContent = source.title;
      if (source.url) {
        title.href = source.url;
        title.target = "_blank";
        title.rel = "noopener";
      }
      item.appendChild(title);

      var meta = source.url_label || source.doc;
      if (meta) item.appendChild(el("span", "ask-source-meta", meta));
      if (source.text) item.appendChild(el("p", "ask-source-text", source.text));

      list.appendChild(item);
    });

    box.appendChild(list);
    view.answer.appendChild(box);
  }

  function fail(view, message) {
    if (view.status.parentNode) view.status.remove();
    view.body.appendChild(el("p", "ask-error", message));
  }

  /* -------------------------------------------------------------- assistant */

  function trimmedHistory() {
    return history.slice(-HISTORY_TURNS).map(function (turn) {
      return { role: turn.role, content: turn.content.slice(0, MAX_HISTORY_CHARS) };
    });
  }

  function ask(question, view) {
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question, history: trimmedHistory() }),
    })
      .then(function (response) {
        if (!response.ok) {
          return response
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              throw new Error(data.error || "The assistant is unavailable (HTTP " + response.status + ").");
            });
        }
        if (!response.body) throw new Error("This browser cannot stream the answer.");
        return consume(response.body, view, question);
      })
      .catch(function (error) {
        fail(view, error.message || "Something went wrong reaching the assistant.");
      });
  }

  function consume(stream, view, question) {
    var reader = stream.getReader();
    var decoder = new TextDecoder();
    var buffer = "";
    var answerText = "";
    var sources = null;
    var prose = null;
    var errored = false;

    function handle(event, data) {
      if (event === "sources") {
        sources = decorate(view, data.sources);
      } else if (event === "token") {
        if (!prose) {
          view.status.remove();
          prose = el("div", "ask-prose");
          view.body.appendChild(prose);
        }
        answerText += data.t;
        renderAnswer(prose, answerText, sources);
      } else if (event === "error") {
        errored = true;
        fail(view, data.message || "The assistant could not finish that answer.");
      }
    }

    function drain(block) {
      var event = "message";
      var data = "";
      block.split("\n").forEach(function (line) {
        if (line.indexOf("event:") === 0) event = line.slice(6).trim();
        else if (line.indexOf("data:") === 0) data += line.slice(5).trim();
      });
      if (!data) return;
      try {
        handle(event, JSON.parse(data));
      } catch (error) {
        /* A malformed frame is not worth aborting the whole answer for. */
      }
    }

    function finish() {
      if (!answerText) {
        if (!errored) fail(view, "The assistant returned an empty answer. Please try rephrasing.");
        return;
      }
      renderSources(view, sources);
      history.push({ role: "user", content: question });
      history.push({ role: "assistant", content: answerText });
      scrollIntoView(view.answer);
    }

    function pump() {
      return reader.read().then(function (result) {
        if (result.done) {
          if (buffer.trim()) drain(buffer);
          return finish();
        }
        buffer += decoder.decode(result.value, { stream: true });
        var blocks = buffer.split("\n\n");
        buffer = blocks.pop();
        blocks.forEach(drain);
        return pump();
      });
    }

    return pump();
  }

  /* ---------------------------------------------------------------- sources */
  // Fallback when no Worker is configured. A deliberately simpler scorer than
  // the Worker's BM25 — it has a different job: surface passages to read rather
  // than assemble a context window.

  function loadCorpus() {
    if (!corpusPromise) {
      corpusPromise = fetch(CORPUS_URL).then(function (response) {
        if (!response.ok) throw new Error("Could not load the research notes.");
        return response.json();
      });
    }
    return corpusPromise;
  }

  function terms(text) {
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter(function (token) {
        return token.length > 2;
      });
  }

  function searchOnly(question, view) {
    return loadCorpus()
      .then(function (corpus) {
        var queryTerms = terms(question);
        var matches = (corpus.chunks || [])
          .map(function (chunk, order) {
            var headline = (chunk.heading + " " + (chunk.aliases || []).join(" ")).toLowerCase();
            var haystack = headline + " " + chunk.text.toLowerCase();
            var score = 0;
            queryTerms.forEach(function (term) {
              if (headline.indexOf(term) !== -1) score += 3;
              else if (haystack.indexOf(term) !== -1) score += 1;
            });
            return { chunk: chunk, score: score, order: order };
          })
          .filter(function (entry) {
            return entry.score > 0;
          })
          .sort(function (a, b) {
            return b.score - a.score || a.order - b.order;
          })
          .slice(0, 4);

        view.status.remove();

        if (!matches.length) {
          view.body.appendChild(
            el(
              "p",
              "ask-note",
              "Nothing on this site matches that. Try asking about the research on data wrangling, one of the papers, or the background and teaching."
            )
          );
          return;
        }

        renderSources(
          view,
          decorate(
            view,
            matches.map(function (entry) {
              return {
                title: entry.chunk.heading,
                doc: entry.chunk.doc_title,
                url: entry.chunk.url,
                url_label: entry.chunk.url_label,
                text: entry.chunk.text,
              };
            })
          ),
          // With no assistant connected the passages are the whole answer, so
          // do not make the visitor open them.
          true
        );
        scrollIntoView(view.answer);
      })
      .catch(function (error) {
        fail(view, error.message || "Could not load the research notes.");
      });
  }

  /* ------------------------------------------------------------------ input */

  function run(rawQuestion) {
    if (busy) return;
    var question = rawQuestion.trim().slice(0, MAX_QUESTION);
    if (!question) return;

    busy = true;
    submit.disabled = true;
    root.classList.add("is-busy");

    turnCounter += 1;
    var view = addTurn(question, turnCounter);
    var runner = ENDPOINT ? ask : searchOnly;

    Promise.resolve()
      .then(function () {
        return runner(question, view);
      })
      .catch(function (error) {
        fail(view, error.message || "Something went wrong.");
      })
      .then(function () {
        busy = false;
        submit.disabled = false;
        root.classList.remove("is-busy");
        // Only on pointer devices: refocusing on a phone reopens the keyboard
        // over the answer the visitor is trying to read.
        if (window.matchMedia && window.matchMedia("(hover: hover)").matches) input.focus();
      });
  }

  function autosize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 160) + "px";
  }

  function updateCounter() {
    if (!counter) return;
    var remaining = MAX_QUESTION - input.value.length;
    counter.textContent = remaining < 100 ? remaining + " characters left" : "";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var question = input.value;
    input.value = "";
    updateCounter();
    autosize();
    run(question);
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  });

  input.addEventListener("input", function () {
    autosize();
    updateCounter();
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-ask-suggestion]"), function (button) {
    button.addEventListener("click", function () {
      run(button.dataset.askSuggestion || button.textContent);
    });
  });

  // Clicking a citation marker reveals and highlights the passage it points at.
  thread.addEventListener("click", function (event) {
    var link = event.target.closest ? event.target.closest(".ask-cite") : null;
    if (!link) return;
    var target = document.getElementById(link.getAttribute("href").slice(1));
    if (!target) return;
    event.preventDefault();

    // The passages are collapsed by default, so a citation has to open them or
    // it would appear to do nothing.
    var box = target.closest ? target.closest("details") : null;
    if (box) box.open = true;

    target.classList.add("is-highlighted");
    scrollIntoView(target);
    setTimeout(function () {
      target.classList.remove("is-highlighted");
    }, 1600);
  });

  autosize();
})();
