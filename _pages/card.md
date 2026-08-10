---
layout: default
permalink: /card/
title: Card
description: Scan, save, or share my contact details.
nav: true
nav_order: 6
# One-line research pitch shown under the affiliation. Blank hides it entirely.
pitch:
---

<style>
  .contact-card {
    max-width: 24rem;
    margin: 0 auto 3rem;
    text-align: center;
  }
  .contact-card .card-photo {
    width: 7.5rem;
    height: 7.5rem;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 1.25rem;
  }
  .contact-card .card-name {
    font-size: 1.6rem;
    font-weight: 600;
    line-height: 1.2;
    margin-bottom: 0.4rem;
    color: var(--global-text-color);
  }
  .contact-card .card-role {
    font-size: 1rem;
    color: var(--global-text-color);
    margin-bottom: 0.15rem;
  }
  .contact-card .card-org {
    font-size: 0.95rem;
    color: var(--global-text-color-light);
    margin-bottom: 0;
  }
  /* The gap above the QR lives on the QR itself, so the card stays evenly
     spaced whether or not the optional pitch is filled in. */
  .contact-card .card-pitch {
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--global-text-color-light);
    margin: 1.1rem 0 0;
  }

  /* The QR keeps a white tile in both themes — contrast is what makes it
     scannable, so it deliberately does not follow the dark-mode palette. */
  .contact-card .card-qr {
    display: inline-block;
    margin-top: 1.75rem;
    background: #fff;
    padding: 0.5rem;
    border-radius: 0.6rem;
    border: 1px solid var(--global-divider-color);
    line-height: 0;
  }
  .contact-card .card-qr img {
    width: 10.5rem;
    height: 10.5rem;
    display: block;
    cursor: zoom-in;
  }
  .contact-card .card-qr-caption {
    font-size: 0.78rem;
    color: var(--global-text-color-light);
    margin: 0.6rem 0 1.75rem;
  }

  .contact-card .card-save {
    display: inline-block;
    width: 100%;
    padding: 0.7rem 1rem;
    border-radius: 0.5rem;
    background: var(--global-theme-color);
    color: #fff !important;
    font-weight: 600;
    font-size: 0.95rem;
    text-decoration: none !important;
    transition: filter 0.2s ease-in-out;
  }
  .contact-card .card-save:hover {
    filter: brightness(1.12);
  }
  .contact-card .card-save i {
    margin-right: 0.45rem;
  }

  .contact-card .card-links {
    margin-top: 1.5rem;
    display: flex;
    justify-content: center;
    gap: 1.4rem;
    font-size: 1.35rem;
  }
  .contact-card .card-links a {
    color: var(--global-text-color-light);
    transition: color 0.2s ease-in-out;
  }
  .contact-card .card-links a:hover {
    color: var(--global-theme-color);
  }

  /* Printing this page yields a physical card, so drop the screen-only bits. */
  @media print {
    #navbar,
    footer,
    #progress,
    .card-save {
      display: none !important;
    }
    .contact-card {
      margin-top: 0;
    }
  }
</style>

<div class="post">
  <div class="contact-card">
    <img
      class="card-photo"
      src="{{ '/assets/img/prof_pic.jpg' | relative_url }}"
      alt="Soroush Omidvartehrani"
      loading="eager"
    />

    <div class="card-name">Soroush Omidvartehrani</div>
    <div class="card-role">Ph.D. Candidate, Computing Science</div>
    <div class="card-org">University of Alberta</div>

    {% if page.pitch %}
      <p class="card-pitch">{{ page.pitch }}</p>
    {% endif %}

    <div class="card-qr">
      <img
        src="{{ '/assets/img/card-qr.svg' | relative_url }}"
        alt="QR code linking to soroushomidvar.com/card/"
        loading="eager"
        data-zoomable
      />
    </div>
    <p class="card-qr-caption">Scan to open this page — or tap the code to enlarge it.</p>

    <a
      class="card-save"
      href="{{ '/assets/card/soroush-omidvartehrani.vcf' | relative_url }}"
      download="soroush-omidvartehrani.vcf"
    >
      <i class="fa-solid fa-address-card"></i>Add to contacts
    </a>

    <div class="card-links">
      <a href="mailto:{{ site.data.socials.email | encode_email }}" title="Email">
        <i class="fa-solid fa-envelope"></i>
      </a>
      <a
        href="https://scholar.google.com/citations?user={{ site.data.socials.scholar_userid }}"
        title="Google Scholar"
      >
        <i class="ai ai-google-scholar"></i>
      </a>
      <a href="https://github.com/{{ site.data.socials.github_username }}" title="GitHub">
        <i class="fa-brands fa-github"></i>
      </a>
      <a
        href="https://www.linkedin.com/in/{{ site.data.socials.linkedin_username }}"
        title="LinkedIn"
      >
        <i class="fa-brands fa-linkedin"></i>
      </a>
      <a href="https://orcid.org/{{ site.data.socials.orcid_id }}" title="ORCID">
        <i class="ai ai-orcid"></i>
      </a>
    </div>

  </div>
</div>
