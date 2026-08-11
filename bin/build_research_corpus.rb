# Builds the research corpus outside a full Jekyll build.
#
#   ruby bin/build_research_corpus.rb [output.json]
#
# The site's own plugin (_plugins/research-corpus.rb) does the work; this script
# only supplies the handful of Jekyll objects it touches. That keeps one
# implementation rather than a preview copy that drifts from the real one.
#
# Useful for previewing /ask/ (see bin/ask-preview.mjs) and for inspecting what
# the assistant can actually see after editing _knowledge/. Runs on the macOS
# system Ruby, so it needs no toolchain of its own.

require "yaml"
require "json"
require "time"

module Jekyll
  class Generator
    def self.safe(*); end
    def self.priority(*); end
  end

  class PageWithoutAFile
    attr_accessor :content, :data
    attr_reader :dir, :name

    def initialize(_site, _base, dir, name)
      @dir = dir
      @name = name
      @data = {}
    end
  end

  def self.logger
    @logger ||= Object.new.tap do |log|
      def log.info(topic, message = nil)
        warn "#{topic} #{message}"
      end
    end
  end
end

ROOT = File.expand_path("..", __dir__)
require File.join(ROOT, "_plugins", "research-corpus.rb")

Doc = Struct.new(:data, :content, :basename, :basename_without_ext)
Collection = Struct.new(:docs)

config = YAML.load_file(File.join(ROOT, "_config.yml"))

docs = Dir[File.join(ROOT, "_knowledge", "*.md")].sort.map do |path|
  raw = File.read(path)
  match = raw.match(/\A---\s*\n(.*?)\n---\s*\n(.*)\z/m)
  abort "#{path}: missing front matter" unless match
  Doc.new(YAML.load(match[1]), match[2], File.basename(path), File.basename(path, ".md"))
end

abort "no files in _knowledge/" if docs.empty?

site = Object.new
site.define_singleton_method(:collections) { { "knowledge" => Collection.new(docs) } }
site.define_singleton_method(:config) { config }
site.define_singleton_method(:source) { ROOT }
site.define_singleton_method(:time) { Time.now }
site.define_singleton_method(:pages) { @pages ||= [] }

ResearchCorpus::Generator.new.generate(site)

page = site.pages.first
abort "the plugin produced no corpus" if page.nil?

out = ARGV[0] || File.join(ROOT, "_site", "assets", "json", "research-corpus.json")
require "fileutils"
FileUtils.mkdir_p(File.dirname(out))
File.write(out, page.content)
warn "wrote #{out} (#{page.content.bytesize} bytes)"
