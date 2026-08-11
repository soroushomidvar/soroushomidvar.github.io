# Builds /assets/json/research-corpus.json from the `_knowledge` collection.
#
# The corpus is the single source of truth for the "Ask" page: the Cloudflare
# Worker fetches this file at runtime to retrieve passages, and the page itself
# falls back to it when no Worker is configured. Editing a file in _knowledge/
# and pushing is therefore the whole content-update workflow — nothing to
# redeploy on the Worker side.
#
# Each `## Heading` starts a new chunk. A chunk is what retrieval scores and
# what gets cited back to the visitor, so headings should read like answers to
# questions ("GXJoin", "PhD advisor"), not like chapter numbers.
#
# A knowledge file looks like this:
#
#   ---
#   title: Publications          # shown next to a source under an answer
#   order: 3                     # ordering within the corpus
#   aliases: [paper, papers]     # extra search terms for every section here
#   url: https://…               # fallback link for sections without their own
#   url_label: Google Scholar
#   sections:
#     gxjoin:                    # keys match the heading's {#id}
#       aliases: [joinability, join]
#       url: https://arxiv.org/abs/2505.21860
#       url_label: "GXJoin — arXiv"
#       pin: true                # always in context; use sparingly
#   ---
#
#   ## GXJoin: Generalized Cell Transformations {#gxjoin}
#
# Two rules worth knowing when editing:
#
#   * `aliases` exist for words a visitor would use that the prose does not.
#     Retrieval is lexical, so "supervisor" will not find a section that only
#     ever says "advisor" unless it is listed.
#   * Link targets are stripped from the text that reaches the model, and
#     sources are rendered from this front matter instead. That is deliberate:
#     a model that never sees a URL cannot invent one.

require "json"
require "time"

module ResearchCorpus
  # Chunks above this get split on paragraph boundaries. Retrieval sends a
  # handful of chunks to a small model, so a runaway section would crowd out
  # every other source.
  MAX_CHUNK_CHARS = 1800

  # Below this a trailing fragment is glued back onto the previous chunk rather
  # than standing alone — a 40-character orphan never wins retrieval and only
  # dilutes it.
  MIN_TAIL_CHARS = 300

  class Generator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      docs = site.collections["knowledge"]&.docs
      return if docs.nil? || docs.empty?

      chunks = docs
        .sort_by { |doc| [doc.data["order"] || 999, doc.basename] }
        .flat_map { |doc| chunks_for(doc, site) }

      payload = {
        "generated_at" => site.time.utc.iso8601,
        "site_url" => site.config["url"].to_s,
        "person" => {
          "name" => [site.config["first_name"], site.config["middle_name"], site.config["last_name"]].compact.join(" ").squeeze(" ").strip,
        },
        "chunks" => chunks,
      }

      page = Jekyll::PageWithoutAFile.new(site, site.source, "assets/json", "research-corpus.json")
      page.content = JSON.pretty_generate(payload)
      page.data["layout"] = nil
      page.data["sitemap"] = false
      # The corpus is prose about Liquid-adjacent topics and gets embedded
      # verbatim; a stray {{ or {% in a knowledge file must not be executed.
      page.data["render_with_liquid"] = false
      site.pages << page

      Jekyll.logger.info "Research corpus:", "#{chunks.length} chunks from #{docs.length} documents"
    end

    private

    def chunks_for(doc, site)
      doc_id = doc.basename_without_ext.sub(/\A\d+[-_]/, "")
      doc_title = doc.data["title"] || doc_id
      section_meta = doc.data["sections"] || {}
      doc_aliases = Array(doc.data["aliases"])

      sections(doc.content, doc_title).flat_map do |section|
        meta = section_meta[section[:id]] || {}
        text = to_plain_text(section[:body])
        next [] if text.empty?

        split_long(text).each_with_index.map do |part, index|
          suffix = index.zero? ? "" : "-#{index + 1}"
          {
            "id" => "#{doc_id}/#{section[:id]}#{suffix}",
            "doc" => doc_id,
            "doc_title" => doc_title,
            # Marked so that two halves of one long section do not appear as two
            # identically titled sources under an answer.
            "heading" => index.zero? ? section[:heading] : "#{section[:heading]} (continued)",
            "text" => part,
            # Doc-level aliases ride along on every section so that a question
            # phrased against the document ("what awards...") still reaches the
            # right sections even when no single heading spells it out.
            "aliases" => (doc_aliases + Array(meta["aliases"])).uniq,
            "url" => absolute_url(meta["url"] || doc.data["url"], site),
            "url_label" => meta["url_label"] || doc.data["url_label"],
            # Pinned chunks are always in context. Reserve this for the identity
            # blurb: without it, "what does he work on?" retrieves a specific
            # paper and the answer loses the thread of the wider research.
            "pin" => index.zero? && (meta["pin"] || doc.data["pin"]) ? true : false,
          }
        end
      end
    end

    # Splits on `## ` headings. Anything before the first heading becomes an
    # intro chunk carrying the document title.
    def sections(content, doc_title)
      found = []
      current = { id: "overview", heading: doc_title, lines: [] }

      content.each_line do |line|
        if (match = line.match(/\A\#\#\s+(?!\#)(.+?)\s*\z/))
          found << current
          heading = match[1]
          # Honour kramdown's explicit `{#custom-id}` so that a link published
          # elsewhere keeps working after a heading is reworded.
          id = if (explicit = heading.match(/\{\#([^}]+)\}\s*\z/))
                 heading = heading.sub(/\s*\{\#[^}]+\}\s*\z/, "")
                 explicit[1]
               else
                 slugify(heading)
               end
          current = { id: id, heading: heading, lines: [] }
        else
          current[:lines] << line
        end
      end
      found << current

      found
        .reject { |section| section[:lines].join.strip.empty? }
        .map { |section| { id: section[:id], heading: section[:heading], body: section[:lines].join } }
    end

    # Markdown the model does not need to see is removed here rather than in the
    # Worker, so the payload stays small. Link targets in particular are
    # stripped: sources are rendered from chunk metadata, so a model that never
    # sees a URL can never invent one.
    def to_plain_text(markdown)
      markdown
        .gsub(/<!--.*?-->/m, "")
        .gsub(/!\[([^\]]*)\]\([^)]*\)/, '\1')
        .gsub(/\[([^\]]+)\]\([^)]*\)/, '\1')
        .gsub(/^\s*\{:[^}]*\}\s*$/, "")
        .gsub(/`{1,3}/, "")
        .gsub(/\*\*([^*]+)\*\*/, '\1')
        .gsub(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/, '\1')
        .gsub(/\n{3,}/, "\n\n")
        .strip
    end

    def split_long(text)
      return [text] if text.length <= MAX_CHUNK_CHARS

      parts = []
      buffer = +""
      text.split(/\n\n+/).each do |paragraph|
        if !buffer.empty? && buffer.length + paragraph.length + 2 > MAX_CHUNK_CHARS
          parts << buffer.strip
          buffer = +""
        end
        buffer << paragraph << "\n\n"
      end
      tail = buffer.strip
      if !tail.empty?
        if parts.any? && tail.length < MIN_TAIL_CHARS
          parts[-1] = "#{parts[-1]}\n\n#{tail}"
        else
          parts << tail
        end
      end
      parts
    end

    def absolute_url(url, site)
      return nil if url.nil? || url.to_s.strip.empty?

      url = url.to_s.strip
      return url if url.start_with?("http://", "https://", "mailto:")

      base = site.config["url"].to_s.chomp("/") + site.config["baseurl"].to_s.chomp("/")
      base + (url.start_with?("/") ? url : "/#{url}")
    end

    def slugify(text)
      text.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-|-\z/, "")
    end
  end
end
