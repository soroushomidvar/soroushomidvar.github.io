# Ask my research — Cloudflare Worker

Backend for the `/ask/` page. It retrieves passages from the site's research
corpus and asks a Workers AI model to answer from them.

```
browser (GitHub Pages)  ->  this Worker  ->  Workers AI
                                 |
                                 +-> research-corpus.json on the site
```

It runs on Cloudflare's free tier: Workers Free allows 100,000 requests/day, and
Workers AI includes 10,000 neurons/day at no charge. No credit card, no API key
in the browser.

## Why the Worker exists

Two reasons, and the second is the one people forget:

1. **The credential stays server-side.** The `AI` binding authenticates itself
   from inside the Worker. Nothing about it is visible to a visitor.
2. **Retrieval happens here, not in the browser.** If the page picked the
   context and posted it along with the question, anyone could substitute their
   own text and use the model as a general-purpose chatbot on your quota. The
   Worker only ever answers from passages it selected itself.

## Deploy

You need Node.js and a Cloudflare account. The free plan is enough; no card.

**Push the site first.** The Worker reads the corpus from the live site, so
until `/assets/json/research-corpus.json` is published it can only answer 503.
Pushing first also brings `/ask/` up in its passage-search mode, so the page is
never broken while the rest of this is in progress.

Then:

```sh
cd worker
npm install
npx wrangler login     # opens a browser
npx wrangler deploy
```

The first deploy asks you to pick a workers.dev subdomain. Afterwards, set the
endpoint in the site's `_config.yml` and push again:

```yaml
ask:
  endpoint: https://ask-my-research.<your-subdomain>.workers.dev/ask
```

### Serving it from your own domain instead

Because soroushomidvar.com is already on Cloudflare DNS, the Worker can live on
the site's own domain rather than workers.dev. The browser request is then
same-origin, so CORS never applies, and the endpoint does not depend on
workers.dev being reachable from the visitor's network.

Uncomment the `routes` line in `wrangler.jsonc`, redeploy, and use:

```yaml
ask:
  endpoint: https://soroushomidvar.com/api/ask
```

The Worker matches its paths by suffix, so one build serves both `/ask` and
`/api/ask`. The zone's DNS record has to be proxied — orange cloud — for a route
to match at all. GitHub Pages keeps serving everything outside `/api/`.

### Checking it

```sh
curl https://<your-endpoint-host>/health

curl -N -X POST https://<your-endpoint-host>/ask \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://soroushomidvar.com' \
  -d '{"question":"What is GXJoin?"}'
```

The `Origin` header matters: anything outside `ALLOWED_ORIGINS` is refused with
403, so curl without it is rejected by design. Browsers send `Origin` on every
POST, same-origin included; if an extension strips it, the Worker falls back to
`Referer` before refusing.

### If the deploy is rejected over `ratelimits`

Cloudflare does not document whether the Rate Limiting binding is available on
the free plan. If `wrangler deploy` complains about it, delete the `ratelimits`
block from `wrangler.jsonc` and deploy again — `src/index.js` checks for the
binding before using it, so the Worker runs without it. You then lean on the
origin allowlist and the size caps, which is acceptable for a personal site.

## Updating the content

Edit a file in `_knowledge/` and push. The Jekyll build regenerates
`/assets/json/research-corpus.json`, and the Worker picks it up within 15
minutes. **The Worker does not need redeploying for content changes** — only for
changes to the code in `src/`.

## Configuration

Everything is in `wrangler.jsonc` under `vars`:

| Variable          | Purpose                                                               |
| ----------------- | --------------------------------------------------------------------- |
| `ALLOWED_ORIGINS` | Comma-separated origins allowed to call `/ask`. Others get 403.       |
| `CORPUS_URL`      | Where to fetch the corpus. Change it if the domain changes.           |
| `MODEL`           | Optional. Overrides the first-choice model; blank uses the built-ins. |
| `MODEL_SCHEMA`    | `openai` or `legacy`. Only read when `MODEL` is set — see below.      |

These are not secrets, so `vars` is the right place. If you ever add a real
secret, use `npx wrangler secret put NAME` instead — never `vars`.

## Choosing a model

Workers AI meters everything in _neurons_ from one 10,000/day free pool, and
output tokens cost far more than input tokens. At roughly 2,000 input and 400
output tokens per answer, the difference between models is the difference
between a page that works all month and one that stops before lunch:

| Model                                      | ≈ neurons/answer | ≈ answers/day |
| ------------------------------------------ | ---------------: | ------------: |
| `@cf/ibm-granite/granite-4.0-h-micro`      |                7 |         1,400 |
| `@cf/meta/llama-3.2-3b-instruct`           |               21 |           460 |
| `@cf/zai-org/glm-4.7-flash` _(default)_    |               26 |           390 |
| `@cf/google/gemma-4-26b-a4b-it`            |               29 |           340 |
| `@cf/openai/gpt-oss-120b`                  |               91 |           110 |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` |              135 |            74 |

The default is `@cf/zai-org/glm-4.7-flash`. For a task that mostly restates
retrieved text in the visitor's words, it is a better trade than the 70B model
at five times the cost. Avoid the `gpt-oss-*` models here: they are reasoning
models and spend output neurons on hidden thinking you never display.

`src/index.js` tries three models in order, so a deprecated ID degrades to the
next one rather than taking the page down. Cloudflare retires model IDs on a
schedule — if answers stop working, check the model against the current
[catalog](https://developers.cloudflare.com/workers-ai/models/) first.

### The two schemas

Workers AI runs two different contracts, and this trips people up because the
wrong one fails quietly rather than erroring:

|          | Token cap               | Where the answer is          |
| -------- | ----------------------- | ---------------------------- |
| `legacy` | `max_tokens`            | `response`                   |
| `openai` | `max_completion_tokens` | `choices[0].message.content` |

The newer models — glm, gemma-4, qwen3, nemotron, kimi — are OpenAI-shaped and
deprecate `max_tokens`. The Llama family, granite and gpt-oss are legacy. Read
`.response` off an OpenAI-shaped reply and you get `undefined`, which looks
exactly like the model returning nothing.

The built-in list tags each model with its schema. If you set `MODEL` yourself,
set `MODEL_SCHEMA` to match — the response reader accepts both shapes either
way, so the cost of getting it wrong is a truncated answer, not a broken one.

Exceeding the daily allowance returns HTTP 429 (code 3036) and resets at 00:00
UTC. The Worker recognises this and tells the visitor to come back tomorrow
rather than showing a generic failure.

## Guardrails

- **Origin allowlist** — non-site origins get 403 before any model call.
- **Rate limit** — 12 questions/minute per IP via the `ratelimits` binding.
  Counters are per Cloudflare location and deliberately approximate; this is a
  brake on runaway usage, not an accounting system.
- **Size caps** — 8 KB body, 500-character question, 6 turns of history.
- **Grounding** — a question sharing no term with the corpus is refused without
  a model call, which costs nothing and cannot hallucinate.
- **Prompt injection** — the system prompt states that sources and questions are
  data rather than instructions. The page also escapes every answer before
  rendering, so a model that emits HTML cannot inject anything into the page.

## Local development

```sh
npx wrangler dev --remote
```

`--remote` is needed: the `AI` binding cannot be emulated locally, so requests
run against the real Workers AI service and draw on the same daily allowance.

By default this reads the corpus from the live site. To test against local
content, generate the corpus with `bundle exec jekyll build` and point
`CORPUS_URL` at a served copy.

Logs from the deployed Worker:

```sh
npx wrangler tail
```

## Files

| Path               | What it is                                                     |
| ------------------ | -------------------------------------------------------------- |
| `src/index.js`     | Routing, CORS, rate limiting, prompt assembly, SSE streaming.  |
| `src/retrieval.js` | BM25 over the corpus. Replace this file to swap in embeddings. |
| `wrangler.jsonc`   | Bindings and configuration.                                    |
