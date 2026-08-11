---
layout: page
permalink: /awards/
title: "Awards"
description: ""
nav: true
nav_order: 4
redirect: false
---

<style>
  /* The certificate viewer. A native <dialog> rather than a hand-rolled overlay,
     so Escape, focus trapping and the backdrop come from the browser. The links
     keep real hrefs, so anything that cannot open the dialog still works. */
  .award-viewer {
    max-width: 94vw;
    max-height: 94vh;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    overflow: visible;
  }
  .award-viewer::backdrop {
    background: rgba(0, 0, 0, 0.82);
  }
  .award-viewer img {
    display: block;
    max-width: 94vw;
    max-height: 94vh;
    width: auto;
    height: auto;
    border-radius: 6px;
  }
  /* Fixed rather than absolute: anchored to the viewport corner, so it never
     rides off-screen on a wide certificate or a narrow phone. */
  .award-viewer-close {
    position: fixed;
    top: 0.75rem;
    right: 0.9rem;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .award-viewer-close:hover,
  .award-viewer-close:focus-visible {
    background: rgba(0, 0, 0, 0.85);
  }
  a.award-photo {
    cursor: zoom-in;
  }
</style>

<p>
  - Graduate Student Teaching Award, University of Alberta (<a class="award-photo" href="{{ '/assets/img/Teaching-Award-25.jpg' | relative_url }}">2025</a>, <a class="award-photo" href="{{ '/assets/img/Teaching-Award-26.jpg' | relative_url }}">2026</a>)
</p>
<p>
  - Alberta Innovates Graduate Student Scholarship (AIGSS), University of Alberta
</p>
<p>
  - Flight PS752 Commemorative Scholarship
</p>
<p>
  - Alberta Graduate Excellence Scholarship (AGES), University of Alberta
</p>
<p>
  - Doctoral Recruitment Scholarship, University of Alberta
</p>
<p>
  - <a class="award-photo" href="{{ '/assets/img/Best-Msc.jpg' | relative_url }}"> Best M.Sc. Thesis Award at the 5th International Conference on Internet of Things and Applications</a>
</p>
<p>
  - 3rd place in the Novel Ideas for Facing the Increase in Power Consumption and the Challenge of Power Outage event, Iran’s National Elites Foundation
</p>
<p>
  - 3rd place among M.Sc. Computer Engineering students at Ferdowsi University of Mashhad
</p>
<p>
  - <a class="award-photo" href="{{ '/assets/img/Best-Paper-Tophpc.jpg' | relative_url }}"> Best Paper Award at the High Performance Computing and Big Data Analytics (TopHPC) Congress</a> 
</p>
<p>
  - 2nd place among B.Sc. Computer Engineering students at Ferdowsi University of Mashhad; directly accepted into M.Sc. program without entrance qualification exam
</p>

<dialog id="award-viewer" class="award-viewer" aria-label="Award certificate">
  <button type="button" class="award-viewer-close" aria-label="Close">&times;</button>
  <img alt="" />
</dialog>

<script>
  (function () {
    var viewer = document.getElementById("award-viewer");
    // No <dialog> support means no viewer, and the links navigate as before.
    if (!viewer || typeof viewer.showModal !== "function") return;

    var image = viewer.querySelector("img");
    var closeButton = viewer.querySelector(".award-viewer-close");
    var opener = null;

    Array.prototype.forEach.call(document.querySelectorAll("a.award-photo"), function (link) {
      link.addEventListener("click", function (event) {
        // A deliberate cmd/ctrl/shift-click still means "open this elsewhere".
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        opener = link;
        image.src = link.href;
        image.alt = link.textContent.trim();
        viewer.showModal();
      });
    });

    closeButton.addEventListener("click", function () {
      viewer.close();
    });

    // The dialog is sized to the image, so a click that lands on the dialog
    // itself came from the backdrop around it.
    viewer.addEventListener("click", function (event) {
      if (event.target === viewer) viewer.close();
    });

    // Dropping the src frees the decoded image and stops a slow certificate
    // from arriving into a closed dialog.
    viewer.addEventListener("close", function () {
      image.removeAttribute("src");
      if (opener) opener.focus();
    });
  })();
</script>
