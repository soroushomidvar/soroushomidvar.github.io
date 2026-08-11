// Local preview of the /ask/ page, without a Jekyll toolchain.
//
//   node bin/ask-preview.mjs [--port 4000]
//
// What is real here: the corpus (built by the site's own plugin), the page
// markup read straight from _pages/ask.md, assets/js/ask.js, and the Worker's
// own fetch handler including retrieval, prompt assembly and SSE streaming.
//
// What is not: the page shell, which is a stand-in for the al-folio layout, and
// the model, unless you supply Cloudflare credentials:
//
//   CF_ACCOUNT_ID=... CF_API_TOKEN=... node bin/ask-preview.mjs
//
// With those set, inference goes to the real Workers AI REST API and draws on
// the same daily neuron allowance as the deployed Worker. Without them, answers
// are stitched together from the retrieved passages so the interface can be
// exercised, and the page says so.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[process.argv.indexOf("--port") + 1]) || 4000;
const ACCOUNT = process.env.CF_ACCOUNT_ID;
const TOKEN = process.env.CF_API_TOKEN;
const LIVE_MODEL = Boolean(ACCOUNT && TOKEN);

/* ----------------------------------------------------------------- corpus */

const CORPUS_PATH = join(ROOT, "_site", "assets", "json", "research-corpus.json");
execFileSync("ruby", [join(ROOT, "bin", "build_research_corpus.rb"), CORPUS_PATH], { stdio: "inherit" });
const CORPUS = await readFile(CORPUS_PATH, "utf8");

// Node has no YAML parser in core, and the page only needs the `ask:` block —
// so borrow Ruby's, which is already required for the corpus build.
const ASK_CONFIG = JSON.parse(
  execFileSync("ruby", ["-ryaml", "-rjson", "-e", "puts((YAML.load_file(ARGV[0])['ask'] || {}).to_json)", join(ROOT, "_config.yml")], {
    encoding: "utf8",
  })
);

/* -------------------------------------------------------------- the model */

// Enough of the Workers AI REST contract for the Worker to be exercised
// unchanged. Errors are rethrown with their body text so the Worker's
// quota-detection sees the same strings it would in production.
async function callWorkersAI(model, options) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/run/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
  if (options.stream) return response.body;
  const payload = await response.json();
  return payload.result;
}

// Stand-in when no credentials are present: quotes the passages retrieval
// picked, with citation markers, so the streaming, citation and source
// rendering can all be judged. It is not a generated answer and does not
// pretend to be.
function stubAnswer(messages) {
  const prompt = messages[messages.length - 1].content;
  const blocks = prompt.split("\n\n").filter((block) => /^\[\d+\]/.test(block));
  const lines = blocks.slice(0, 3).map((block) => {
    const index = block.match(/^\[(\d+)\]/)[1];
    const body = block.split("\n").slice(1).join(" ");
    const sentence = body
      .split(/(?<=\.)\s/)
      .slice(0, 2)
      .join(" ");
    return `${sentence} [${index}]`;
  });
  return `No model is connected in this preview, so the text below is quoted from the passages retrieval selected rather than written by an LLM.\n\n${lines.join(
    "\n\n"
  )}`;
}

function stubStream(text) {
  const words = text.match(/\S+\s*/g) || [];
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for (const word of words) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: word })}\n\n`));
        await new Promise((resolve) => setTimeout(resolve, 18));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

const env = {
  ALLOWED_ORIGINS: `http://localhost:${PORT},http://127.0.0.1:${PORT}`,
  CORPUS_URL: `http://localhost:${PORT}/assets/json/research-corpus.json`,
  AI: {
    async run(model, options) {
      if (LIVE_MODEL) return callWorkersAI(model, options);
      const text = stubAnswer(options.messages);
      return options.stream ? stubStream(text) : { response: text };
    },
  },
};

const worker = (await import(join(ROOT, "worker", "src", "index.js"))).default;

/* ------------------------------------------------------------------- page */

// A deliberately small Liquid stand-in covering only the tags _pages/ask.md
// uses. It throws on anything it does not recognise, so the preview can never
// quietly render something different from what Jekyll would.
function renderPage(markdown, config) {
  const ask = config || {};
  let out = markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "");

  out = out.replace(/\{%\s*if site\.ask\.suggestions\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g, (_, section) =>
    section.replace(/\{%\s*for suggestion in site\.ask\.suggestions\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g, (__, item) =>
      (ask.suggestions || [])
        .map((suggestion) =>
          item.replace(/\{\{\s*suggestion\s*\|\s*escape\s*\}\}/g, escapeHtml(suggestion)).replace(/\{\{\s*suggestion\s*\}\}/g, escapeHtml(suggestion))
        )
        .join("")
    )
  );

  // The endpoint is always set in the preview, so take the "connected" branch.
  out = out.replace(/\{%\s*if site\.ask\.endpoint[\s\S]*?%\}([\s\S]*?)\{%\s*else\s*%\}[\s\S]*?\{%\s*endif\s*%\}/g, "$1");

  out = out
    .replace(/\{\{\s*site\.ask\.endpoint\s*\}\}/g, "/ask")
    .replace(/\{\{\s*site\.ask\.placeholder\s*\|\s*default:\s*'([^']*)'\s*\}\}/g, (_, fallback) => escapeHtml(ask.placeholder || fallback))
    .replace(/\{\{\s*'([^']+)'\s*\|\s*relative_url(\s*\|\s*bust_file_cache)?\s*\}\}/g, "$1");

  const leftover = out.match(/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/);
  if (leftover) throw new Error(`bin/ask-preview.mjs does not understand this Liquid: ${leftover[0]}`);

  return out;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Mirrors the variables from _sass/_themes.scss that the page actually uses.
const SHELL = (body, banner) => `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ask · preview</title>
<style>
  :root {
    --global-bg-color: #ffffff;
    --global-text-color: #000000;
    --global-text-color-light: #828282;
    --global-theme-color: #00369f;
    --global-hover-text-color: #ffffff;
    --global-divider-color: rgba(0, 0, 0, 0.1);
    --global-card-bg-color: #ffffff;
    --global-danger-block: #c00;
  }
  html[data-theme="dark"] {
    --global-bg-color: #1c1c1d;
    --global-text-color: #e8e8e8;
    --global-text-color-light: #828282;
    --global-theme-color: #2698ba;
    --global-hover-text-color: #ffffff;
    --global-divider-color: #424246;
    --global-card-bg-color: #212529;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background-color: var(--global-bg-color);
    color: var(--global-text-color);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.6;
  }
  a { color: var(--global-theme-color); }
  .wrap { max-width: 46rem; margin: 0 auto; padding: 2rem 1.25rem 6rem; }
  .bar { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: 0.5rem; }
  .post-title { font-size: 2rem; font-weight: 300; margin: 0; }
  .post-description { color: var(--global-text-color-light); margin: 0 0 2rem; }
  .toggle { border: 1px solid var(--global-divider-color); background: transparent; color: var(--global-text-color-light);
            border-radius: 999px; padding: 0.25rem 0.8rem; font-size: 0.78rem; cursor: pointer; }
  .banner { border: 1px dashed var(--global-divider-color); border-radius: 8px; padding: 0.7rem 0.9rem;
            font-size: 0.82rem; color: var(--global-text-color-light); margin-bottom: 1.75rem; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
</head>
<body>
<div class="wrap">
  <div class="bar">
    <h1 class="post-title">Ask</h1>
    <button class="toggle" id="theme-toggle" type="button">Dark</button>
  </div>
  <p class="post-description">Ask a question about my research and get an answer drawn from the notes on this site, with the sources it used.</p>
  <p class="banner">${banner}</p>
  ${body}
</div>
<script>
  document.getElementById("theme-toggle").addEventListener("click", function () {
    var root = document.documentElement;
    var dark = root.getAttribute("data-theme") === "dark";
    root.setAttribute("data-theme", dark ? "light" : "dark");
    this.textContent = dark ? "Dark" : "Light";
  });
</script>
</body>
</html>`;

const BANNER = LIVE_MODEL
  ? "<strong>Local preview.</strong> Retrieval, prompt and streaming are the deployed code; inference is going to the real Workers AI API and spending neurons."
  : "<strong>Local preview, no model connected.</strong> Retrieval, sources and streaming are real. Answer text is quoted from the retrieved passages, not generated — set CF_ACCOUNT_ID and CF_API_TOKEN for real inference.";

/* ----------------------------------------------------------------- server */

async function toRequest(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) if (typeof value === "string") headers.set(key, value);
  if (!headers.has("origin")) headers.set("origin", `http://localhost:${PORT}`);
  return new Request(`http://localhost:${PORT}${req.url}`, {
    method: req.method,
    headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  });
}

const server = createServer(async (req, res) => {
  const path = req.url.split("?")[0];

  try {
    if (path === "/ask" || path === "/health") {
      const response = await worker.fetch(await toRequest(req), env, { waitUntil() {} });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) Readable.fromWeb(response.body).pipe(res);
      else res.end();
      return;
    }

    if (path === "/assets/json/research-corpus.json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(CORPUS);
      return;
    }

    if (path === "/assets/js/ask.js") {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(await readFile(join(ROOT, "assets", "js", "ask.js"), "utf8"));
      return;
    }

    if (path === "/" || path === "/ask/") {
      const page = await readFile(join(ROOT, "_pages", "ask.md"), "utf8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(SHELL(renderPage(page, ASK_CONFIG), BANNER));
      return;
    }

    res.writeHead(404).end("not found");
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "text/plain" }).end(String(error?.stack || error));
  }
});

// Without this a second run exits with a raw EADDRINUSE dump while the older
// process keeps serving stale code — which looks exactly like an edit that did
// not take effect.
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`\n  Port ${PORT} is already in use — an earlier preview is probably still running.`);
    console.error(`  Stop it with:  pkill -f ask-preview.mjs      or choose another --port\n`);
    process.exit(1);
  }
  throw error;
});

server.listen(PORT, () => {
  console.log(`\n  Ask preview:  http://localhost:${PORT}/`);
  console.log(`  Model:        ${LIVE_MODEL ? "real Workers AI (spends neurons)" : "stubbed — passages quoted, not generated"}`);
  console.log(`  Corpus:       ${JSON.parse(CORPUS).chunks.length} chunks\n`);
});
