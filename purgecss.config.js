module.exports = {
  content: ["_site/**/*.html", "_site/**/*.js"],
  css: ["_site/assets/css/*.css"],
  output: "_site/assets/css/",
  skippedContentGlobs: ["_site/assets/**/*.html"],
  // Pagination only renders when a listing spans more than one page, so a build
  // with few enough posts contains no .pagination markup and PurgeCSS drops the
  // Bootstrap rules that lay it out. The next build that does paginate then ships
  // correct HTML against a cached, already-stripped stylesheet, and the controls
  // fall back to a bulleted list. Keep these regardless of what the build emits.
  safelist: {
    standard: ["justify-content-center"],
    greedy: [/pagination/, /page-item/, /page-link/],
  },
};
