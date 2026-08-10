---
layout: page
permalink: /resume/
title: Resume
nav: true
nav_order: 2
---

<!-- The PDF is read live from github.com/soroushomidvar/resume, so this page
     never needs syncing. It cannot be embedded directly: raw.githubusercontent
     serves the file as application/octet-stream with x-content-type-options:
     nosniff, so a plain <iframe> would download it instead of rendering it.
     raw does send Access-Control-Allow-Origin: *, so we fetch the bytes and
     re-wrap them in a Blob tagged application/pdf, which the browser's built-in
     PDF viewer renders normally. -->

<style>
  .pdf-container {
    width: 100%;
    height: 85vh;
    border: 1px solid var(--global-divider-color);
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pdf-container iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
  .pdf-status {
    color: var(--global-text-color-light);
    font-size: 0.9rem;
    text-align: center;
    padding: 1rem;
    margin: 0;
  }
  .pdf-download {
    margin-top: 1rem;
    text-align: center;
  }
  /* Mobile browsers render an inline PDF as a single unscrollable page, so
     below tablet width skip the embed and lead with the link instead. */
  @media (max-width: 767px) {
    .pdf-container {
      display: none;
    }
    .pdf-download {
      margin-top: 0;
    }
  }
</style>

<div class="pdf-container" id="resume-viewer">
  <p class="pdf-status">Loading resume…</p>
</div>

<p class="pdf-download">
  <a href="https://raw.githubusercontent.com/soroushomidvar/resume/master/Resume.pdf">Download Resume (PDF)</a>
</p>

<script>
  (function () {
    var SRC = "https://raw.githubusercontent.com/soroushomidvar/resume/master/Resume.pdf";
    var box = document.getElementById("resume-viewer");
    if (!box) return;

    // Built with DOM calls rather than an HTML string: a link written as
    // markup inside a JS string reads as a real link to static scanners, and
    // the concatenated URL then fails the repo's link checker.
    function fail() {
      var msg = document.createElement("p");
      msg.className = "pdf-status";
      msg.appendChild(document.createTextNode("The preview could not be loaded. "));
      var link = document.createElement("a");
      link.href = SRC;
      link.textContent = "Open the resume directly";
      msg.appendChild(link);
      msg.appendChild(document.createTextNode("."));
      box.innerHTML = "";
      box.appendChild(msg);
    }

    // Don't leave "Loading…" on screen forever if the request stalls.
    var abort = new AbortController();
    var timer = setTimeout(function () {
      abort.abort();
    }, 15000);

    fetch(SRC, { signal: abort.signal })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.blob();
      })
      .then(function (data) {
        clearTimeout(timer);
        var url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
        var frame = document.createElement("iframe");
        frame.title = "Resume";
        frame.src = url;
        box.innerHTML = "";
        box.appendChild(frame);
        window.addEventListener("pagehide", function () {
          URL.revokeObjectURL(url);
        });
      })
      .catch(function () {
        clearTimeout(timer);
        fail();
      });
  })();
</script>
